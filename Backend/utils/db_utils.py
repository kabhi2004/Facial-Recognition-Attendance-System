import pickle
import numpy as np
import mysql.connector
from datetime import date

# ================= MYSQL CONFIG =================
import os
from Database import get_connection
#===============================================================================================
def insert_face(person_type: str, person_id: str, samples: np.ndarray):
    conn = get_connection()
    cur = conn.cursor()

    # 🔒 HARD VALIDATION
    if person_type == "student":
        cur.execute("SELECT id FROM students WHERE roll_no=%s", (person_id,))
        if not cur.fetchone():
            raise ValueError("Invalid student roll_no")
    elif person_type == "faculty":
        cur.execute("SELECT id FROM faculty WHERE id=%s", (person_id,))
        if not cur.fetchone():
            raise ValueError("Invalid faculty id")

    blob = pickle.dumps(samples)

    # Check if face data already exists
    cur.execute("SELECT id FROM faces WHERE person_type=%s AND person_id=%s", (person_type, person_id))
    row = cur.fetchone()

    if row:
        cur.execute(
            "UPDATE faces SET face_data=%s WHERE id=%s",
            (blob, row[0])
        )
    else:
        cur.execute(
            """
            INSERT INTO faces (person_type, person_id, face_data)
            VALUES (%s, %s, %s)
            """,
            (person_type, person_id, blob)
        )

    conn.commit()
    cur.close()
    conn.close()



import pickle
#==================================================================================================#
def fetch_all_faces():
    """
    Returns: [(person_type, person_id, face_vector)]
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT person_type, person_id, face_data FROM faces
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    data = []

    for person_type, person_id, blob in rows:
        samples = pickle.loads(blob)
        if samples is None:
            continue

        for sample in samples:
            data.append((person_type, int(person_id), sample))

    return data


def fetch_attendance_all():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT 
            s.name as student_name,
            s.roll_no,
            s.department,
            sub.subject_name,
            a.status,
            a.created_at
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN subjects sub ON a.subject_id = sub.id
        ORDER BY a.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "name": row["student_name"],
            "roll_no": row["roll_no"],
            "department": row["department"],
            "subject": row["subject_name"],
            "status": row["status"],
            "time": row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        })

    return result

# ===========================================================
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
    cur = conn.cursor(dictionary=True)

    # Get present count
    cur.execute(
        "SELECT COUNT(*) as present_count FROM attendance WHERE student_id = %s",
        (student_id,)
    )
    present_row = cur.fetchone()
    present = present_row['present_count'] if present_row else 0

    # Get dynamic total classes based on distinct dates in attendance table
    cur.execute("SELECT COUNT(DISTINCT date) as count FROM attendance")
    total_dates_row = cur.fetchone()
    TOTAL_CLASSES = total_dates_row['count'] if total_dates_row and total_dates_row['count'] > 0 else 1
    
    # If the student has more presents than the global max (maybe due to multiple subjects per day), adjust
    if present > TOTAL_CLASSES:
        TOTAL_CLASSES = present

    absent = max(0, TOTAL_CLASSES - present)

    cur.close()
    conn.close()

    return {
        "present": present,
        "absent": absent,
        "total": TOTAL_CLASSES
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
def insert_faculty(id, name, email, password, department, subject_ids):
    conn = get_connection()
    cur = conn.cursor()

    # For backward compatibility, save first subject_id in column
    fallback_subject_id = subject_ids[0] if subject_ids else None

    cur.execute("""
        INSERT INTO faculty (id, name, email, password, department, subject_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (id, name, email, password, department, fallback_subject_id))

    # Insert many-to-many associations
    for sub_id in subject_ids:
        try:
            cur.execute("""
                INSERT INTO faculty_subjects (faculty_id, subject_id)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE faculty_id=faculty_id
            """, (id, sub_id))
        except Exception as err:
            print(f"DEBUG: Failed to map faculty_subject: {err}")

    conn.commit()
    cur.close()
    conn.close()


# ---------- SUBJECT ----------
def insert_subject(subject_name, department, faculty_ids):
    conn = get_connection()
    cur = conn.cursor()

    # For backward compatibility, save first faculty_id in column
    fallback_faculty_id = faculty_ids[0] if faculty_ids else None

    cur.execute("""
        INSERT INTO subjects (subject_name, department, faculty_id)
        VALUES (%s, %s, %s)
    """, (subject_name, department, fallback_faculty_id))
    
    # Get the auto-incremented subject id
    subject_id = cur.lastrowid

    # Insert many-to-many associations
    for fac_id in faculty_ids:
        try:
            cur.execute("""
                INSERT INTO faculty_subjects (faculty_id, subject_id)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE faculty_id=faculty_id
            """, (fac_id, subject_id))
        except Exception as err:
            print(f"DEBUG: Failed to map faculty_subject: {err}")

    conn.commit()
    cur.close()
    conn.close()

