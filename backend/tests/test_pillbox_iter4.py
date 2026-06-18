"""Iteration 4 tests — status lookup, admin status update, discord_user_id."""
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


@pytest.fixture(scope="module")
def created_app(session):
    """Create one application with discord_user_id and return it."""
    payload = {
        "full_name": "TEST_Iter4 Applicant",
        "in_game_name": "TestIter4IGN",
        "age": 25,
        "discord": "iter4.user#0001",
        "discord_user_id": "000000000000000001",  # invalid but non-empty
        "steam_hex": "steam:11000010aaaaaa1",
        "timezone": "UTC",
        "prior_experience": "Iteration 4 test.",
        "why_join": "Testing status flow.",
        "availability": "Anytime",
    }
    r = session.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    # Field must be persisted and returned
    assert data.get("discord_user_id") == "000000000000000001"
    return data


# ===== POST /api/applications discord_user_id =====
def test_create_application_with_discord_user_id(created_app):
    assert created_app["status"] == "pending"
    assert created_app["discord_user_id"] == "000000000000000001"
    assert "id" in created_app


def test_create_application_without_discord_user_id(session):
    payload = {
        "full_name": "TEST_Iter4 NoDiscordID",
        "in_game_name": "NoDID",
        "age": 22,
        "discord": "noid#0002",
        "timezone": "EST",
        "prior_experience": "x",
        "why_join": "y",
        "availability": "z",
    }
    r = session.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    # discord_user_id defaults to empty string
    assert d.get("discord_user_id", "") == ""


def test_admin_list_returns_discord_user_id(session, created_app):
    r = session.get(f"{API}/admin/applications", headers=AUTH)
    assert r.status_code == 200
    apps = r.json()
    target = next((a for a in apps if a["id"] == created_app["id"]), None)
    assert target is not None
    assert "discord_user_id" in target
    assert target["discord_user_id"] == "000000000000000001"


# ===== GET /api/applications/status/{ref} =====
def test_status_by_full_uuid(session, created_app):
    r = session.get(f"{API}/applications/status/{created_app['id']}")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ref_id"] == created_app["id"][:8].upper()
    assert d["applicant"] == "TEST_Iter4 Applicant"
    assert d["in_game_name"] == "TestIter4IGN"
    assert d["status"] == "pending"
    assert d["review_message"] == ""
    assert d["submitted_at"]
    assert d["reviewed_at"] is None


def test_status_by_short_prefix(session, created_app):
    short = created_app["id"][:8]
    r = session.get(f"{API}/applications/status/{short}")
    assert r.status_code == 200
    d = r.json()
    assert d["ref_id"] == short.upper()


def test_status_case_insensitive(session, created_app):
    short = created_app["id"][:8].upper()
    r = session.get(f"{API}/applications/status/{short}")
    assert r.status_code == 200
    assert r.json()["ref_id"] == short


def test_status_404_for_missing(session):
    r = session.get(f"{API}/applications/status/deadbeef")
    assert r.status_code == 404


def test_status_400_for_too_short(session):
    r = session.get(f"{API}/applications/status/abc")
    assert r.status_code == 400


# ===== PATCH /api/admin/applications/{id} =====
def test_patch_status_requires_token(session, created_app):
    r = session.patch(
        f"{API}/admin/applications/{created_app['id']}",
        json={"status": "accepted", "message": "ok"},
    )
    assert r.status_code == 401


def test_patch_status_invalid_status(session, created_app):
    r = session.patch(
        f"{API}/admin/applications/{created_app['id']}",
        json={"status": "yolo"},
        headers=AUTH,
    )
    assert r.status_code == 400


def test_patch_status_404_missing(session):
    r = session.patch(
        f"{API}/admin/applications/00000000-0000-0000-0000-000000000000",
        json={"status": "accepted"},
        headers=AUTH,
    )
    assert r.status_code == 404


def test_patch_status_accepted_success(session, created_app):
    # Discord DM is fire-and-forget; even invalid user_id must not crash request.
    r = session.patch(
        f"{API}/admin/applications/{created_app['id']}",
        json={"status": "accepted", "message": "Welcome aboard!"},
        headers=AUTH,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "accepted"
    assert d["review_message"] == "Welcome aboard!"
    assert d["reviewed_at"] is not None
    assert d["id"] == created_app["id"]


def test_status_after_acceptance_reflects(session, created_app):
    r = session.get(f"{API}/applications/status/{created_app['id'][:8]}")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "accepted"
    assert d["review_message"] == "Welcome aboard!"
    assert d["reviewed_at"] is not None


def test_patch_status_interview_then_reject_then_reopen(session, created_app):
    aid = created_app["id"]
    # interview
    r1 = session.patch(f"{API}/admin/applications/{aid}", json={"status": "interview", "message": "Let's chat"}, headers=AUTH)
    assert r1.status_code == 200
    assert r1.json()["status"] == "interview"
    # reject
    r2 = session.patch(f"{API}/admin/applications/{aid}", json={"status": "rejected", "message": "Not this time"}, headers=AUTH)
    assert r2.status_code == 200
    assert r2.json()["status"] == "rejected"
    # re-open
    r3 = session.patch(f"{API}/admin/applications/{aid}", json={"status": "pending", "message": ""}, headers=AUTH)
    assert r3.status_code == 200
    assert r3.json()["status"] == "pending"
