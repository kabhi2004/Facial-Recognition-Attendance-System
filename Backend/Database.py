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
    rows = cur.fetchall()

    cur.close()
    conn.close()
    
    if not rows:
        return None

    if role == "Faculty":
        user = rows[0]
        # Query subject details for all mapped subject_ids to populate subjects array
        conn_sub = get_connection()
        cur_sub = conn_sub.cursor(dictionary=True)
        subject_ids = [r['subject_id'] for r in rows if r['subject_id'] is not None]
        subjects = []
        if subject_ids:
            format_strings = ','.join(['%s'] * len(subject_ids))
            cur_sub.execute(f"""
                SELECT DISTINCT id, subject_name, department 
                FROM subjects 
                WHERE id IN ({format_strings})
            """, tuple(subject_ids))
            subjects = cur_sub.fetchall()
        cur_sub.close()
        conn_sub.close()
        
        user['subjects'] = subjects
        user['subject_id'] = rows[0]['subject_id']
        return user

    return rows[0]


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

    if role == "Student":
        cur.execute(f"SELECT * FROM {table} WHERE roll_no=%s", (str(user_id),))
    else:
        cur.execute(f"SELECT * FROM {table} WHERE id=%s", (int(user_id),))
    rows = cur.fetchall()

    cur.close()
    conn.close()
    
    if not rows:
        return None

    if role == "Faculty":
        user = rows[0]
        conn_sub = get_connection()
        cur_sub = conn_sub.cursor(dictionary=True)
        subject_ids = [r['subject_id'] for r in rows if r['subject_id'] is not None]
        subjects = []
        if subject_ids:
            format_strings = ','.join(['%s'] * len(subject_ids))
            cur_sub.execute(f"""
                SELECT DISTINCT id, subject_name, department 
                FROM subjects 
                WHERE id IN ({format_strings})
            """, tuple(subject_ids))
            subjects = cur_sub.fetchall()
        cur_sub.close()
        conn_sub.close()
        
        user['subjects'] = subjects
        user['subject_id'] = rows[0]['subject_id']
        return user

    return rows[0]
