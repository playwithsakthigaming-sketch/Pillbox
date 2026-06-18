"""Backend API tests for Team Pillbox EMS — covers public + admin routes."""
import os
import pytest
import requests

# Load frontend .env to discover the public backend URL (preview ingress)
def _load_frontend_url():
    p = "/app/frontend/.env"
    if os.path.exists(p):
        with open(p) as fh:
            for line in fh:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("REACT_APP_BACKEND_URL", "")


BASE_URL = _load_frontend_url().rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"
ADMIN_TOKEN = "pillbox-admin-2026"
WRONG_TOKEN = "nope-not-the-token"
AUTH_HEADERS = {"X-Admin-Token": ADMIN_TOKEN}

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


# ===== ROOT / STAFF (public) =====
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_list_staff(session):
    r = session.get(f"{API}/staff")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 8, f"Expected >=8 seeded staff, got {len(data)}"
    for member in data:
        missing = REQUIRED_STAFF_FIELDS - set(member.keys())
        assert not missing, f"Missing fields: {missing}"
    assert data[0]["is_command"] is True


def test_get_staff_by_id(session):
    listing = session.get(f"{API}/staff").json()
    sid = listing[0]["id"]
    r = session.get(f"{API}/staff/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid


def test_get_staff_404(session):
    r = session.get(f"{API}/staff/does-not-exist-uuid")
    assert r.status_code == 404


# ===== APPLICATIONS (public POST, with empty webhook should NOT crash) =====
def test_create_application_empty_webhook_ok(session):
    payload = {
        "full_name": "TEST_Webhook Empty",
        "in_game_name": "TestMedicIGN",
        "age": 22,
        "discord": "test.user#0001",
        "steam_hex": "steam:11000010abcdef0",
        "timezone": "UTC-5",
        "prior_experience": "Played EMS on other servers.",
        "why_join": "Looking for serious RP.",
        "availability": "Evenings/Weekends",
    }
    r = session.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["full_name"] == payload["full_name"]
    assert created["status"] == "pending"
    assert "id" in created and "submitted_at" in created


def test_create_application_validation(session):
    r = session.post(f"{API}/applications", json={"full_name": "x"})
    assert r.status_code == 422


def test_public_applications_get_is_not_exposed(session):
    """Old public GET /api/applications should no longer exist or be public."""
    r = session.get(f"{API}/applications")
    # FastAPI returns 405 (method not allowed) if route only has POST; 404 also acceptable
    assert r.status_code in (404, 405), r.status_code


# ===== STATS =====
def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    for key in ["active_personnel", "applications_received", "total_responses", "years_in_service"]:
        assert key in data and isinstance(data[key], int)


# ===== ADMIN LOGIN =====
def test_admin_login_success(session):
    r = session.post(f"{API}/admin/login", json={"token": ADMIN_TOKEN})
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_admin_login_wrong_token(session):
    r = session.post(f"{API}/admin/login", json={"token": WRONG_TOKEN})
    assert r.status_code == 401


# ===== ADMIN APPLICATIONS =====
def test_admin_applications_requires_token(session):
    r = session.get(f"{API}/admin/applications")
    assert r.status_code == 401


def test_admin_applications_with_token(session):
    r = session.get(f"{API}/admin/applications", headers=AUTH_HEADERS)
    assert r.status_code == 200, r.text
    apps = r.json()
    assert isinstance(apps, list)
    # we created at least one in earlier test
    assert any(a["full_name"].startswith("TEST_") for a in apps)


# ===== ADMIN STAFF CRUD =====
NEW_STAFF_PAYLOAD = {
    "name": "TEST_Admin Created",
    "callsign": "EMS-TST",
    "rank": "EMT",
    "role": "Field Medic",
    "badge_number": "P-TST",
    "years_served": 1,
    "photo_url": "",
    "bio": "Created during automated tests.",
    "certifications": ["EMT-B"],
    "specialties": ["Testing"],
    "response_count": 0,
    "is_command": False,
    "contact_discord": "test.bot",
}


def test_admin_create_staff_requires_token(session):
    r = session.post(f"{API}/admin/staff", json=NEW_STAFF_PAYLOAD)
    assert r.status_code == 401


def test_admin_staff_full_crud(session):
    # CREATE
    r = session.post(f"{API}/admin/staff", json=NEW_STAFF_PAYLOAD, headers=AUTH_HEADERS)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["name"] == NEW_STAFF_PAYLOAD["name"]
    sid = created["id"]

    # GET (public) - verify persistence
    g = session.get(f"{API}/staff/{sid}")
    assert g.status_code == 200
    assert g.json()["callsign"] == NEW_STAFF_PAYLOAD["callsign"]

    # PATCH without token -> 401
    r401 = session.patch(f"{API}/admin/staff/{sid}", json={"rank": "Paramedic"})
    assert r401.status_code == 401

    # PATCH with token
    rp = session.patch(f"{API}/admin/staff/{sid}", json={"rank": "Paramedic"}, headers=AUTH_HEADERS)
    assert rp.status_code == 200
    assert rp.json()["rank"] == "Paramedic"

    # Verify persisted
    g2 = session.get(f"{API}/staff/{sid}")
    assert g2.json()["rank"] == "Paramedic"

    # PATCH missing id -> 404
    r404 = session.patch(f"{API}/admin/staff/non-existent-id", json={"rank": "x"}, headers=AUTH_HEADERS)
    assert r404.status_code == 404

    # DELETE without token -> 401
    rd401 = session.delete(f"{API}/admin/staff/{sid}")
    assert rd401.status_code == 401

    # DELETE with token
    rd = session.delete(f"{API}/admin/staff/{sid}", headers=AUTH_HEADERS)
    assert rd.status_code == 200
    assert rd.json().get("ok") is True

    # Verify removal
    g3 = session.get(f"{API}/staff/{sid}")
    assert g3.status_code == 404


def test_admin_delete_nonexistent(session):
    r = session.delete(f"{API}/admin/staff/no-such-id", headers=AUTH_HEADERS)
    assert r.status_code == 404
