
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import MySQLdb.cursors

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["MYSQL_HOST"] = os.getenv("MYSQL_HOST", "rideidb-inkedwithch.b.aivencloud.com")
app.config["MYSQL_USER"] = os.getenv("MYSQL_USER", "avnadmin")
app.config["MYSQL_PASSWORD"] = os.getenv("MYSQL_PASSWORD", "AVNS_YmxhGs96fydc2e-8hzp")
app.config["MYSQL_DB"] = os.getenv("MYSQL_DB", "rideit_db")
app.config["MYSQL_PORT"] = int(os.getenv("MYSQL_PORT", "22791"))
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

mysql = MySQL(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "RideIT API is running!"
    }), 200


@app.route("/api/health", methods=["GET"])
def health():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1 AS result")
        cursor.fetchone()
        cursor.close()

        return jsonify({
            "success": True,
            "message": "API and MySQL connection are working!"
        }), 200

    except Exception:
        app.logger.exception("Database health check failed")
        return jsonify({
            "success": False,
            "message": "Database connection failed."
        }), 500


@app.route("/api/stations", methods=["GET"])
def get_stations():
    try:
        with mysql.connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, station_name FROM carousel_stations ORDER BY id"
            )
            stations = cursor.fetchall()
        return jsonify({"success": True, "stations": stations}), 200
    except Exception:
        app.logger.exception("Loading stations failed")
        return jsonify({
            "success": False,
            "message": "Unable to load stations. Please try again."
        }), 500


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    account_type = data.get("account_type", "Commuter")

    if not isinstance(password, str):
        return jsonify({
            "success": False,
            "message": "Invalid password."
        }), 400

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Full name, email, and password are required."
        }), 400

    if len(full_name) > 100 or len(email) > 255:
        return jsonify({
            "success": False,
            "message": "Name or email is too long."
        }), 400

    if "@" not in email:
        return jsonify({
            "success": False,
            "message": "Please provide a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters."
        }), 400

    if account_type not in ("Commuter", "Driver"):
        return jsonify({
            "success": False,
            "message": "Account type must be Commuter or Driver."
        }), 400

    password_hash = generate_password_hash(password)

    try:
        cursor = mysql.connection.cursor()

        cursor.execute(
            """
            INSERT INTO users
                (full_name, email, password_hash, account_type)
            VALUES (%s, %s, %s, %s)
            """,
            (full_name, email, password_hash, account_type)
        )

        mysql.connection.commit()
        user_id = cursor.lastrowid
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Account registered successfully!",
            "user": {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "account_type": account_type
            }
        }), 201

    except MySQLdb.IntegrityError:
        mysql.connection.rollback()
        return jsonify({
            "success": False,
            "message": "This email is already registered."
        }), 409

    except Exception:
        mysql.connection.rollback()
        app.logger.exception("Registration failed")
        return jsonify({
            "success": False,
            "message": "Registration failed due to a server error."
        }), 500


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    try:
        cursor = mysql.connection.cursor()

        cursor.execute(
            """
            SELECT id, full_name, email, password_hash, account_type
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()
        cursor.close()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "account_type": user["account_type"]
            }
        }), 200

    except Exception:
        app.logger.exception("Login failed")
        return jsonify({
            "success": False,
            "message": "Login failed due to a server error."
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
