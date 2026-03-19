import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="pass123",
        database="face_attendance"
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
