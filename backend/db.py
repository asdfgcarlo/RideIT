
from collections.abc import Mapping
from pathlib import Path

from flask import current_app
from flask_mysqldb import MySQL


def database_config(
    environ: Mapping[str, str],
    base_dir: Path = Path(__file__).resolve().parent,
    secrets_dir: Path = Path("/etc/secrets"),
) -> dict:
    """Accept both the original DB_* settings and Flask's MYSQL_* names."""
    def setting(name, alias, default=""):
        return environ.get(name) or environ.get(alias) or default

    try:
        port = int(setting("MYSQL_PORT", "DB_PORT", "3306"))
    except ValueError:
        raise RuntimeError("MYSQL_PORT or DB_PORT must be a number from 1 to 65535.") from None
    if not 1 <= port <= 65535:
        raise RuntimeError("MYSQL_PORT or DB_PORT must be a number from 1 to 65535.")

    config = {
        "MYSQL_HOST": setting("MYSQL_HOST", "DB_HOST", "localhost").strip(),
        "MYSQL_USER": setting("MYSQL_USER", "DB_USER", "root").strip(),
        "MYSQL_PASSWORD": setting("MYSQL_PASSWORD", "DB_PASSWORD"),
        "MYSQL_DB": setting("MYSQL_DB", "DB_NAME", "rideit_db").strip(),
        "MYSQL_PORT": port,
        "MYSQL_CURSORCLASS": "DictCursor",
    }
    ca_value = setting("MYSQL_SSL_CA", "DB_SSL_CA").strip()
    if ca_value:
        ca_path = Path(ca_value).expanduser()
        if not ca_path.is_absolute():
            candidates = (
                base_dir / ca_path,
                base_dir.parent / ca_path,
                secrets_dir / ca_path.name,
            )
            ca_path = next((path for path in candidates if path.is_file()), candidates[0])
        config["MYSQL_CUSTOM_OPTIONS"] = {
            "ssl": {"ca": str(ca_path)},
            "ssl_mode": "VERIFY_IDENTITY",
        }
    return config


class RideITMySQL(MySQL):
    @property
    def connect(self):
        options = current_app.config.get("MYSQL_CUSTOM_OPTIONS") or {}
        ca_path = options.get("ssl", {}).get("ca")
        if ca_path and not Path(ca_path).is_file():
            raise RuntimeError(
                "Database CA certificate is missing. Set MYSQL_SSL_CA or DB_SSL_CA "
                "to an existing CA file. On Render, upload the Aiven CA certificate "
                "as Secret File ca.pem and set DB_SSL_CA=/etc/secrets/ca.pem."
            )
        return super().connect


mysql = RideITMySQL()
