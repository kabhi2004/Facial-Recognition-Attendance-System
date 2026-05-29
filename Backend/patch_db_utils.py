import re

with open("utils/db_utils.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix fetch_attendance_summary_by_student_id
content = content.replace(
'''def fetch_attendance_summary_by_student_id(student_id: int):
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
    }''',
'''def fetch_attendance_summary_by_student_id(student_id: int):
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
    }'''
)

# 2. Add fetch_student_leaves
if "fetch_student_leaves" not in content:
    content += '''

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
'''

with open("utils/db_utils.py", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("db_utils.py patched")
