import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="pass123",
    database="face_attendance"
)

print("✅ Connected to MySQL successfully")
conn.close()
