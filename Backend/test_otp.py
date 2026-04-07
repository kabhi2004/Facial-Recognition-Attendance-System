import json
from Database import get_user, get_connection
c=get_connection()
cur=c.cursor(dictionary=True)
cur.execute("SELECT * FROM faculty LIMIT 1")
r=cur.fetchone()
c.close()
with open("test_out.txt", "w") as f:
    f.write(json.dumps(r) + "\n")
    u = get_user("Faculty", r["email"])
    f.write(json.dumps(u) + "\n")
