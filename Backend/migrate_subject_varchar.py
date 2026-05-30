import mysql.connector
from Database import get_connection

def migrate():
    print("Starting migration to remove auto-increment and make subjects.id a VARCHAR(100)...")
    
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    try:
        # Enable tidb_allow_remove_auto_inc just in case
        try:
            cur.execute("SET @@session.tidb_allow_remove_auto_inc = 1;")
            conn.commit()
        except:
            pass

        # 1. Create faculty_new table with subject_id as VARCHAR(100)
        print("Creating 'faculty_new' table with subject_id as VARCHAR...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS faculty_new (
                id INT,
                name VARCHAR(100),
                email VARCHAR(100),
                password VARCHAR(100),
                department VARCHAR(100),
                subject_id VARCHAR(100),
                PRIMARY KEY (id, subject_id)
            )
        """)
        conn.commit()

        # 2. Create subjects_new table with id as VARCHAR(100) and no AUTO_INCREMENT
        print("Creating 'subjects_new' table with id as VARCHAR...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects_new (
                id VARCHAR(100),
                subject_name VARCHAR(100),
                department VARCHAR(100),
                faculty_id INT,
                PRIMARY KEY (id, faculty_id)
            )
        """)
        conn.commit()

        # 3. Copy existing faculty data into faculty_new
        print("Copying existing faculty members into 'faculty_new'...")
        cur.execute("SELECT * FROM faculty")
        faculties = cur.fetchall()
        for f in faculties:
            sub_id = str(f['subject_id']) if f['subject_id'] is not None else "1"
            try:
                cur.execute("""
                    INSERT INTO faculty_new (id, name, email, password, department, subject_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name=name
                """, (f['id'], f['name'], f['email'], f['password'], f['department'], sub_id))
            except Exception as err:
                print(f"Error copying faculty ID {f['id']}: {err}")
        conn.commit()
        print(f"Successfully copied {len(faculties)} records to 'faculty_new'.")

        # 4. Copy existing subjects data into subjects_new
        print("Copying existing subjects into 'subjects_new'...")
        cur.execute("SELECT * FROM subjects")
        subjects = cur.fetchall()
        for s in subjects:
            sub_id = str(s['id'])
            fac_id = s['faculty_id'] if s['faculty_id'] is not None else 1
            try:
                cur.execute("""
                    INSERT INTO subjects_new (id, subject_name, department, faculty_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE subject_name=subject_name
                """, (sub_id, s['subject_name'], s['department'], fac_id))
            except Exception as err:
                print(f"Error copying subject ID {s['id']}: {err}")
        conn.commit()
        print(f"Successfully copied {len(subjects)} records to 'subjects_new'.")

        # 5. Drop old tables
        print("Dropping legacy 'faculty' and 'subjects' tables...")
        cur.execute("DROP TABLE IF EXISTS faculty")
        cur.execute("DROP TABLE IF EXISTS subjects")
        conn.commit()

        # 6. Rename new tables to replace old ones
        print("Renaming new tables to 'faculty' and 'subjects'...")
        cur.execute("RENAME TABLE faculty_new TO faculty")
        cur.execute("RENAME TABLE subjects_new TO subjects")
        conn.commit()

        # 7. Alter attendance table subject_id to VARCHAR(100)
        print("Altering 'attendance' table subject_id to VARCHAR(100)...")
        try:
            cur.execute("ALTER TABLE attendance MODIFY COLUMN subject_id VARCHAR(100)")
            conn.commit()
            print("Successfully altered 'attendance' table.")
        except Exception as err:
            print(f"Error altering 'attendance' table: {err}")

        # 8. Alter leave_applications table subject_id to VARCHAR(100)
        print("Altering 'leave_applications' table subject_id to VARCHAR(100)...")
        try:
            cur.execute("ALTER TABLE leave_applications MODIFY COLUMN subject_id VARCHAR(100)")
            conn.commit()
            print("Successfully altered 'leave_applications' table.")
        except Exception as err:
            print(f"Error altering 'leave_applications' table: {err}")

        print("\nSUCCESS: Database subject ID migrated to VARCHAR(100) successfully!")
        
    except Exception as e:
        print(f"\nMigration crashed: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
