import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace get pending leaves
content = content.replace(
'''@app.get("/faculty/pending-leaves")
def api_pending_leaves():
    leaves = fetch_pending_leaves()
    return {"success": True, "leaves": leaves}''',
'''@app.get("/faculty/{faculty_id}/pending-leaves")
def api_pending_leaves(faculty_id: int):
    leaves = fetch_pending_leaves(faculty_id)
    return {"success": True, "leaves": leaves}'''
)

# Replace LeaveApplication model
content = content.replace(
'''class LeaveApplication(BaseModel):
    student_id: int
    date: str
    reason: str''',
'''class LeaveApplication(BaseModel):
    student_id: int
    subject_id: int
    date: str
    reason: str'''
)

# Replace apply_leave API
content = content.replace(
'''@app.post("/student/apply-leave")
def api_apply_leave(data: LeaveApplication):
    apply_leave(data.student_id, data.date, data.reason)
    return {"success": True, "message": "Leave application submitted successfully"}''',
'''@app.post("/student/apply-leave")
def api_apply_leave(data: LeaveApplication):
    apply_leave(data.student_id, data.subject_id, data.date, data.reason)
    return {"success": True, "message": "Leave application submitted successfully"}'''
)

# Add get_student_subjects
content = content.replace(
'''from utils.db_utils import apply_leave, fetch_pending_leaves, update_leave_status''',
'''from utils.db_utils import apply_leave, fetch_pending_leaves, update_leave_status, get_student_subjects

@app.get("/student/{student_id}/subjects")
def api_get_student_subjects(student_id: int):
    subjects = get_student_subjects(student_id)
    return {"success": True, "subjects": subjects}'''
)

with open("main.py", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("Patch applied")
