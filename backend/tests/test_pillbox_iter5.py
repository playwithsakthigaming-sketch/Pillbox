"""Iteration 5 tests — experience_cities, stats reshape, response_count removal."""
import os
import pytest
import requests


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
AUTH = {"X-Admin-Token": ADMIN_TOKEN}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ===== GET /api/staff structure =====
def test_staff_has_experience_cities_no_response_count(session):
    r = session.get(f"{API}/staff")
    assert r.status_code == 200, r.text
    items = r.json()
    assert len(items) > 0
    for m in items:
        assert "experience_cities" in m, "experience_cities missing"
        assert isinstance(m["experience_cities"], list)
        assert "response_count" not in m, "response_count leaked"
        for c in m["experience_cities"]:
            assert "city" in c and "grade" in c and "months" in c
            assert isinstance(c["months"], int)


# ===== GET /api/stats shape =====
def test_stats_has_only_three_keys(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) == {"active_personnel", "teams_in_cities", "years_in_service"}
    assert "total_responses" not in data
    assert "applications_received" not in data
    assert isinstance(data["active_personnel"], int)
    assert isinstance(data["teams_in_cities"], int)
    assert isinstance(data["years_in_service"], int)


def test_stats_teams_in_cities_matches_distinct_cities(session):
    staff = session.get(f"{API}/staff").json()
    cities = set()
    for m in staff:
        for c in m.get("experience_cities", []):
            if c.get("city"):
                cities.add(c["city"])
    expected = len(cities)
    stats = session.get(f"{API}/stats").json()
    assert stats["teams_in_cities"] == expected, (
        f"Expected teams_in_cities={expected} from staff data, got {stats['teams_in_cities']}"
    )
    # active_personnel matches live staff count
    assert stats["active_personnel"] == len(staff)


# ===== POST /api/admin/staff with experience_cities =====
def test_create_staff_with_experience_cities(session):
    payload = {
        "name": "TEST_Iter5 Cities",
        "callsign": "EMS-I5A",
        "rank": "EMT",
        "role": "Field Medic",
        "badge_number": "P-I5A",
        "years_served": 1,
        "certifications": ["EMT-B"],
        "specialties": ["Testing"],
        "experience_cities": [
            {"city": "Vinewood", "grade": "Junior", "months": 4},
            {"city": "Grapeseed", "grade": "Senior", "months": 12},
        ],
        "is_command": False,
        "contact_discord": "test.i5a",
    }
    r = session.post(f"{API}/admin/staff", json=payload, headers=AUTH)
    assert r.status_code == 200, r.text
    created = r.json()
    sid = created["id"]
    try:
        assert created["experience_cities"] == [
            {"city": "Vinewood", "grade": "Junior", "months": 4},
            {"city": "Grapeseed", "grade": "Senior", "months": 12},
        ]
        # Confirm persisted via public GET
        g = session.get(f"{API}/staff/{sid}").json()
        assert g["experience_cities"][0]["city"] == "Vinewood"
        assert g["experience_cities"][1]["months"] == 12
        assert "response_count" not in g
    finally:
        session.delete(f"{API}/admin/staff/{sid}", headers=AUTH)


# ===== PATCH /api/admin/staff/{id} with experience_cities =====
def test_patch_staff_experience_cities(session):
    # create blank
    create = session.post(
        f"{API}/admin/staff",
        json={
            "name": "TEST_Iter5 Patch",
            "callsign": "EMS-I5B",
            "rank": "EMT",
            "role": "Field Medic",
            "badge_number": "P-I5B",
        },
        headers=AUTH,
    )
    assert create.status_code == 200
    sid = create.json()["id"]
    try:
        new_cities = [{"city": "Sandy Shores", "grade": "Lead", "months": 9}]
        r = session.patch(
            f"{API}/admin/staff/{sid}",
            json={"experience_cities": new_cities},
            headers=AUTH,
        )
        assert r.status_code == 200, r.text
        assert r.json()["experience_cities"] == new_cities
        # Verify persisted
        g = session.get(f"{API}/staff/{sid}").json()
        assert g["experience_cities"] == new_cities
    finally:
        session.delete(f"{API}/admin/staff/{sid}", headers=AUTH)


# ===== PATCH validates months type =====
def test_patch_staff_invalid_months_type_returns_422(session):
    create = session.post(
        f"{API}/admin/staff",
        json={
            "name": "TEST_Iter5 BadMonths",
            "callsign": "EMS-I5C",
            "rank": "EMT",
            "role": "Field Medic",
            "badge_number": "P-I5C",
        },
        headers=AUTH,
    )
    assert create.status_code == 200
    sid = create.json()["id"]
    try:
        r = session.patch(
            f"{API}/admin/staff/{sid}",
            json={"experience_cities": [{"city": "X", "grade": "Y", "months": "abc"}]},
            headers=AUTH,
        )
        assert r.status_code == 422, r.text
    finally:
        session.delete(f"{API}/admin/staff/{sid}", headers=AUTH)


def test_create_staff_invalid_months_type_returns_422(session):
    payload = {
        "name": "TEST_Iter5 BadCreate",
        "callsign": "EMS-I5D",
        "rank": "EMT",
        "role": "Field Medic",
        "badge_number": "P-I5D",
        "experience_cities": [{"city": "X", "grade": "Y", "months": "abc"}],
    }
    r = session.post(f"{API}/admin/staff", json=payload, headers=AUTH)
    assert r.status_code == 422, r.text


# ===== Migration: response_count must be gone from any existing doc =====
def test_no_response_count_in_admin_create_response(session):
    # Even if the client sends response_count it should be ignored, not stored
    payload = {
        "name": "TEST_Iter5 ExtraField",
        "callsign": "EMS-I5E",
        "rank": "EMT",
        "role": "Field Medic",
        "badge_number": "P-I5E",
        "response_count": 999,  # legacy field
    }
    r = session.post(f"{API}/admin/staff", json=payload, headers=AUTH)
    assert r.status_code == 200
    sid = r.json()["id"]
    try:
        assert "response_count" not in r.json()
        g = session.get(f"{API}/staff/{sid}").json()
        assert "response_count" not in g
    finally:
        session.delete(f"{API}/admin/staff/{sid}", headers=AUTH)
