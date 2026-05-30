import requests
import mysql.connector
from Database import get_connection, get_user, get_user_by_id

def test():
    print("Testing composite primary keys API and Auth logic...")
    
    test_faculty_id = 9991
    
    # 1. Clean up any previous test runs
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM faculty WHERE id = %s", (test_faculty_id,))
        cur.execute("DELETE FROM subjects WHERE subject_name = 'Test Composite Subject'")
        conn.commit()
        print("Cleanup succeeded.")
    except Exception as e:
        print(f"Cleanup warning: {e}")
    finally:
        cur.close()
        conn.close()
    
    # 2. Add Faculty with Multiple Subjects
    payload_fac = {
        "id": test_faculty_id,
        "name": "Test Composite Faculty",
        "email": "testcomposite@college.edu",
        "password": "password",
        "department": "CSE",
        "subject_ids": [1, 2]
    }
    
    print(f"\nSending POST to /admin/add-faculty with: {payload_fac}")
    res_fac = requests.post("http://localhost:8000/admin/add-faculty", json=payload_fac)
    print(f"Response: {res_fac.json()}")
    
    # 3. Add Subject with Multiple Faculties
    payload_sub = {
        "subject_name": "Test Composite Subject",
        "department": "CSE",
        "faculty_ids": [1, test_faculty_id]
    }
    
    print(f"\nSending POST to /admin/add-subject with: {payload_sub}")
    res_sub = requests.post("http://localhost:8000/admin/add-subject", json=payload_sub)
    print(f"Response: {res_sub.json()}")
    
    # 4. Check get_user output
    print("\nCalling Database.get_user to verify session aggregation...")
    user = get_user("Faculty", "testcomposite@college.edu")
    print(f"Retrieved aggregated user from DB: {user}")
    
    # 5. Check stats endpoint response
    print(f"\nCalling /faculty/{test_faculty_id}/stats endpoint...")
    res_stats = requests.get(f"http://localhost:8000/faculty/{test_faculty_id}/stats")
    print(f"Response stats: {res_stats.json()}")
    
    # Verify success
    db_verified = False
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM faculty WHERE id = %s", (test_faculty_id,))
    rows = cur.fetchall()
    print(f"\nDirect query 'SELECT * FROM faculty WHERE id = {test_faculty_id}':\n{rows}")
    
    if len(rows) == 2 and user and len(user.get('subjects', [])) == 2:
        db_verified = True
        
    if db_verified:
        print("\nSUCCESS: Composite primary keys are fully functional and integrated with authentication!")
    else:
        print("\nFAILURE: Mappings were not written or loaded correctly.")
        
    # 6. Final cleanup
    cur.execute("DELETE FROM faculty WHERE id = %s", (test_faculty_id,))
    cur.execute("DELETE FROM subjects WHERE subject_name = %s", ("Test Composite Subject",))
    conn.commit()
    cur.close()
    conn.close()
    print("\nFinal cleanup completed successfully.")

if __name__ == "__main__":
    test()
