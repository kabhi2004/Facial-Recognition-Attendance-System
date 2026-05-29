import mysql.connector
from Database import get_connection

def migrate():
    print("Starting Many-to-Many relationship migration...")
    
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    try:
        # 1. Create junction table
        print("Creating junction table 'faculty_subjects'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS faculty_subjects (
                faculty_id INT,
                subject_id INT,
                PRIMARY KEY (faculty_id, subject_id)
            )
        """)
        conn.commit()
        print("Success: Junction table created.")
        
        # 2. Extract mappings from 'faculty' table
        print("Extracting existing mappings from 'faculty' table...")
        cur.execute("SELECT id, subject_id FROM faculty WHERE subject_id IS NOT NULL")
        faculty_rows = cur.fetchall()
        print(f"Found {len(faculty_rows)} potential mappings in 'faculty' table.")
        
        # 3. Extract mappings from 'subjects' table
        print("Extracting existing mappings from 'subjects' table...")
        cur.execute("SELECT faculty_id, id AS subject_id FROM subjects WHERE faculty_id IS NOT NULL")
        subject_rows = cur.fetchall()
        print(f"Found {len(subject_rows)} potential mappings in 'subjects' table.")
        
        # Merge mappings and insert into faculty_subjects
        all_mappings = set()
        for row in faculty_rows:
            if row['id'] and row['subject_id']:
                all_mappings.add((int(row['id']), int(row['subject_id'])))
                
        for row in subject_rows:
            if row['faculty_id'] and row['subject_id']:
                all_mappings.add((int(row['faculty_id']), int(row['subject_id'])))
                
        print(f"Total unique mappings to transfer: {len(all_mappings)}")
        
        # 4. Insert into junction table
        transferred_count = 0
        for fac_id, sub_id in all_mappings:
            try:
                cur.execute("""
                    INSERT INTO faculty_subjects (faculty_id, subject_id)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE faculty_id = faculty_id
                """, (fac_id, sub_id))
                transferred_count += 1
            except Exception as ins_err:
                print(f"Warning: Failed to insert mapping ({fac_id}, {sub_id}): {ins_err}")
                
        conn.commit()
        print(f"Successfully transferred {transferred_count} mappings to 'faculty_subjects' junction table!")
        
        # 5. Verify the junction table contents
        cur.execute("SELECT * FROM faculty_subjects")
        actual_rows = cur.fetchall()
        print("\n--- Current mappings in 'faculty_subjects' ---")
        for row in actual_rows:
            print(f"  Faculty ID: {row['faculty_id']}  <--->  Subject ID: {row['subject_id']}")
        print("-" * 45 + "\n")
        
    except Exception as e:
        print(f"Migration failed with error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
