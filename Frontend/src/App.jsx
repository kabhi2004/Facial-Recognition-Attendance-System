import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import Otp from "./Pages/Otp";
import AdminDashboard from "./Pages/AdminDashboard";
import FacultyDashboard from "./Pages/FacultyDashboard";
import FacultyAttendance from "./Pages/FacultyAttendance";
import StudentDashboard from "./Pages/StudentDashboard";
import AdminFaceRegister from "./Pages/AdminFaceRegister";
import AddStudent from "./Pages/AddStudent";
import AddFaculty from "./Pages/AddFaculty";
import AddSubject from "./Pages/AddSubject";


import ProtectedRoute from "./Components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/register-face"
          element={
            <ProtectedRoute role="Admin">
              <AdminFaceRegister />
            </ProtectedRoute>
          }
        />

        {/* FACULTY */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute role="Faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/attendance"
          element={
            <ProtectedRoute role="Faculty">
              <FacultyAttendance />
            </ProtectedRoute>
          }
        />

        {/* STUDENT */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute role="Student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
         <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/add-student" element={<AddStudent />} />
        <Route path="/admin/add-faculty" element={<AddFaculty />} />
        <Route path="/admin/add-subject" element={<AddSubject />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
