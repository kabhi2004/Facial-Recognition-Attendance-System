import cv2
import numpy as np
import os

# Absolute path (VERY IMPORTANT for FastAPI / uvicorn)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASCADE_PATH = os.path.join(BASE_DIR, "data", "haarcascade_frontalface_default.xml")

cascade = cv2.CascadeClassifier(CASCADE_PATH)

if cascade.empty():
    raise FileNotFoundError(f"Haarcascade not found at {CASCADE_PATH}")

def detect_faces(gray_frame, scaleFactor=1.3, minNeighbors=5, minSize=(50, 50)):
    return cascade.detectMultiScale(
        gray_frame,
        scaleFactor=scaleFactor,
        minNeighbors=minNeighbors,
        flags=cv2.CASCADE_SCALE_IMAGE,   # ✅ REQUIRED
        minSize=minSize                 # ✅ keyword argument
    )

def preprocess_face(bgr_face, size=(80, 80)):
      gray = cv2.cvtColor(bgr_face, cv2.COLOR_BGR2GRAY)
      resized = cv2.resize(gray, size)
      return resized.flatten().astype(np.float32)
 
def preprocess_face_from_gray(gray_face, size=(50, 50)):
      resized = cv2.resize(gray_face, size)
      return resized.flatten().astype(np.float32)
