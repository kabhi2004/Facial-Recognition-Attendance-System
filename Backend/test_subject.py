from Database import get_connection

def find_faculty_subject(email):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM faculty WHERE email = %s", (email,))
    user = cur.fetchone()
    if user:
        cur.execute("SELECT id, subject_name FROM subjects WHERE faculty_id = %s LIMIT 1", (user["id"],))
        sub = cur.fetchone()
        print("Subject for", email, ":", sub)
    else:
        print("User not found")
        
find_faculty_subject('abhishekkashore001@gmail.com')
