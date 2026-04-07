import mysql.connector
import os

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQLHOST", "localhost"),
        user=os.getenv("MYSQLUSER", "root"),
        password=os.getenv("MYSQLPASSWORD", "pass123"),
        database=os.getenv("MYSQLDATABASE", "face_attendance"),
        port=int(os.getenv("MYSQLPORT", 3306))
    )

def get_user(role: str, email: str):
    table_map = {
        "Admin": "admin",
        "Faculty": "faculty",
        "Student": "students"
    }

    table = table_map.get(role)
    if not table:
        return None

    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute(f"SELECT * FROM {table} WHERE email=%s", (email,))
    user = cur.fetchone()

    cur.close()
    conn.close()
    return user


def get_user_by_id(role: str, user_id: int):
    table_map = {
        "Admin": "admin",
        "Faculty": "faculty",
        "Student": "students"
    }

    table = table_map.get(role)
    if not table:
        return None

    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute(f"SELECT * FROM {table} WHERE id=%s", (user_id,))
    user = cur.fetchone()

    cur.close()
    conn.close()
    return user
