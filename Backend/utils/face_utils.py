import cv2
import numpy as np
from deepface import DeepFace

# Extract robust embeddings from an image using FaceNet
# Facial area is returned so we know where the face was found.
def extract_face_embeddings(frame):
    """
    Takes a BGR frame (from OpenCV) and extracts facial embeddings using DeepFace.
    Returns: a list of dictionaries where each dict contains:
        - embedding: A feature vector representation (e.g. 512 dimensions for Facenet512)
        - facial_area: {x, y, w, h}
    """
    try:
        # We use Facenet which balances high accuracy and moderate speed. 
        # retinaface as detector is the most accurate for masks, but OpenCV DNN is faster
        # Using detector_backend = 'opencv' (default) is fast, but 'retinaface' is better for occlusions.
        # Let's stick with opencv detector but Facenet embedding for occlusion robustness.
        
        results = DeepFace.represent(
            img_path=frame, 
            model_name="Facenet", 
            detector_backend="mtcnn", 
            enforce_detection=True 
        )
    except Exception as e:
        print(f"DEBUG(face_utils): extract_face_embeddings failed: {e}")
        return []
        
    return results

def detect_faces(frame_bgr):
    """
    Fallback or alternative just for drawing rects if needed
    """
    try:
        faces = DeepFace.extract_faces(
            img_path=frame_bgr, 
            detector_backend="opencv", 
            enforce_detection=False
        )
        boxes = []
        for face in faces:
            a = face.get("facial_area")
            if a and face.get("confidence", 1.0) > 0.8:
                 boxes.append((a["x"], a["y"], a["w"], a["h"]))
        return boxes
    except:
        return []
