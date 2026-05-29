import mysql.connector
from Database import get_connection

def print_table_schema():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DESCRIBE faculty;")
        rows = cur.fetchall()
        print("\n--- Current Schema of 'faculty' ---")
        print("{:<12} {:<15} {:<10} {:<10} {:<15} {:<15}".format("Field", "Type", "Null", "Key", "Default", "Extra"))
        print("-" * 80)
        for row in rows:
            print("{:<12} {:<15} {:<10} {:<10} {:<15} {:<15}".format(
                str(row[0]), str(row[1]), str(row[2]), str(row[3]), str(row[4]), str(row[5])
            ))
        print("-" * 80 + "\n")
    except Exception as e:
        print(f"Error describing table: {e}")
    finally:
        cur.close()
        conn.close()

def migrate():
    print_table_schema()
    
    conn = get_connection()
    cur = conn.cursor()
    try:
        print("Enabling tidb_allow_remove_auto_inc session variable...")
        cur.execute("SET @@session.tidb_allow_remove_auto_inc = 1;")
        
        print("Executing ALTER TABLE to remove AUTO_INCREMENT from 'faculty.id'...")
        cur.execute("ALTER TABLE faculty MODIFY COLUMN id INT;")
        conn.commit()
        print("Migration query committed successfully!")
    except Exception as e:
        print(f"Error executing ALTER TABLE query: {e}")
    finally:
        cur.close()
        conn.close()
        
    print_table_schema()

if __name__ == "__main__":
    migrate()
