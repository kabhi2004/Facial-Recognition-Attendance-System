import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import cv2
import numpy as np

# ---------- IMPORT YOUR EXISTING MODULES ----------
from utils.face_utils import extract_face_embeddings
from utils.db_utils import (
    insert_face,
    fetch_attendance_all,
    fetch_attendance_by_student_id,
    fetch_attendance_summary_by_student_id,
    fetch_all_students_records
)
from AttendanceLogic import FaceRecognizer
from Database import get_user
from OtpGenerator import generate_and_send_otp, verify_otp

# ---------------- APP INIT ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://facial-recognition-attendance-syste-chi.vercel.app",
        "http://localhost:5173",
        "http://localhost",
        "capacitor://localhost",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- FACE MODEL INIT ----------------
recognizer = FaceRecognizer()

@app.on_event("startup")
def startup_event():
    # 🌟 Initialize database tables automatically
    from init_db import create_tables
    try:
        create_tables()
    except Exception as e:
        print(f"DEBUG: Failed to auto-create tables (might already exist or DB down): {e}")

    global recognizer
    recognizer.train()
    print("DEBUG: Application successfully initialized model and database.")

os.makedirs("attendance", exist_ok=True)

# =================================================
# 🔐 AUTHENTICATION MODELS
# =================================================
class LoginRequest(BaseModel):
    role: str
    email: str
    password: str

class OTPRequest(BaseModel):
    role: str
    email: str
    otp: int

# =================================================
# 🔐 LOGIN APIs
# =================================================
@app.post("/login")
def login(data: LoginRequest):

    user = get_user(data.role, data.email)

    if not user:
        return {"success": False, "message": "User not found"}

    # demo password (college project)
    if data.password != "password":
        return {"success": False, "message": "Invalid password"}

    # ================= STUDENT =================
    if data.role == "Student":
        return {
            "success": True,
            "role": "Student",
            "student_id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "roll_no": user["roll_no"],
            "department": user["department"]
        }

    # ================= FACULTY / ADMIN =================
    generate_and_send_otp(data.email)

    return {
        "success": True,
        "otp_required": True,
        "role": data.role,
        "email": data.email
    }


@app.post("/verify-otp")
def verify_otp_api(data: OTPRequest):
    success, message = verify_otp(data.email, data.otp)

    if success:
        response = {
            "success": True,
            "role": data.role,
            "message": "Login successful"
        }
        if data.role == "Faculty":
            user = get_user("Faculty", data.email)
            if user:
                response["faculty_id"] = user["id"]
                response["name"] = user["name"]
                response["department"] = user["department"]
                response["subjects"] = user.get("subjects", [])
                response["subject_id"] = user.get("subject_id")
        elif data.role == "Admin":
            user = get_user("Admin", data.email)
            if user:
                response["name"] = user["name"]
        return response

    return {"success": False, "message": message}


class ResendOTPRequest(BaseModel):
    email: str

@app.post("/resend-otp")
def resend_otp_api(data: ResendOTPRequest):
    generate_and_send_otp(data.email)
    return {"success": True, "message": "OTP resent successfully"}

# =================================================
# 😁 FACE LOGIN API 

# =================================================
from Database import get_user_by_id

@app.post("/face-login")
async def face_login(
    file: UploadFile = File(...),
    role: str = Form(...)
):
    img_bytes = await file.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if frame is None:
        return {"success": False, "message": "Invalid image format"}

    embeddings = extract_face_embeddings(frame)

    if len(embeddings) == 0:
        return {"success": False, "message": "No face detected in feed (or occlusion too high)"}

    face_vector = np.array(embeddings[0]["embedding"])

    person_data, confidence = recognizer.predict(face_vector)

    if person_data is None:
        return {"success": False, "message": "Face not recognized"}

    role_map = {
        "student": "Student",
        "faculty": "Faculty",
        "admin": "Admin"
    }
    
    recognized_role = role_map.get(person_data["type"], "Student")

    if recognized_role.lower() != role.lower():
        return {"success": False, "message": f"Face matched a {recognized_role}, but you selected {role}."}

    user_id = person_data["id"]

    user = get_user_by_id(recognized_role, user_id)
    if not user:
        return {"success": False, "message": "Identified user not found in database"}

    response = {
        "success": True,
        "message": f"Welcome back, {user['name']}"
    }

    if recognized_role == "Student":
        response.update({
            "role": "Student",
            "student_id": user_id,
            "name": user["name"],
            "email": user["email"],
            "roll_no": user["roll_no"],
            "department": user["department"]
        })
    elif recognized_role == "Faculty":
        response.update({
            "role": "Faculty",
            "email": user["email"],
            "faculty_id": user["id"],
            "name": user["name"],
            "department": user["department"],
            "subjects": user.get("subjects", []),
            "subject_id": user.get("subject_id")
        })
    elif recognized_role == "Admin":
         response.update({
             "role": "Admin",
             "email": user["email"] 
         })

    return response