# ---------- FACULTY DASHBOARD ----------
def fetch_all_students_records():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    # Get dynamic total classes based on distinct dates in attendance table
    cur.execute("SELECT COUNT(DISTINCT date) as count FROM attendance")
    total_dates_row = cur.fetchone()
    TOTAL_CLASSES = total_dates_row['count'] if total_dates_row and total_dates_row['count'] > 0 else 30
        
    cur.execute("""
        SELECT 
            s.id, s.roll_no, s.name, s.department,
            COUNT(a.id) as present_count
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.id, s.roll_no, s.name, s.department
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    for row in rows:
        row['total_classes'] = TOTAL_CLASSES
        row['absent_count'] = max(0, TOTAL_CLASSES - row['present_count'])
        row['attendance_percentage'] = round((row['present_count'] / TOTAL_CLASSES) * 100, 1) if TOTAL_CLASSES > 0 else 0

    return rows

def get_student_subjects(student_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT sub.id, sub.subject_name, GROUP_CONCAT(f.name SEPARATOR ', ') as faculty_name
        FROM subjects sub
        JOIN students s ON s.department = sub.department
        LEFT JOIN faculty_subjects fs ON sub.id = fs.subject_id
        LEFT JOIN faculty f ON fs.faculty_id = f.id
        WHERE s.id = %s
        GROUP BY sub.id, sub.subject_name
    """, (student_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

# ---------- LEAVE MANAGEMENT ----------
def create_leave_table_if_not_exists():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS leave_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            subject_id INT,
            date DATE,
            reason TEXT,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Try to alter table if subject_id doesn't exist (for existing tables)
    try:
        cur.execute("ALTER TABLE leave_applications ADD COLUMN subject_id INT DEFAULT 1")
    except:
        pass # Column already exists
        
    conn.commit()
    cur.close()
    conn.close()

def apply_leave(student_id: int, subject_id: int, date: str, reason: str):
    create_leave_table_if_not_exists()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO leave_applications (student_id, subject_id, date, reason) VALUES (%s, %s, %s, %s)",
        (student_id, subject_id, date, reason)
    )
    conn.commit()
    cur.close()
    conn.close()

def fetch_pending_leaves(faculty_id: int = None):
    create_leave_table_if_not_exists()
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    if faculty_id:
        # Fetch leaves only for subjects taught by this faculty
        cur.execute("""
            SELECT l.id, l.date, l.reason, l.status, s.name, s.roll_no, s.department, sub.subject_name
            FROM leave_applications l
            JOIN students s ON l.student_id = s.id
            JOIN subjects sub ON l.subject_id = sub.id
            JOIN faculty_subjects fs ON sub.id = fs.subject_id
            WHERE l.status = 'Pending' AND fs.faculty_id = %s
            ORDER BY l.created_at DESC
        """, (faculty_id,))
    else:
        cur.execute("""
            SELECT l.id, l.date, l.reason, l.status, s.name, s.roll_no, s.department, 'General' as subject_name
            FROM leave_applications l
            JOIN students s ON l.student_id = s.id
            WHERE l.status = 'Pending'
            ORDER BY l.created_at DESC
        """)
        
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    # Convert dates to strings for JSON
    for row in rows:
        if row.get('date'):
            row['date'] = str(row['date'])
    return rows

def update_leave_status(leave_id: int, status: str):
    conn = get_connection()
    cur = conn.cursor()
    
    # Update leave status
    cur.execute("UPDATE leave_applications SET status = %s WHERE id = %s", (status, leave_id))
    
    # If approved, mark in attendance table as 'Leave'
    if status == 'Approved':
        cur.execute("SELECT student_id, subject_id, date FROM leave_applications WHERE id = %s", (leave_id,))
        leave_data = cur.fetchone()
        if leave_data:
            student_id, subject_id, leave_date = leave_data
            
            # Make sure subject_id is not null
            if not subject_id:
                subject_id = 1
                
            cur.execute("""
                INSERT INTO attendance (student_id, subject_id, date, status)
                VALUES (%s, %s, %s, 'Leave')
                ON DUPLICATE KEY UPDATE status = 'Leave'
            """, (student_id, subject_id, leave_date))
            
    conn.commit()
    cur.close()
    conn.close()


def fetch_student_leaves(student_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT l.id, l.date, l.reason, l.status, sub.subject_name
        FROM leave_applications l
        LEFT JOIN subjects sub ON l.subject_id = sub.id
        WHERE l.student_id = %s
        ORDER BY l.created_at DESC
    """, (student_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    # Convert dates
    for row in rows:
        if row.get('date'):
            row['date'] = str(row['date'])
    return rows
