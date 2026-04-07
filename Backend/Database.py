import mysql.connector
import os

import os
import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host=os.environ["MYSQLHOST"],
        user=os.environ["MYSQLUSER"],
        password=os.environ["MYSQLPASSWORD"],
        database=os.environ["MYSQLDATABASE"],
        port=int(os.environ["MYSQLPORT"]),
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