# =================================================
# 📸 FACE REGISTRATION
# =================================================
@app.post("/admin/register-face")
async def admin_register_face(
    person_type: str = Form(...),
    person_id: str = Form(...),
    file: UploadFile = File(...)
):
    from Database import get_connection
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    real_person_id = None
    if person_type.lower() == "student":
        # person_id is Roll Number
        cur.execute("SELECT id FROM students WHERE roll_no = %s", (person_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"success": False, "message": f"Student with Roll No. '{person_id}' not found"}
        real_person_id = person_id # Store Roll Number itself directly in faces table!
    else:
        # person_type is faculty, person_id is Faculty ID
        try:
            faculty_db_id = int(person_id)
        except ValueError:
            cur.close()
            conn.close()
            return {"success": False, "message": "Invalid Faculty ID (must be a number)"}
            
        cur.execute("SELECT id FROM faculty WHERE id = %s", (faculty_db_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"success": False, "message": f"Faculty with ID '{person_id}' not found"}
        real_person_id = str(faculty_db_id)
        
    cur.close()
    conn.close()

    img_bytes = await file.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if frame is None:
        return {"success": False, "message": "Invalid image"}

    embeddings = extract_face_embeddings(frame)

    if len(embeddings) == 0:
        return {"success": False, "message": "No face detected"}

    samples = []
    for emb in embeddings:
        samples.append(emb["embedding"])

    insert_face(person_type, real_person_id, np.array(samples))
    
    # Save the original image as student/faculty photo
    try:
        os.makedirs("Data/photos", exist_ok=True)
        photo_path = f"Data/photos/{person_type.lower()}_{real_person_id}.jpg"
        with open(photo_path, "wb") as f:
            f.write(img_bytes)
    except Exception as photo_err:
        print(f"DEBUG: Failed to save profile photo: {photo_err}")

    recognizer.train()

    return {
        "success": True,
        "samples_saved": len(samples)
    }


# =================================================
# 🔍 FACE RECOGNITION (IMAGE)
# =================================================
from fastapi import UploadFile, File, Form
from utils.db_utils import get_student_name_by_id

@app.post("/recognize")
async def recognize(
    file: UploadFile = File(...),
    subject_id: int = Form(1)   # default subject (can be selected by faculty)
):
    img_bytes = await file.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    embeddings = extract_face_embeddings(frame)
    print(f"DEBUG: Found {len(embeddings)} faces in frame")

    results = []

    for emb in embeddings:
        face_vector = np.array(emb["embedding"])
        person_data, confidence = recognizer.predict(face_vector)
        print(f"DEBUG: predict returned {person_data} with confidence {confidence}")

        if person_data is None or person_data["type"].lower() != "student":
            print("DEBUG: Ignored face because it's None or not a student")
            continue
            
        student_roll_no = person_data["id"]

        from Database import get_connection
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, name FROM students WHERE roll_no = %s", (student_roll_no,))
        student_row = cur.fetchone()
        cur.close()
        conn.close()

        if not student_row:
            print(f"DEBUG: Student with Roll No. {student_roll_no} not found during recognition")
            continue
            
        real_student_id = student_row["id"]
        student_name = student_row["name"]

        try:
            # ✅ Mark attendance
            attendance = recognizer.mark_attendance(
                student_id=real_student_id,
                subject_id=subject_id
            )
            print(f"DEBUG: Attendance marked for student ID {real_student_id}")
        except Exception as e:
            print(f"DEBUG: Failed to mark attendance: {e}")
            continue

        results.append({
            "student_id": real_student_id,
            "name": student_name,
            "confidence": confidence,
            "timestamp": attendance["time"]
        })

    print(f"DEBUG: Returning recognized results: {results}")
    return {"recognized": results}


# =================================================
# 🎥 LIVE ATTENDANCE (FACULTY)
# =================================================
# @app.get("/start-attendance")
# async def start_attendance():
#     cap = cv2.VideoCapture(0)
#     recognized = []

#     try:
#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 continue

#             gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#             faces = detect_faces(gray)

#             for (x, y, w, h) in faces:
#                 crop = frame[y:y+h, x:x+w]
#                 face_vector = preprocess_face(crop)

#                 name, confidence = recognizer.predict(face_vector)

#                 if name != "Unknown":
#                     ts = recognizer.mark_attendance(name)
#                     recognized.append({
#                         "name": name,
#                         "confidence": confidence,
#                         "timestamp": ts
#                     })
#                     break

#             if recognized:
#                 break
#     finally:
#         cap.release()

#     return {"status": "success", "recognized": recognized}

# =================================================
# 📊 ATTENDANCE APIs
# =================================================
@app.get("/get-attendance-today")
async def get_attendance_today():
    rows = fetch_attendance_all()
    return JSONResponse({"attendance": rows})


@app.get("/student/{student_id}/attendance")
def student_attendance(student_id: int):
    return {
        "heatmap": fetch_attendance_by_student_id(student_id)
    }

@app.get("/student/{student_id}/attendance-summary")
def student_attendance_summary(student_id: int):
    return fetch_attendance_summary_by_student_id(student_id)

import io
import csv
from fastapi.responses import StreamingResponse

@app.get("/faculty/student-records")
def get_faculty_student_records():
    rows = fetch_all_students_records()
    return JSONResponse({"records": rows})

@app.get("/faculty/export-attendance")
def export_attendance():
    rows = fetch_all_students_records()
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Write CSV Header
    writer.writerow(["Roll No", "Name", "Department", "Present Count", "Absent Count", "Total Classes", "Attendance (%)"])
    
    # Write Data
    for row in rows:
        writer.writerow([
            row.get("roll_no", ""),
            row.get("name", ""),
            row.get("department", ""),
            row.get("present_count", 0),
            row.get("absent_count", 0),
            row.get("total_classes", 30),
            f"{row.get('attendance_percentage', 0)}%"
        ])
    
    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=attendance_report.csv"
    return response



# =================================================
# ✅ HEALTH CHECK
# =================================================
@app.get("/")
def root():
    return {"status": "Backend running successfully"}



# main.py
from utils.db_utils import (
    insert_student,
    insert_faculty,
    insert_subject
)

# -------- MODELS --------
class Student(BaseModel):
    roll_no: str
    name: str
    email: str
    password: str
    department: str

class Faculty(BaseModel):
    id: int
    name: str
    email: str
    password: str
    department: str
    subject_ids: list[int] = None
    subject_id: int = None

class Subject(BaseModel):
    subject_name: str
    department: str
    faculty_ids: list[int] = None
    faculty_id: int = None


# -------- ROUTES --------
@app.get("/admin/stats")
def get_admin_stats():
    from Database import get_connection
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    cur.execute("SELECT COUNT(*) as count FROM students")
    students_count = cur.fetchone()["count"]
    
    cur.execute("SELECT COUNT(*) as count FROM faculty")
    faculty_count = cur.fetchone()["count"]
    
    cur.execute("SELECT COUNT(*) as count FROM subjects")
    subjects_count = cur.fetchone()["count"]
    
    cur.execute("SELECT COUNT(*) as count FROM attendance WHERE date = CURDATE() AND status = 'Present'")
    today_present = cur.fetchone()["count"]
    
    cur.close()
    conn.close()
    
    return {
        "success": True,
        "students": students_count,
        "faculty": faculty_count,
        "subjects": subjects_count,
        "today_present": today_present
    }

@app.get("/admin/subjects")
def get_all_subjects():
    from Database import get_connection
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, subject_name, department FROM subjects ORDER BY subject_name")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"success": True, "subjects": rows}

@app.get("/admin/faculty")
def get_all_faculty():
    from Database import get_connection
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, name, department FROM faculty ORDER BY name")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"success": True, "faculty": rows}

@app.post("/admin/add-student")


def add_student(data: Student):
    insert_student(**data.model_dump())
    return {"success": True,"message": "Student added successfully"}

@app.post("/admin/add-faculty")
def add_faculty(data: Faculty):
    # Resolve subject_ids from request or single subject_id fallback
    subject_ids = data.subject_ids or ([data.subject_id] if data.subject_id is not None else [])
    insert_faculty(
        id=data.id,
        name=data.name,
        email=data.email,
        password=data.password,
        department=data.department,
        subject_ids=subject_ids
    )
    return {"success": True}

@app.post("/admin/add-subject")
def add_subject(data: Subject):
    # Resolve faculty_ids from request or single faculty_id fallback
    faculty_ids = data.faculty_ids or ([data.faculty_id] if data.faculty_id is not None else [])
    insert_subject(
        subject_name=data.subject_name,
        department=data.department,
        faculty_ids=faculty_ids
    )
    return {"success": True}

# =================================================
# 📝 LEAVE MANAGEMENT APIs
# =================================================
from utils.db_utils import apply_leave, fetch_pending_leaves, update_leave_status, get_student_subjects

@app.get("/student/{student_id}/subjects")
def api_get_student_subjects(student_id: int):
    subjects = get_student_subjects(student_id)
    return {"success": True, "subjects": subjects}

class LeaveApplication(BaseModel):
    student_id: int
    subject_id: int
    date: str
    reason: str

@app.post("/student/apply-leave")
def api_apply_leave(data: LeaveApplication):
    apply_leave(data.student_id, data.subject_id, data.date, data.reason)
    return {"success": True, "message": "Leave application submitted successfully"}

@app.get("/faculty/{faculty_id}/pending-leaves")
def api_pending_leaves(faculty_id: int):
    leaves = fetch_pending_leaves(faculty_id)
    return {"success": True, "leaves": leaves}

class LeaveStatusUpdate(BaseModel):
    leave_id: int
    status: str

@app.post("/faculty/update-leave")
def api_update_leave(data: LeaveStatusUpdate):
    if data.status not in ["Approved", "Rejected"]:
        return {"success": False, "message": "Invalid status"}
    update_leave_status(data.leave_id, data.status)
    return {"success": True, "message": f"Leave {data.status.lower()} successfully"}


@app.get("/student/{student_id}/leaves")
def api_get_student_leaves(student_id: int):
    from utils.db_utils import fetch_student_leaves
    leaves = fetch_student_leaves(student_id)
    return {"success": True, "leaves": leaves}


from fastapi.responses import FileResponse
from fastapi import HTTPException

@app.get("/photo/{person_type}/{person_id}")
def get_profile_photo(person_type: str, person_id: int):
    person_type = person_type.lower()
    if person_type not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid person type")
    
    photo_path = f"Data/photos/{person_type}_{person_id}.jpg"
    if os.path.exists(photo_path):
        return FileResponse(photo_path)
        
    raise HTTPException(status_code=404, detail="Photo not found")


@app.post("/photo/upload")
async def upload_profile_photo(
    person_type: str = Form(...),
    person_id: int = Form(...),
    file: UploadFile = File(...)
):
    person_type = person_type.lower()
    if person_type not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid person type")
        
    img_bytes = await file.read()
    
    try:
        os.makedirs("Data/photos", exist_ok=True)
        photo_path = f"Data/photos/{person_type}_{person_id}.jpg"
        with open(photo_path, "wb") as f:
            f.write(img_bytes)
        return {"success": True, "message": "Photo uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save photo: {e}")


from Database import get_connection

@app.get("/faculty/{faculty_id}/stats")
def get_faculty_stats(faculty_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    
    # 1. Get faculty details
    cur.execute("SELECT department FROM faculty WHERE id = %s LIMIT 1", (faculty_id,))
    fac = cur.fetchone()
    if not fac:
        cur.close()
        conn.close()
        return {"success": False, "message": "Faculty not found"}
    
    dept = fac["department"]
    
    # 2. Get enrolled students count in this department
    cur.execute("SELECT COUNT(*) as count FROM students WHERE department = %s", (dept,))
    students_row = cur.fetchone()
    enrolled = students_row["count"] if students_row else 0
    
    # 3. Get subject IDs taught by this faculty
    cur.execute("SELECT DISTINCT subject_id AS id FROM faculty WHERE id = %s", (faculty_id,))
    subs = cur.fetchall()
    sub_ids = [s["id"] for s in subs]
    
    if not sub_ids:
        cur.close()
        conn.close()
        return {
            "success": True,
            "total_classes": 0,
            "avg_attendance": 0,
            "enrolled_students": enrolled
        }
        
    # 4. Count conducted classes (distinct dates in attendance for these subjects)
    format_strings = ','.join(['%s'] * len(sub_ids))
    cur.execute(
        f"SELECT COUNT(DISTINCT date) as count FROM attendance WHERE subject_id IN ({format_strings})",
        tuple(sub_ids)
    )
    classes_row = cur.fetchone()
    total_classes = classes_row["count"] if classes_row else 0
    
    # 5. Count total 'Present' records
    cur.execute(
        f"SELECT COUNT(*) as count FROM attendance WHERE subject_id IN ({format_strings}) AND status = 'Present'",
        tuple(sub_ids)
    )
    presents_row = cur.fetchone()
    total_presents = presents_row["count"] if presents_row else 0
    
    # 6. Calculate average attendance percentage
    if total_classes > 0 and enrolled > 0:
        total_possible = total_classes * enrolled
        avg_attendance = round((total_presents / total_possible) * 100, 1)
        if avg_attendance > 100:
            avg_attendance = 100.0
    else:
        avg_attendance = 0.0
        
    cur.close()
    conn.close()
    
    return {
        "success": True,
        "total_classes": total_classes,
        "avg_attendance": avg_attendance,
        "enrolled_students": enrolled
    }
