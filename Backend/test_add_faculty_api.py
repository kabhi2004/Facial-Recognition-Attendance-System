import requests
import mysql.connector
from Database import get_connection

def test_api():
    print("Testing manual Faculty ID registration API...")
    
    test_id = 999
    
    # Clean up previous run if any
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM faculty WHERE id = %s", (test_id,))
        conn.commit()
    except Exception as e:
        print(f"Cleanup error (can ignore): {e}")
    
    # Let's get an existing subject ID to map the faculty member
    try:
        cur.execute("SELECT id FROM subjects LIMIT 1")
        row = cur.fetchone()
        subject_id = row[0] if row else 1
    except Exception as e:
        print(f"Error fetching subject, using fallback 1: {e}")
        subject_id = 1
    finally:
        cur.close()
        conn.close()
    
    payload = {
        "id": test_id,
        "name": "Test Faculty Manual ID",
        "email": "testmanualid@college.edu",
        "password": "password",
        "department": "CSE",
        "subject_id": subject_id
    }
    
    print(f"Sending POST to http://localhost:8000/admin/add-faculty with payload:\n{payload}")
    try:
        res = requests.post("http://localhost:8000/admin/add-faculty", json=payload)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")
        
        # Verify in DB
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM faculty WHERE id = %s", (test_id,))
        faculty_row = cur.fetchone()
        
        if faculty_row:
            print("\nSUCCESS: Faculty successfully registered with manual ID in database!")
            print(faculty_row)
            
            # Clean up after test
            cur.execute("DELETE FROM faculty WHERE id = %s", (test_id,))
            conn.commit()
            print("Cleanup completed successfully!")
        else:
            print("\nFAILURE: Faculty was not found in the database with manual ID.")
            
        cur.close()
        conn.close()
            
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    test_api()
