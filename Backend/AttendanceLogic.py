import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import normalize
from datetime import datetime

from utils.db_utils import fetch_all_faces, insert_attendance

class FaceRecognizer:
    def __init__(self, n_neighbors=1, threshold=1.0):
        self.n_neighbors = n_neighbors
        self.threshold = threshold
        self.model = None
        self.is_trained = False
        self.label_mapping = {}  # int -> {"id": person_id, "type": person_type}
        self.reverse_mapping = {}  # string -> int

    def train(self):
        data = fetch_all_faces()  # [(person_type, person_id, face_vector)]

        X, y = [], []
        current_idx = 0

        for person_type, person_id, sample in data:
            if person_id is None or sample is None:
                continue
            
            key = f"{person_type}_{person_id}"
            if key not in self.reverse_mapping:
                self.reverse_mapping[key] = current_idx
                self.label_mapping[current_idx] = {"id": person_id, "type": person_type}
                current_idx += 1
                
            X.append(sample)
            y.append(self.reverse_mapping[key])

        if not X:
            self.is_trained = False
            return

        # DeepFace embeddings should be converted to numpy arrays
        X = np.array(X, dtype=np.float32)
        y = np.array(y)

        self.model = KNeighborsClassifier(
            n_neighbors=self.n_neighbors,
            metric="cosine"
        )
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, face_vector):
        if not self.is_trained or self.model is None:
            return None, 0

        face_vector = np.array(face_vector, dtype=np.float32).reshape(1, -1)

        distances, _ = self.model.kneighbors(face_vector, n_neighbors=1)
        distance = distances[0][0]

        # For cosine distance, smaller is better (0 means perfect match). 
        # Making threshold very relaxed for varying lighting and camera quality.
        COSINE_THRESHOLD = 0.65
        print(f"DEBUG(predict): Evaluated distance {distance:.4f} against threshold {COSINE_THRESHOLD}")

        if distance > COSINE_THRESHOLD:
            return None, 0

        confidence = float(round(
            max(0, 100 - (float(distance) / COSINE_THRESHOLD) * 100),
            2
        ))

        predicted_label = int(self.model.predict(face_vector)[0])
        person_data = self.label_mapping.get(predicted_label)
        
        return person_data, confidence

    def mark_attendance(self, student_id: int, subject_id: int):
        student_id = int(student_id)
        subject_id = int(subject_id)

        insert_attendance(student_id, subject_id)

        return {
            "student_id": student_id,
            "status": "Present",
            "time": datetime.now().strftime("%H:%M:%S")
        }

