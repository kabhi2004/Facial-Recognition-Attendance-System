import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
from deepface import DeepFace
import numpy as np
import traceback

dummy_frame = np.zeros((300, 400, 3), dtype=np.uint8)
try:
    print("Testing DeepFace represent...")
    res = DeepFace.represent(img_path=dummy_frame, model_name='Facenet', detector_backend='mtcnn', enforce_detection=False)
    print("Success, returned length:", len(res))
except Exception as e:
    print("Failed DeepFace:")
    traceback.print_exc()
