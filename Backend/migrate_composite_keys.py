import mysql.connector
from Database import get_connection

def migrate():
    print("Starting composite primary keys migration via table recreation...")
    
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    try:
        # Enable tidb_allow_remove_auto_inc just in case
        try:
            cur.execute("SET @@session.tidb_allow_remove_auto_inc = 1;")
            conn.commit()
        except:
            pass

        # 1. Create faculty_new table with composite PRIMARY KEY (id, subject_id)
        # Note: No UNIQUE index on email
        print("Creating 'faculty_new' table with composite primary key...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS faculty_new (
                id INT,
                name VARCHAR(100),
                email VARCHAR(100),
                password VARCHAR(100),
                department VARCHAR(100),
                subject_id INT,
                PRIMARY KEY (id, subject_id)
            )
        """)
        conn.commit()

        # 2. Create subjects_new table with composite PRIMARY KEY (id, faculty_id)
        # Note: id is AUTO_INCREMENT and part of the composite primary key
        print("Creating 'subjects_new' table with composite primary key...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects_new (
                id INT AUTO_INCREMENT,
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
            # If subject_id is null, use a fallback of 1
            sub_id = f['subject_id'] if f['subject_id'] is not None else 1
            try:
                cur.execute("""
                    INSERT INTO faculty_new (id, name, email, password, department, subject_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name=name
                """, (f['id'], f['name'], f['email'], f['password'], f['department'], sub_id))
            except Exception as err:
                print(f"Error copying faculty ID {f['id']}: {err}")
        conn.commit()
        print(f"Successfully copied {len(faculties)} base records to 'faculty_new'.")

        # 4. Copy existing subjects data into subjects_new
        print("Copying existing subjects into 'subjects_new'...")
        cur.execute("SELECT * FROM subjects")
        subjects = cur.fetchall()
        for s in subjects:
            # If faculty_id is null, use a fallback of 1
            fac_id = s['faculty_id'] if s['faculty_id'] is not None else 1
            try:
                cur.execute("""
                    INSERT INTO subjects_new (id, subject_name, department, faculty_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE subject_name=subject_name
                """, (s['id'], s['subject_name'], s['department'], fac_id))
            except Exception as err:
                print(f"Error copying subject ID {s['id']}: {err}")
        conn.commit()
        print(f"Successfully copied {len(subjects)} base records to 'subjects_new'.")

        # 5. Extract mappings from junction table 'faculty_subjects'
        print("Reading existing junction table mappings...")
        junction_rows = []
        try:
            cur.execute("SELECT * FROM faculty_subjects")
            junction_rows = cur.fetchall()
            print(f"Found {len(junction_rows)} mappings in 'faculty_subjects' table.")
        except Exception as e:
            print(f"Note: 'faculty_subjects' table not found or already dropped: {e}")

        # 6. Migrate junction table mappings back to 'faculty_new' and 'subjects_new'
        print("Migrating mappings losslessly...")
        for row in junction_rows:
            fac_id = row['faculty_id']
            sub_id = row['subject_id']
            
            # Map in faculty_new
            cur.execute("SELECT * FROM faculty_new WHERE id = %s AND subject_id = %s", (fac_id, sub_id))
            if not cur.fetchone():
                # Get personal details from faculty_new
                cur.execute("SELECT * FROM faculty_new WHERE id = %s LIMIT 1", (fac_id,))
                base_fac = cur.fetchone()
                if base_fac:
                    cur.execute("""
                        INSERT INTO faculty_new (id, name, email, password, department, subject_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (fac_id, base_fac['name'], base_fac['email'], base_fac['password'], base_fac['department'], sub_id))
                    
            # Map in subjects_new
            cur.execute("SELECT * FROM subjects_new WHERE id = %s AND faculty_id = %s", (sub_id, fac_id))
            if not cur.fetchone():
                # Get subject details from subjects_new
                cur.execute("SELECT * FROM subjects_new WHERE id = %s LIMIT 1", (sub_id,))
                base_sub = cur.fetchone()
                if base_sub:
                    cur.execute("""
                        INSERT INTO subjects_new (id, subject_name, department, faculty_id)
                        VALUES (%s, %s, %s, %s)
                    """, (sub_id, base_sub['subject_name'], base_sub['department'], fac_id))
        conn.commit()
        print("Mappings migration completed successfully.")

        # 7. Drop old tables
        print("Dropping legacy 'faculty' and 'subjects' tables...")
        cur.execute("DROP TABLE IF EXISTS faculty")
        cur.execute("DROP TABLE IF EXISTS subjects")
        cur.execute("DROP TABLE IF EXISTS faculty_subjects")
        conn.commit()

        # 8. Rename new tables to replace old ones
        print("Renaming new tables to 'faculty' and 'subjects'...")
        cur.execute("RENAME TABLE faculty_new TO faculty")
        cur.execute("RENAME TABLE subjects_new TO subjects")
        conn.commit()

        print("\nCOMPLETED: Live Cloud migration successfully executed with composite primary keys!")
        
    except Exception as e:
        print(f"\nMigration crashed: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
