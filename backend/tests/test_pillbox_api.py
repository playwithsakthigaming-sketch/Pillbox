"""Backend API tests for Team Pillbox EMS."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fivem-ems-portal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

REQUIRED_STAFF_FIELDS = {
    "id", "name", "callsign", "rank", "role", "badge_number",
    "photo_url", "bio", "certifications", "specialties",
    "years_served", "response_count", "is_command",
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ===== STAFF =====
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_list_staff(session):
    r = session.get(f"{API}/staff")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 8, f"Expected 8 seeded staff, got {len(data)}"
    for member in data:
        missing = REQUIRED_STAFF_FIELDS - set(member.keys())
        assert not missing, f"Missing fields: {missing}"
        assert isinstance(member["certifications"], list)
        assert isinstance(member["specialties"], list)
        assert isinstance(member["is_command"], bool)
    # command members should be first due to sort
    assert data[0]["is_command"] is True


def test_get_staff_by_id(session):
    listing = session.get(f"{API}/staff").json()
    sid = listing[0]["id"]
    r = session.get(f"{API}/staff/{sid}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == sid
    assert body["name"] == listing[0]["name"]


def test_get_staff_404(session):
    r = session.get(f"{API}/staff/does-not-exist-uuid")
    assert r.status_code == 404


# ===== APPLICATIONS =====
def test_create_application_and_list(session):
    payload = {
        "full_name": "TEST_Applicant One",
        "in_game_name": "TestMedicIGN",
        "age": 22,
        "discord": "test.user#0001",
        "steam_hex": "steam:11000010abcdef0",
        "timezone": "UTC-5",
        "prior_experience": "Played EMS on other servers for 200+ hours.",
        "why_join": "Looking for serious RP.",
        "availability": "Evenings/Weekends",
    }
    r = session.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert "id" in created
    assert created["full_name"] == payload["full_name"]
    assert created["status"] == "pending"
    assert "submitted_at" in created

    # list and find it
    r2 = session.get(f"{API}/applications")
    assert r2.status_code == 200
    apps = r2.json()
    assert isinstance(apps, list)
    assert any(a["id"] == created["id"] for a in apps)


def test_create_application_validation(session):
    # missing required fields
    r = session.post(f"{API}/applications", json={"full_name": "x"})
    assert r.status_code == 422


# ===== STATS =====
def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    for key in ["active_personnel", "applications_received", "total_responses", "years_in_service"]:
        assert key in data
        assert isinstance(data[key], int)
    assert data["active_personnel"] == 8
    assert data["years_in_service"] == 8
    assert data["total_responses"] > 0
