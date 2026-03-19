import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTodayAttendance } from "../Api/Api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }

    getTodayAttendance()
      .then(res => setAttendance(res.attendance || []))
      .catch(() => setAttendance([]));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button
          className="primary-btn"
          onClick={() => navigate("/admin/register-face")}
        >
          Register Face
        </button>
      </div>

      <div className="admin-actions">
        <div className="action-card" onClick={() => navigate("/admin/add-student")}>
          <h3>Add Student</h3>
          <p>Register new students</p>
        </div>

        <div className="action-card" onClick={() => navigate("/admin/add-faculty")}>
          <h3>Add Faculty</h3>
          <p>Register faculty members</p>
        </div>

        <div className="action-card" onClick={() => navigate("/admin/add-subject")}>
          <h3>Add Subject</h3>
          <p>Create subjects</p>
        </div>
      </div>
    </div>
  );
}

