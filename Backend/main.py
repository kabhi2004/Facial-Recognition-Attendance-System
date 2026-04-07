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
        "https://facial-recognition-attendance-syste-chi.vercel.app"
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
            "email": user["email"]
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
            from Database import get_connection
            user = get_user("Faculty", data.email)
            if user:
                conn = get_connection()
                cur = conn.cursor(dictionary=True)
                cur.execute("SELECT id FROM subjects WHERE faculty_id = %s LIMIT 1", (user["id"],))
                sub = cur.fetchone()
                cur.close()
                conn.close()
                if sub:
                    response["subject_id"] = sub["id"]
        return response

    return {"success": False, "message": message}

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
            "email": user["email"]
        })
    elif recognized_role == "Faculty":
        response.update({
            "role": "Faculty",
            "email": user["email"]
        })
        from Database import get_connection
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM subjects WHERE faculty_id = %s LIMIT 1", (user["id"],))
        sub = cur.fetchone()
        cur.close()
        conn.close()
        if sub:
            response["subject_id"] = sub["id"]
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
    person_id: int = Form(...),
    file: UploadFile = File(...)
):
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

    insert_face(person_type, int(person_id), np.array(samples))
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
            
        student_id = person_data["id"]

        try:
            # ✅ Mark attendance
            attendance = recognizer.mark_attendance(
                student_id=student_id,
                subject_id=subject_id
            )
            print(f"DEBUG: Attendance marked for {student_id}")
        except Exception as e:
            print(f"DEBUG: Failed to mark attendance: {e}")
            continue

        # ✅ Fetch student name
        student_name = get_student_name_by_id(student_id)

        results.append({
            "student_id": student_id,
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

@app.get("/faculty/student-records")
def get_faculty_student_records():
    rows = fetch_all_students_records()
    return JSONResponse({"records": rows})



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
    name: str
    email: str
    password: str
    department: str
    subject_id: int

class Subject(BaseModel):
    subject_name: str
    department: str
    faculty_id: int


# -------- ROUTES --------
@app.post("/admin/add-student")
def add_student(data: Student):
    insert_student(**data.model_dump())
    return {"success": True,"message": "Student added successfully"}

@app.post("/admin/add-faculty")
def add_faculty(data: Faculty):
    insert_faculty(**data.model_dump())
    return {"success": True}

@app.post("/admin/add-subject")
def add_subject(data: Subject):
    insert_subject(**data.model_dump())
    return {"success": True}
