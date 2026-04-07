import json
from Database import get_connection
c=get_connection()
cur=c.cursor(dictionary=True)
cur.execute("DESCRIBE faculty")
fac_cols = cur.fetchall()
cur.execute("SELECT * FROM faculty LIMIT 1")
fac_data = cur.fetchone()
cur.execute("DESCRIBE subjects")
sub_cols = cur.fetchall()
cur.execute("SELECT * FROM subjects LIMIT 1")
sub_data = cur.fetchone()
c.close()
with open("test_desc.json", "w") as f:
    json.dump({
        "faculty_schema": fac_cols,
        "faculty_data": fac_data,
        "subject_schema": sub_cols,
        "subject_data": sub_data
    }, f, indent=2, default=str)
