import { useNavigate } from "react-router-dom";
import "./FacultyDashboard.css";

export default function FacultyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="faculty-page">
      <div className="faculty-card">
        <h1>Faculty Dashboard</h1>
        <p>Start and manage today’s attendance session</p>

        <button
          className="start-btn"
          onClick={() => navigate("/faculty/attendance")}
        >
          🎥 Start Attendance
        </button>
      </div>
    </div>
  );
}
