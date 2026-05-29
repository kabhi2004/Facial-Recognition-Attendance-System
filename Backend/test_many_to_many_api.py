import requests
from Database import get_connection

def test_api():
    print("Testing Many-to-Many Faculty & Subjects API...")
    
    test_faculty_id = 8888
    
    # 1. Clean up any previous test runs
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM faculty_subjects WHERE faculty_id = %s", (test_faculty_id,))
        cur.execute("DELETE FROM faculty WHERE id = %s", (test_faculty_id,))
        conn.commit()
        print("Cleanup of faculty 8888 succeeded.")
    except Exception as e:
        print(f"Cleanup warning: {e}")
        
    # 2. Add Faculty with Multiple Subjects (e.g. Subject 1 and 2)
    payload_fac = {
        "id": test_faculty_id,
        "name": "Test Multi-Subject Faculty",
        "email": "testmultifac@college.edu",
        "password": "password",
        "department": "CSE",
        "subject_ids": [1, 2]
    }
    
    print(f"\nSending POST to /admin/add-faculty with: {payload_fac}")
    res_fac = requests.post("http://localhost:8000/admin/add-faculty", json=payload_fac)
    print(f"Response: {res_fac.json()}")
    
    # 3. Add Subject with Multiple Faculties (e.g. Faculty 1 and 2)
    payload_sub = {
        "subject_name": "Test Multi-Teacher Subject",
        "department": "CSE",
        "faculty_ids": [1, 2]
    }
    
    print(f"\nSending POST to /admin/add-subject with: {payload_sub}")
    res_sub = requests.post("http://localhost:8000/admin/add-subject", json=payload_sub)
    print(f"Response: {res_sub.json()}")
    
    # 4. Query DB directly to verify
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM faculty_subjects WHERE faculty_id = %s", (test_faculty_id,))
    fac_mappings = cur.fetchall()
    
    # Fetch mapped subject
    cur.execute("SELECT id, subject_name FROM subjects WHERE subject_name = %s LIMIT 1", ("Test Multi-Teacher Subject",))
    sub_row = cur.fetchone()
    sub_mappings = []
    if sub_row:
        cur.execute("SELECT * FROM faculty_subjects WHERE subject_id = %s", (sub_row['id'],))
        sub_mappings = cur.fetchall()
        
    print("\n--- DATABASE VERIFICATION RESULTS ---")
    print(f"Faculty 8888 subject mappings in DB: {fac_mappings}")
    print(f"Subject '{sub_row['subject_name'] if sub_row else 'None'}' (ID {sub_row['id'] if sub_row else 'None'}) teacher mappings in DB: {sub_mappings}")
    
    success = len(fac_mappings) == 2 and len(sub_mappings) == 2
    if success:
        print("\nSUCCESS: Many-to-Many mappings successfully written to junction table!")
    else:
        print("\nFAILURE: Mappings were not written correctly.")
        
    # 5. Final cleanup
    try:
        cur.execute("DELETE FROM faculty_subjects WHERE faculty_id = %s", (test_faculty_id,))
        cur.execute("DELETE FROM faculty WHERE id = %s", (test_faculty_id,))
        if sub_row:
            cur.execute("DELETE FROM faculty_subjects WHERE subject_id = %s", (sub_row['id'],))
            cur.execute("DELETE FROM subjects WHERE id = %s", (sub_row['id'],))
        conn.commit()
        print("\nFinal test cleanup succeeded.")
    except Exception as e:
        print(f"Final cleanup warning: {e}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_api()
