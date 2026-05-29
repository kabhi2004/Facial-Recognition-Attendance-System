-- Create Database (Optional, for Local/Aiven if needed)
-- CREATE DATABASE IF NOT EXISTS attendance_db;
-- USE attendance_db;

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);

-- Insert a default admin so you can log in the first time!
INSERT IGNORE INTO admin (name, email, password) 
VALUES ('Super Admin', 'admin@example.com', 'password');

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    department VARCHAR(100)
);

-- 3. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    department VARCHAR(100),
    subject_id INT
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100),
    department VARCHAR(100),
    faculty_id INT
);

-- 5. Faces Table (For facial recognition embeddings)
CREATE TABLE IF NOT EXISTS faces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_type VARCHAR(50),
    person_id INT,
    face_data MEDIUMBLOB
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_id, subject_id, date)
);
