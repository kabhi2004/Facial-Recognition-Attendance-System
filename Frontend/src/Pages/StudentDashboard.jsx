import { useEffect, useState } from "react";
import { getStudentAttendance, getStudentSummary } from "../Api/Api";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    getStudentAttendance(user.student_id).then(r => setList(r.heatmap));
    getStudentSummary(user.student_id).then(setSummary);
  }, []);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>
          Welcome <span>{user.name}</span>
        </h1>
        <p>Your attendance overview</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card present">
          <h2>{summary.present ?? 0}</h2>
          <p>Present</p>
        </div>

        <div className="summary-card absent">
          <h2>{summary.absent ?? 0}</h2>
          <p>Absent</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <h3>Attendance History</h3>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {list.map((r, i) => (
              <tr key={i}>
                <td>{r.date}</td>
                <td>{r.subject_name}</td>
                <td>
                  <span
                    className={
                      r.status === "Present"
                        ? "status-badge present"
                        : "status-badge absent"
                    }
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
