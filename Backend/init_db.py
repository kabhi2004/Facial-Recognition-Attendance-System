import mysql.connector
from Database import get_connection

def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    queries = [
        """
        CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(100)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            roll_no VARCHAR(50) UNIQUE,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(100),
            department VARCHAR(100)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS faculty (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(100),
            department VARCHAR(100),
            subject_id INT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subject_name VARCHAR(100),
            department VARCHAR(100),
            faculty_id INT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS faces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            person_type VARCHAR(50),
            person_id INT,
            face_data MEDIUMBLOB
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            subject_id INT,
            date DATE,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_attendance (student_id, date)
        )
        """
    ]

    for q in queries:
        try:
            cur.execute(q)
        except Exception as e:
            print(f"Error executing query: {e}")

    conn.commit()
    cur.close()
    conn.close()
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    create_tables()
