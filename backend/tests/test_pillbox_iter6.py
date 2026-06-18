"""Iteration 6 tests — Gallery endpoints + Application DELETE."""
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
    return ""


BASE_URL = _load_frontend_url().rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"
ADMIN_TOKEN = "pillbox-admin-2026"
AUTH = {"X-Admin-Token": ADMIN_TOKEN}

TINY_PNG = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII="
)


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ===== GET /api/gallery public =====
def test_gallery_get_public_returns_list(s):
    r = s.get(f"{API}/gallery")
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), list)


# ===== POST /api/admin/gallery auth =====
def test_gallery_post_requires_token(s):
    r = s.post(f"{API}/admin/gallery", json={"image_data": TINY_PNG, "caption": "x"})
    assert r.status_code == 401


def test_gallery_post_bad_image_data_returns_400(s):
    r = s.post(f"{API}/admin/gallery", json={"image_data": "not-a-data-url", "caption": ""}, headers=AUTH)
    assert r.status_code == 400, r.text


def test_gallery_post_empty_image_data_returns_400(s):
    r = s.post(f"{API}/admin/gallery", json={"image_data": "", "caption": ""}, headers=AUTH)
    assert r.status_code == 400, r.text


def test_gallery_post_oversize_returns_413(s):
    # base64 of 6MB binary  -> > 5MB threshold
    import base64
    big = base64.b64encode(b"x" * (6 * 1024 * 1024)).decode()
    payload = {"image_data": f"data:image/png;base64,{big}", "caption": "big"}
    r = s.post(f"{API}/admin/gallery", json=payload, headers=AUTH)
    assert r.status_code == 413, r.text


def test_gallery_post_success_and_get_returns_item(s):
    r = s.post(
        f"{API}/admin/gallery",
        json={"image_data": TINY_PNG, "caption": "TEST_iter6 gallery item", "uploaded_by": "tester"},
        headers=AUTH,
    )
    assert r.status_code == 200, r.text
    item = r.json()
    assert "id" in item and "image_data" in item and "caption" in item
    assert item["source"] == "admin"
    assert item["caption"] == "TEST_iter6 gallery item"
    assert item["image_data"].startswith("data:image/png;base64,")
    assert "created_at" in item
    gid = item["id"]

    try:
        # GET /api/gallery should include this item near the top (desc by created_at)
        g = s.get(f"{API}/gallery")
        assert g.status_code == 200
        items = g.json()
        assert any(it["id"] == gid for it in items)
        # ordering: newest first
        if len(items) >= 2:
            ts = [it.get("created_at") for it in items if it.get("created_at")]
            assert ts == sorted(ts, reverse=True), "items not sorted desc by created_at"
    finally:
        d = s.delete(f"{API}/admin/gallery/{gid}", headers=AUTH)
        assert d.status_code == 200


# ===== DELETE /api/admin/gallery/{id} =====
def test_gallery_delete_requires_token(s):
    # Create one first
    r = s.post(f"{API}/admin/gallery", json={"image_data": TINY_PNG, "caption": "TEST_del"}, headers=AUTH)
    assert r.status_code == 200
    gid = r.json()["id"]
    try:
        # no token
        d = s.delete(f"{API}/admin/gallery/{gid}")
        assert d.status_code == 401
    finally:
        s.delete(f"{API}/admin/gallery/{gid}", headers=AUTH)


def test_gallery_delete_404_for_missing(s):
    d = s.delete(f"{API}/admin/gallery/does-not-exist-xyz", headers=AUTH)
    assert d.status_code == 404


def test_gallery_delete_removes_item(s):
    r = s.post(f"{API}/admin/gallery", json={"image_data": TINY_PNG, "caption": "TEST_remove"}, headers=AUTH)
    assert r.status_code == 200
    gid = r.json()["id"]
    d = s.delete(f"{API}/admin/gallery/{gid}", headers=AUTH)
    assert d.status_code == 200
    # Verify gone
    items = s.get(f"{API}/gallery").json()
    assert not any(it["id"] == gid for it in items)


# ===== DELETE /api/admin/applications/{id} =====
def _new_application(s):
    payload = {
        "full_name": "TEST_iter6 Delete Me",
        "in_game_name": "TEST_DelGame",
        "age": 22,
        "discord": "test#1234",
        "discord_user_id": "",
        "steam_hex": "steam:11000010000abcd",
        "timezone": "UTC",
        "prior_experience": "none",
        "why_join": "for testing",
        "availability": "weekends",
    }
    r = s.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def test_application_delete_requires_token(s):
    aid = _new_application(s)
    try:
        d = s.delete(f"{API}/admin/applications/{aid}")
        assert d.status_code == 401
    finally:
        s.delete(f"{API}/admin/applications/{aid}", headers=AUTH)


def test_application_delete_404_for_missing(s):
    d = s.delete(f"{API}/admin/applications/missing-xxx-id", headers=AUTH)
    assert d.status_code == 404


def test_application_delete_removes(s):
    aid = _new_application(s)
    d = s.delete(f"{API}/admin/applications/{aid}", headers=AUTH)
    assert d.status_code == 200
    # confirm gone
    lst = s.get(f"{API}/admin/applications", headers=AUTH).json()
    assert not any(a["id"] == aid for a in lst)
