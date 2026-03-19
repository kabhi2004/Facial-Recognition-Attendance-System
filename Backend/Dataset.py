import cv2
import numpy as np
import mysql.connector
import pickle
from utils.face_utils import detect_faces, preprocess_face

# ---------------- MYSQL CONNECTION ----------------
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="pass123",
    database="face_attendance"
)
cursor = conn.cursor()

# ---------------- INPUT ----------------
student_id = input("Enter student ID: ").strip()
if not student_id.isdigit():
    raise SystemExit("Valid student ID is required")

student_id = int(student_id)

# ---------------- WEBCAM ----------------
cap = cv2.VideoCapture(0)

samples = []
frame_count = 0
MAX_SAMPLES = 100

print("📸 Capturing face samples... Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detect_faces(gray)

    for (x, y, w, h) in faces:
        crop = frame[y:y+h, x:x+w]
        face_vector = preprocess_face(crop)

        frame_count += 1
        if frame_count % 5 == 0:
            samples.append(face_vector)
            print(f"Samples collected: {len(samples)}")

        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    cv2.imshow("Dataset Capture", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    if len(samples) >= MAX_SAMPLES:
        break

cap.release()
cv2.destroyAllWindows()

# ---------------- SAVE TO MYSQL ----------------
if len(samples) == 0:
    print("❌ No face samples captured")
    conn.close()
    exit()

blob = pickle.dumps(np.array(samples))

cursor.execute(
    "INSERT INTO faces (student_id, face_data) VALUES (%s, %s)",
    (student_id, blob)
)

conn.commit()
cursor.close()
conn.close()

print(f"✅ Saved {len(samples)} samples for student_id={student_id}")

