import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQLHOST", "localhost"),
        user=os.getenv("MYSQLUSER", "root"),
        password=os.getenv("MYSQLPASSWORD", ""),
        database=os.getenv("MYSQLDATABASE", "attendance_db"),
        port=int(os.getenv("MYSQLPORT", "3306")),
        use_pure=True
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
