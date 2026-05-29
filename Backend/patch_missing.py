import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

if "student-records" not in content:
    content += """

@app.get("/faculty/student-records")
def api_student_records():
    from utils.db_utils import fetch_all_students_records
    records = fetch_all_students_records()
    return {"success": True, "records": records}
"""
    with open("main.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added /faculty/student-records")
else:
    print("already exists")
