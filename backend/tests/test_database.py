"""Database configuration checks; the driver is mocked before any connection."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from flask import Flask
from MySQLdb.cursors import DictCursor

from backend.db import RideITMySQL, database_config


class DatabaseConfigurationTests(unittest.TestCase):
    def setUp(self):
        temporary = TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.base = self.root / "backend"
        self.base.mkdir()
        self.secrets = self.root / "secrets"
        self.secrets.mkdir()

    def config(self, values):
        return database_config(values, base_dir=self.base, secrets_dir=self.secrets)

    def connect_options(self, values):
        app = Flask(__name__)
        app.config.update(self.config(values))
        database = RideITMySQL(app)
        with app.app_context(), patch("flask_mysqldb.MySQLdb.connect") as connect:
            database.connection
            connect.assert_called_once()
            return connect.call_args.kwargs

    def test_defaults_reach_driver_without_tls_override(self):
        options = self.connect_options({})
        self.assertEqual(options["host"], "localhost")
        self.assertEqual(options["user"], "root")
        self.assertEqual(options["db"], "rideit_db")
        self.assertEqual(options["port"], 3306)
        self.assertIs(options["cursorclass"], DictCursor)
        self.assertNotIn("passwd", options)
        self.assertNotIn("ssl", options)
        self.assertNotIn("ssl_mode", options)

    def test_legacy_names_and_password_whitespace_reach_driver(self):
        options = self.connect_options({
            "DB_HOST": "database.example.test", "DB_USER": "rideit",
            "DB_PASSWORD": "  password with spaces  ", "DB_NAME": "rides",
            "DB_PORT": "22791", "MYSQL_HOST": "",
        })
        self.assertEqual(options["host"], "database.example.test")
        self.assertEqual(options["user"], "rideit")
        self.assertEqual(options["passwd"], "  password with spaces  ")
        self.assertEqual(options["db"], "rides")
        self.assertEqual(options["port"], 22791)

    def test_canonical_names_take_precedence(self):
        values = {"MYSQL_HOST": "current", "DB_HOST": "legacy",
                  "MYSQL_USER": "current", "DB_USER": "legacy",
                  "MYSQL_PASSWORD": "current", "DB_PASSWORD": "legacy",
                  "MYSQL_DB": "current", "DB_NAME": "legacy",
                  "MYSQL_PORT": "3307", "DB_PORT": "3308"}
        options = self.connect_options(values)
        for key in ("host", "user", "passwd", "db"):
            self.assertEqual(options[key], "current")
        self.assertEqual(options["port"], 3307)

    def test_invalid_ports_report_setting_without_echoing_value(self):
        for key in ("MYSQL_PORT", "DB_PORT"):
            for value in ("do-not-echo-value", "0", "65536"):
                with self.subTest(key=key, value=value):
                    with self.assertRaisesRegex(RuntimeError, key) as error:
                        self.config({key: value})
                    self.assertNotIn("do-not-echo-value", str(error.exception))

    def test_ca_paths_resolve_and_enable_identity_verification(self):
        candidates = ((self.base / "local.pem", "local.pem"),
                      (self.root / "shared.pem", "shared.pem"),
                      (self.secrets / "mounted.pem", "mounted.pem"),
                      (self.root / "absolute.pem", str(self.root / "absolute.pem")))
        for path, value in candidates:
            path.write_text("test certificate", encoding="utf-8")
            with self.subTest(path=path):
                options = self.connect_options({"DB_SSL_CA": value})
                self.assertEqual(options["ssl"], {"ca": str(path)})
                self.assertEqual(options["ssl_mode"], "VERIFY_IDENTITY")

    def test_canonical_ca_takes_precedence(self):
        path = self.base / "current.pem"
        path.write_text("test certificate", encoding="utf-8")
        options = self.connect_options({"MYSQL_SSL_CA": str(path),
                                        "DB_SSL_CA": "missing-legacy.pem"})
        self.assertEqual(options["ssl"], {"ca": str(path)})

    def test_missing_ca_fails_lazily_without_connecting_or_downgrading(self):
        app = Flask(__name__)
        config = self.config({"DB_SSL_CA": "missing.pem"})
        self.assertEqual(config["MYSQL_CUSTOM_OPTIONS"]["ssl_mode"], "VERIFY_IDENTITY")
        app.config.update(config)
        database = RideITMySQL(app)
        with app.app_context(), patch("flask_mysqldb.MySQLdb.connect") as connect:
            with self.assertRaises(RuntimeError):
                database.connection
            connect.assert_not_called()


if __name__ == "__main__":
    unittest.main()
