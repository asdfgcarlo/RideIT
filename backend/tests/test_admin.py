"""Authentication and authorization checks; never connects to the real database."""
import importlib
import os
import time
import unittest
from unittest.mock import MagicMock, patch

from werkzeug.security import generate_password_hash

with patch.dict(os.environ, {"RIDEIT_TOKEN_SECRET": "isolated-test-signing-key"}):
    backend = importlib.import_module("backend.app")


class AdminAccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = generate_password_hash("test-password-123")

    def setUp(self):
        self.client = backend.app.test_client()
        self.cursor = MagicMock()
        self.cursor.__enter__.return_value = self.cursor
        database = MagicMock()
        database.connection.cursor.return_value = self.cursor
        self.database_patch = patch.object(backend, "mysql", database)
        self.database_patch.start()
        self.addCleanup(self.database_patch.stop)
        log_patch = patch.object(backend.app.logger, "disabled", True)
        log_patch.start()
        self.addCleanup(log_patch.stop)

    def headers(self, user_id=7):
        token = backend.token_serializer.dumps({"user_id": user_id})
        return {"Authorization": f"Bearer {token}"}

    def test_missing_or_invalid_authentication_never_queries_database(self):
        for authorization in ("", "Basic abc", "Bearer", "Bearer invalid"):
            with self.subTest(authorization=authorization):
                response = self.client.get(
                    "/api/admin/stats", headers={"Authorization": authorization}
                )
                self.assertEqual(response.status_code, 401)
                self.assertNotIn("stats", response.json)
                self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.cursor.execute.assert_not_called()

    def test_expired_token_is_rejected(self):
        with patch("itsdangerous.timed.TimestampSigner.get_timestamp",
                   return_value=int(time.time()) - 7200):
            headers = self.headers()
        response = self.client.get("/api/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.cursor.execute.assert_not_called()

    def test_signed_invalid_claims_are_rejected(self):
        for claims in ({"user_id": "7"}, {}, [7], {"user_id": True}):
            with self.subTest(claims=claims):
                token = backend.token_serializer.dumps(claims)
                response = self.client.get(
                    "/api/admin/stats", headers={"Authorization": f"Bearer {token}"}
                )
                self.assertEqual(response.status_code, 401)
        self.cursor.execute.assert_not_called()

    def test_non_admin_accounts_cannot_read_counts(self):
        for role in ("Commuter", "Driver"):
            with self.subTest(role=role):
                self.cursor.fetchone.return_value = {"account_type": role}
                response = self.client.get("/api/admin/stats", headers=self.headers())
                self.assertEqual(response.status_code, 403)
                self.assertNotIn("stats", response.json)

    def test_deleted_account_cannot_use_an_existing_token(self):
        self.cursor.fetchone.return_value = None
        response = self.client.get("/api/admin/stats", headers=self.headers())
        self.assertEqual(response.status_code, 401)

    def test_admin_gets_counts_and_role_is_rechecked_after_demotion(self):
        headers = self.headers()
        counts = {"total_users": 4, "commuters": 2, "drivers": 1}
        self.cursor.fetchone.side_effect = [
            {"account_type": "Admin"}, counts, {"stations": 8},
            {"account_type": "Commuter"},
        ]
        response = self.client.get("/api/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["stats"], {**counts, "stations": 8})
        response = self.client.get("/api/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("stats", response.json)

    def test_empty_counts_stay_zero(self):
        self.cursor.fetchone.side_effect = [
            {"account_type": "Admin"},
            {"total_users": 0, "commuters": 0, "drivers": 0},
            {"stations": 0},
        ]
        response = self.client.get("/api/admin/stats", headers=self.headers())
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(value == 0 for value in response.json["stats"].values()))

    def test_database_errors_do_not_expose_details(self):
        self.cursor.execute.side_effect = RuntimeError("private database details")
        response = self.client.get("/api/admin/stats", headers=self.headers())
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("private database details", response.get_data(as_text=True))

    def test_successful_login_returns_verifiable_token_without_password_hash(self):
        self.cursor.fetchone.return_value = {
            "id": 7, "full_name": "Test Admin", "email": "admin@example.test",
            "account_type": "Admin", "password_hash": self.password_hash,
        }
        response = self.client.post("/api/login", json={
            "email": "admin@example.test", "password": "test-password-123",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["expires_in"], 3600)
        claims = backend.token_serializer.loads(response.json["access_token"], max_age=3600)
        self.assertEqual(claims, {"user_id": 7})
        self.assertNotIn("password_hash", response.json["user"])
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_wrong_password_does_not_issue_a_token(self):
        self.cursor.fetchone.return_value = {"password_hash": self.password_hash}
        response = self.client.post("/api/login", json={
            "email": "admin@example.test", "password": "wrong-password",
        })
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access_token", response.json)

    def test_public_registration_cannot_create_admins(self):
        response = self.client.post("/api/register", json={
            "full_name": "Attacker", "email": "attacker@example.test",
            "password": "test-password-123", "account_type": "Admin",
        })
        self.assertEqual(response.status_code, 400)
        self.cursor.execute.assert_not_called()

    def test_json_arrays_are_rejected_without_server_errors(self):
        for path in ("/api/login", "/api/register"):
            response = self.client.post(path, json=["invalid"])
            self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
