"""Iteration 7 backend tests — ID card download log endpoint + Discord webhook."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fivem-ems-portal.preview.emergentagent.com").rstrip("/")
ADMIN_TOKEN = "pillbox-admin-2026"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============== IDCARD LOG ENDPOINT ==============
class TestIdCardLog:
    def test_log_requires_admin_token(self, client):
        r = client.post(f"{BASE_URL}/api/admin/idcard/log", json={"full_name": "TEST_NoAuth"})
        assert r.status_code == 401

    def test_log_rejects_bad_token(self, client):
        r = client.post(
            f"{BASE_URL}/api/admin/idcard/log",
            json={"full_name": "TEST_BadAuth"},
            headers={"X-Admin-Token": "wrong-token"},
        )
        assert r.status_code == 401

    def test_log_succeeds_with_admin_token(self, client):
        payload = {
            "full_name": "TEST_Iter7 Operator",
            "callsign": "EMS-99",
            "rank": "EMT",
            "badge_number": "P-TEST7",
            "blood_type": "O+",
            "issued": "2026-01-01",
            "expires": "2028-12-31",
            "division": "TEAM PILLBOX",
        }
        r = client.post(
            f"{BASE_URL}/api/admin/idcard/log",
            json=payload,
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) >= 32

    def test_log_does_not_block_on_webhook(self, client):
        """Endpoint must return quickly — webhook is fire-and-forget."""
        payload = {
            "full_name": "TEST_NonBlocking",
            "callsign": "EMS-98",
            "rank": "PARAMEDIC",
            "badge_number": "P-TST98",
            "blood_type": "A+",
            "issued": "2026-01-01",
            "expires": "2027-12-31",
            "division": "TEAM PILLBOX",
        }
        start = time.time()
        r = client.post(
            f"{BASE_URL}/api/admin/idcard/log",
            json=payload,
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        elapsed = time.time() - start
        assert r.status_code == 200
        # Should respond within 2s (network + DB write only — webhook is async)
        assert elapsed < 3.0, f"Endpoint blocked for {elapsed:.2f}s — webhook is not async"

    def test_log_accepts_empty_payload(self, client):
        """All fields default to empty/'TEAM PILLBOX', so empty body should still work."""
        r = client.post(
            f"{BASE_URL}/api/admin/idcard/log",
            json={},
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ============== STAFF FILTER (data unchanged) ==============
class TestStaffFilterDataUnchanged:
    def test_staff_list_still_returns_is_command_field(self, client):
        r = client.get(f"{BASE_URL}/api/staff")
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        # Underlying field is still is_command (label is FE-only change)
        for s in items:
            assert "is_command" in s
            assert isinstance(s["is_command"], bool)

    def test_staff_has_both_command_and_field(self, client):
        r = client.get(f"{BASE_URL}/api/staff")
        items = r.json()
        cmd = [s for s in items if s["is_command"]]
        fld = [s for s in items if not s["is_command"]]
        assert len(cmd) > 0, "Should have some is_command=true staff (SPECIALTIES)"
        assert len(fld) > 0, "Should have some is_command=false staff (DOCTORS)"


# ============== ROUTE ALIAS BACKEND CHECK ==============
class TestHealthCheck:
    def test_api_root(self, client):
        r = client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status")
