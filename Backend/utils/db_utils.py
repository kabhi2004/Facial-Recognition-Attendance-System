import pickle
import numpy as np
import mysql.connector
from datetime import date

# ================= MYSQL CONFIG =================
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="pass123",
        database="face_attendance"
    )

# ================= FACE DATA =================
# def insert_face(person_type: str, person_id: int, samples: np.ndarray):
#     blob = pickle.dumps(samples)

#     conn = get_connection()
#     cur = conn.cursor()

#     cur.execute(
#         """
#         INSERT INTO faces (person_type, person_id, face_data)
#         VALUES (%s, %s, %s)
#         """,
#         (person_type, person_id, blob)
#     )

#     conn.commit()
#     cur.close()
#     conn.close()
def insert_face(person_type: str, person_id: int, samples: np.ndarray):
    conn = get_connection()
    cur = conn.cursor()

    # 🔒 HARD VALIDATION
    if person_type == "student":
        cur.execute("SELECT id FROM students WHERE id=%s", (person_id,))
        if not cur.fetchone():
            raise ValueError("Invalid student_id")

    blob = pickle.dumps(samples)

    cur.execute(
        """
        INSERT INTO faces (person_type, person_id, face_data)
        VALUES (%s, %s, %s)
        """,
        (person_type, int(person_id), blob)
    )

    conn.commit()
    cur.close()
    conn.close()


import pickle

# def fetch_all_faces():
#     """
#     Returns: [(student_id, face_vector), ...]
#     Uses ONLY student faces for training
#     """
#     conn = get_connection()
#     cur = conn.cursor()

#     cur.execute(
#         """
#         SELECT person_id, face_data
#         FROM faces
#         WHERE person_type = 'student'
#         """
#     )
#     rows = cur.fetchall()

#     cur.close()
#     conn.close()

#     data = []

#     for person_id, blob in rows:
#         try:
#             samples = pickle.loads(blob)
#             if samples is None:
#                 continue

#             for sample in samples:
#                 data.append((int(person_id), sample))

#         except Exception:
#             continue

#     return data
def fetch_all_faces():
    """
    Returns: [(student_id, face_vector)]
    ONLY faces whose person_id EXISTS in students table
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT f.person_id, f.face_data
        FROM faces f
        INNER JOIN students s ON s.id = f.person_id
        WHERE f.person_type = 'student'
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    data = []

    for student_id, blob in rows:
        samples = pickle.loads(blob)
        if samples is None:
            continue

        for sample in samples:
            data.append((int(student_id), sample))

    return data



# ================= ATTENDANCE =================
# def insert_attendance(student_id: int, subject_id: int, status: str = "Present"):
#     student_id = int(student_id)
#     subject_id = int(subject_id)

#     conn = get_connection()
#     cur = conn.cursor()
#     cur.execute("SELECT id FROM students WHERE id=%s", (student_id,))
#     if not cur.fetchone():
#         cur.close()
#         conn.close()
#         raise ValueError("Invalid student_id")

#     cur.execute(
#         """
#         INSERT INTO attendance (student_id, subject_id, date, status)
#         VALUES (%s, %s, %s, %s)
#         ON DUPLICATE KEY UPDATE status = VALUES(status)
#         """,
#         (student_id, subject_id, date.today(), status)
#     )

#     conn.commit()
#     cur.close()
#     conn.close()


def fetch_attendance_all():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT s.name, a.created_at
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for name, created_at in rows:
        result.append({
            "name": name,
            "time": created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return result




#     conn.commit()
#     cur.close()
#     conn.close()
def insert_attendance(student_id: int, subject_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # 🔒 Validate student exists
    cur.execute(
        "SELECT id FROM students WHERE id = %s",
        (student_id,)
    )

    if cur.fetchone() is None:
        cur.close()
        conn.close()
        raise ValueError(f"Invalid student_id: {student_id}")

    # ✅ Safe insert (no duplicate crash)
    cur.execute(
        """
        INSERT INTO attendance (student_id, subject_id, date, status)
        VALUES (%s, %s, CURDATE(), 'Present')
        ON DUPLICATE KEY UPDATE
            status = 'Present'
        """,
        (student_id, subject_id)
    )

    conn.commit()
    cur.close()
    conn.close()


# ================= STUDENT DASHBOARD =================
def fetch_attendance_by_student_id(student_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        """
        SELECT 
            a.date,
            a.status,
            s.subject_name
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = %s
        ORDER BY a.date DESC
        """,
        (int(student_id),)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return rows



def fetch_attendance_summary_by_student_id(student_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT COUNT(*) FROM attendance WHERE student_id = %s",
        (student_id,)
    )
    present = cur.fetchone()[0] or 0

    TOTAL_CLASSES = 30  # configurable
    absent = max(0, TOTAL_CLASSES - present)

    cur.close()
    conn.close()

    return {
        "present": present,
        "absent": absent
    }


# ================= HELPERS =================
def get_student_name_by_id(student_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT name FROM students WHERE id = %s", (student_id,))
    row = cur.fetchone()

    cur.close()
    conn.close()

    return row[0] if row else "Unknown"
# utils/db_utils.py
from Database import get_connection

# ---------- STUDENTS ----------
def insert_student(roll_no, name, email, password, department):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO students (roll_no, name, email, password, department)
        VALUES (%s, %s, %s, %s, %s)
    """, (roll_no, name, email, password, department))

    conn.commit()
    cur.close()
    conn.close()


# ---------- FACULTY ----------
def insert_faculty(name, email, password, department, subject_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO faculty (name, email, password, department, subject_id)
        VALUES (%s, %s, %s, %s, %s)
    """, (name, email, password, department, subject_id))

    conn.commit()
    cur.close()
    conn.close()


# ---------- SUBJECT ----------
def insert_subject(subject_name, department, faculty_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO subjects (subject_name, department, faculty_id)
        VALUES (%s, %s, %s)
    """, (subject_name, department, faculty_id))

    conn.commit()
    cur.close()
    conn.close()
