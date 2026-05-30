import mysql.connector
from utils.db_utils import get_student_subjects
from Database import get_connection

def test():
    print("Testing get_student_subjects output...")
    
    # 1. Let's find an active student ID
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, name, department FROM students LIMIT 1")
    student = cur.fetchone()
    
    if not student:
        print("No student found in the database. Creating a dummy student for testing...")
        cur.execute("""
            INSERT INTO students (roll_no, name, email, password, department)
            VALUES ('TEST101', 'Test Student', 'teststudent@college.edu', 'password', 'CSE')
        """)
        conn.commit()
        cur.execute("SELECT id, name, department FROM students WHERE roll_no = 'TEST101'")
        student = cur.fetchone()
        
    student_id = student['id']
    department = student['department']
    print(f"Active student: ID {student_id}, Name: {student['name']}, Dept: {department}")
    
    # 2. Check if a subject exists in this department
    cur.execute("SELECT id, subject_name FROM subjects WHERE department = %s LIMIT 1", (department,))
    subject = cur.fetchone()
    
    if not subject:
        print(f"No subject found in department '{department}'. Creating a dummy subject...")
        cur.execute("""
            INSERT INTO subjects (subject_name, department, faculty_id)
            VALUES ('Test Machine Learning', %s, 1)
        """, (department,))
        conn.commit()
        cur.execute("SELECT id, subject_name FROM subjects WHERE subject_name = 'Test Machine Learning'")
        subject = cur.fetchone()
        
    subject_id = subject['id']
    print(f"Subject for testing: ID {subject_id}, Name: {subject['subject_name']}")
    
    # 3. Map multiple teachers to this subject in the junction table faculty_subjects
    cur.execute("SELECT id, name FROM faculty LIMIT 2")
    faculties = cur.fetchall()
    
    if len(faculties) < 2:
        print("Creating dummy faculty members to test multi-teacher mapping...")
        cur.execute("INSERT IGNORE INTO faculty (id, name, email, password, department) VALUES (8001, 'Teacher Alpha', 'alpha@college.edu', 'password', %s)", (department,))
        cur.execute("INSERT IGNORE INTO faculty (id, name, email, password, department) VALUES (8002, 'Teacher Beta', 'beta@college.edu', 'password', %s)", (department,))
        conn.commit()
        cur.execute("SELECT id, name FROM faculty WHERE id IN (8001, 8002)")
        faculties = cur.fetchall()
        
    # Map them to the subject in junction table
    print("Mapping teachers to subject in 'faculty_subjects'...")
    for fac in faculties:
        try:
            cur.execute("""
                INSERT INTO faculty_subjects (faculty_id, subject_id)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE faculty_id = faculty_id
            """, (fac['id'], subject_id))
        except Exception as e:
            print(f"Mapping warning: {e}")
    conn.commit()
    
    # 4. Call get_student_subjects
    print("\nCalling get_student_subjects...")
    subjects_list = get_student_subjects(student_id)
    print(f"Resulting subjects with teachers mapping: {subjects_list}")
    
    # Verify that the subject has multiple teachers listed
    verified = False
    for sub in subjects_list:
        if sub['id'] == subject_id:
            teacher_names = sub['faculty_name']
            print(f"\nSubject '{sub['subject_name']}': Mapped Teachers in result -> '{teacher_names}'")
            if teacher_names and len(teacher_names.split(',')) >= 2:
                verified = True
                
    if verified:
        print("\nSUCCESS: Multi-teacher leave mapping successfully retrieved on Student Dashboard!")
    else:
        print("\nFAILURE: Comma-separated list of multiple teachers was not returned.")
        
    # 5. Clean up dummy associations/records
    try:
        for fac in faculties:
            if fac['id'] in [8001, 8002]:
                cur.execute("DELETE FROM faculty_subjects WHERE faculty_id = %s", (fac['id'],))
                cur.execute("DELETE FROM faculty WHERE id = %s", (fac['id'],))
        if student['roll_no'] == 'TEST101':
            cur.execute("DELETE FROM students WHERE id = %s", (student_id,))
        if subject['subject_name'] == 'Test Machine Learning':
            cur.execute("DELETE FROM faculty_subjects WHERE subject_id = %s", (subject_id,))
            cur.execute("DELETE FROM subjects WHERE id = %s", (subject_id,))
        conn.commit()
        print("Cleanup completed successfully.")
    except Exception as e:
        print(f"Cleanup warning: {e}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    test()
