import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import { getPendingLeaves, updateLeaveStatus } from "../Api/Api";
import "./StudentRecords.css"; // Reuse the table styles

export default function LeaveApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));
  const facultyId = user?.subject_id ? user.id : user?.faculty_id || user?.id; // Make sure we get faculty ID
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await getPendingLeaves(user.id || user.faculty_id || 1); // Pass faculty ID
      if (res.success) {
        setLeaves(res.leaves);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await updateLeaveStatus({ leave_id: id, status });
      if (res.success) {
        setMessage(`Leave ${status} successfully.`);
        setTimeout(() => setMessage(""), 3000);
        fetchLeaves(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <div className="student-records-wrapper">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <main className="records-main">
        <header className="records-header">
          <div className="header-title">
            <h1>Leave Approvals</h1>
            <p>Review and manage student leave applications.</p>
          </div>
          <div className="actions-nav">
            <button className="btn-back" onClick={() => navigate("/faculty/dashboard")}>
              <FiArrowLeft size={18} />
              <span>Back</span>
            </button>
          </div>
        </header>

        {message && (
          <div style={{ padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "8px", marginBottom: "20px" }}>
            {message}
          </div>
        )}

        <section className="table-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              Loading pending requests...
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Leave Date</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <div className="student-info">
                          <strong>{leave.name}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{leave.department}</span>
                        </div>
                      </td>
                      <td>{leave.roll_no}</td>
                      <td>{leave.subject_name || "General"}</td>
                      <td>{leave.date}</td>
                      <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>{leave.reason}</td>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button 
                            onClick={() => handleStatusUpdate(leave.id, "Approved")}
                            style={{ background: "#22c55e", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                          >
                            <FiCheck /> Approve
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(leave.id, "Rejected")}
                            style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                          >
                            <FiX /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                      No pending leave applications.
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
