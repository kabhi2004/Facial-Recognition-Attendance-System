import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import normalize
from datetime import datetime

from utils.db_utils import fetch_all_faces, insert_attendance

class FaceRecognizer:
    def __init__(self, n_neighbors=1, threshold=1000):
        self.n_neighbors = n_neighbors
        self.threshold = threshold
        self.model = None
        self.is_trained = False

    def train(self):
        data = fetch_all_faces()  # [(student_id, face_vector)]

        X, y = [], []

        for student_id, sample in data:
            if student_id is None or sample is None:
                continue
            X.append(sample)
            y.append(int(student_id))

        if not X:
            self.is_trained = False
            return

        X = normalize(np.array(X, dtype=np.float32))
        y = np.array(y)

        self.model = KNeighborsClassifier(
            n_neighbors=self.n_neighbors,
            metric="euclidean"
        )
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, face_vector):
        if not self.is_trained or self.model is None:
            return None, 0

        face_vector = normalize(face_vector.reshape(1, -1))

        distances, _ = self.model.kneighbors(face_vector, n_neighbors=1)
        distance = distances[0][0]

        if distance > self.threshold:
            return None, 0

        confidence = round(
            max(0, 100 - (distance / self.threshold) * 100),
            2
        )

        student_id = int(self.model.predict(face_vector)[0])
        return student_id, confidence

    def mark_attendance(self, student_id: int, subject_id: int):
        student_id = int(student_id)
        subject_id = int(subject_id)

        insert_attendance(student_id, subject_id)

        return {
            "student_id": student_id,
            "status": "Present",
            "time": datetime.now().strftime("%H:%M:%S")
        }

