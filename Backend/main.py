
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import cv2
import numpy as np
import os

# ---------- IMPORT YOUR EXISTING MODULES ----------
from utils.face_utils import detect_faces, preprocess_face
from utils.db_utils import (
    insert_face,
    fetch_attendance_all,
    fetch_attendance_by_student_id,
    fetch_attendance_summary_by_student_id
)
from AttendanceLogic import FaceRecognizer
from Database import get_user
from OtpGenerator import generate_and_send_otp, verify_otp

# ---------------- APP INIT ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- FACE MODEL INIT ----------------
recognizer = FaceRecognizer()
recognizer.train()

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
        return {
            "success": True,
            "role": data.role,
            "message": "Login successful"
        }

    return {"success": False, "message": message}

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

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detect_faces(gray)

    # ✅ FIX HERE
    if faces is None or len(faces) == 0:
        return {"success": False, "message": "No face detected"}

    samples = []
    for (x, y, w, h) in faces:
        crop = frame[y:y+h, x:x+w]
        samples.append(preprocess_face(crop))

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

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detect_faces(gray)

    results = []

    for (x, y, w, h) in faces:
        crop = frame[y:y+h, x:x+w]
        face_vector = preprocess_face(crop)

        student_id, confidence = recognizer.predict(face_vector)

        if student_id is None:
            continue

        # ✅ Mark attendance
        attendance = recognizer.mark_attendance(
            student_id=student_id,
            subject_id=subject_id
        )

        # ✅ Fetch student name
        student_name = get_student_name_by_id(student_id)

        results.append({
            "student_id": student_id,
            "name": student_name,
            "confidence": confidence,
            "timestamp": attendance["time"]
        })

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
