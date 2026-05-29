import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

if "fetch_student_leaves" not in content:
    content += """

@app.get("/student/{student_id}/leaves")
def api_get_student_leaves(student_id: int):
    from utils.db_utils import fetch_student_leaves
    leaves = fetch_student_leaves(student_id)
    return {"success": True, "leaves": leaves}
"""
    with open("main.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added /student/{student_id}/leaves")
else:
    print("already exists")
