import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiUser } from "react-icons/fi";
import axios from "axios";
import "./StudentRecords.css";

export default function StudentRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://localhost:8000/faculty/student-records");
      setRecords(response.data.records);
    } catch (error) {
      console.error("Failed to fetch student records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColorClass = (percentage) => {
    if (percentage >= 75) return "good-attendance";
    if (percentage >= 50) return "average-attendance";
    return "poor-attendance";
  };

  const exportCSV = () => {
    const headers = ["Roll No", "Name", "Department", "Present", "Absent", "Total", "Percentage"];
    const rows = records.map(r => [
      r.roll_no,
      r.name,
      r.department,
      r.present_count,
      r.absent_count,
      r.total_classes,
      `${r.attendance_percentage}%`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_attendance_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="student-records-wrapper">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <main className="records-main">
        <header className="records-header">
          <div className="header-title">
            <h1>Student Records</h1>
            <p>Overall attendance statistics for all enrolled students.</p>
          </div>
          <div className="actions-nav">
            <button className="btn-back" onClick={() => navigate("/faculty/dashboard")}>
              <FiArrowLeft size={18} />
              <span>Back</span>
            </button>
            <button className="btn-export" onClick={exportCSV}>
              <FiDownload size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        <section className="table-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              Loading records...
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Classes Attended</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-info">
                          <div className="avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <strong>{student.name}</strong>
                        </div>
                      </td>
                      <td>{student.roll_no}</td>
                      <td>
                        <span className="dept-badge">{student.department}</span>
                      </td>
                      <td>
                        <div>{student.present_count} / {student.total_classes}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          Absent: {student.absent_count}
                        </div>
                      </td>
                      <td>
                        <div className={`percentage-text ${getPercentageColorClass(student.attendance_percentage)}`}>
                          {student.attendance_percentage}%
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${student.attendance_percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                      No student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
