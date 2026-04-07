import json
from Database import get_connection
def default_converter(o):
    import datetime
    if isinstance(o, datetime.datetime) or isinstance(o, datetime.date):
        return o.isoformat()
    return str(o)
    
c=get_connection()
cur=c.cursor(dictionary=True)
cur.execute("SELECT id, name, email, subject_id FROM faculty")
faculties = cur.fetchall()
cur.execute("SELECT * FROM subjects")
subjects = cur.fetchall()
c.close()

with open("test_out_fac.txt", "w") as f:
    f.write("Faculties:\n" + json.dumps(faculties, default=default_converter, indent=2) + "\n")
    f.write("Subjects:\n" + json.dumps(subjects, default=default_converter, indent=2) + "\n")
