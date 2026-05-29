import { useEffect, useState, useMemo } from "react";
import { getStudentAttendance, getStudentSummary, applyLeave, getStudentSubjects, getMyLeaves } from "../Api/Api";
import { Tooltip } from "react-tooltip";
import { format, subDays } from "date-fns";
import "react-tooltip/dist/react-tooltip.css";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({});
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    getMyLeaves(user.student_id).then(res => {
      if(res?.success) setMyLeaves(res.leaves);
    });
    getStudentSubjects(user.student_id).then(res => {
      if(res?.success) {
        setSubjects(res.subjects);
        if(res.subjects.length > 0) setSelectedSubject(res.subjects[0].id);
      }
    });
    getStudentAttendance(user.student_id).then(r => setList(r?.heatmap || []));
    getStudentSummary(user.student_id).then(setSummary);
  }, [user.student_id]);

  // Process data for heatmap (Optimized to run only when 'list' changes)
  const { attendanceMap, days } = useMemo(() => {
    const map = {};
    list.forEach(r => {
      let dStr;
      try {
        dStr = format(new Date(r.date), "yyyy-MM-dd");
      } catch (e) {
        dStr = r.date;
      }
      if (!map[dStr]) {
        map[dStr] = { count: 0, status: r.status };
      }
      if (r.status === "Present" || r.status === "Leave") {
        map[dStr].count += 1;
        map[dStr].status = r.status;
      }
    });

    // Generate 120 days for the grid
    const dList = [];
    const today = new Date();
    const start = subDays(today, 120);
    start.setDate(start.getDate() - start.getDay()); // Start on a Sunday

    let curr = new Date(start);
    while (curr <= today) {
      dList.push(format(curr, "yyyy-MM-dd"));
      curr.setDate(curr.getDate() + 1);
    }

    return { attendanceMap: map, days: dList };
  }, [list]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate || !leaveReason || !selectedSubject) return;
    
    try {
      const res = await applyLeave({
        student_id: user.student_id,
        subject_id: Number(selectedSubject),
        date: leaveDate,
        reason: leaveReason
      });
      if (res.success) {
        setLeaveMessage("Leave application submitted successfully!");
        setLeaveDate("");
        setLeaveReason("");
        getMyLeaves(user.student_id).then(res => {
          if(res?.success) setMyLeaves(res.leaves);
        });
        setTimeout(() => setLeaveMessage(""), 3000);
      }
    } catch (err) {
      setLeaveMessage("Failed to submit leave application.");
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>
          Welcome <span>{user?.name}</span>
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

        <div className="summary-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h2 style={{ color: "#334155" }}>{summary.total ?? 0}</h2>
          <p style={{ color: "#64748b" }}>Total Classes</p>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="left-column">
          {/* HEATMAP */}
          <div className="heatmap-wrapper">
            <h3>Attendance Activity</h3>
            <div className="heatmap-scroll">
              <div className="custom-heatmap">
                <div className="heatmap-weekdays">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="heatmap-grid">
                  {days.map(d => {
                    const val = attendanceMap[d];
                    let className = "color-empty";
                    let tooltipText = `${d}: No attendance`;
                    if (val) {
                      tooltipText = `${d}: ${val.status} (${val.count} classes)`;
                      if (val.count === 0 && val.status === "Absent") {
                        className = "color-absent";
                      } else if (val.status === "Leave") {
                        className = "color-leave"; // Yellow for leave
                      } else if (val.count === 1) {
                        className = "color-present-1";
                      } else if (val.count === 2) {
                        className = "color-present-2";
                      } else if (val.count >= 3) {
                        className = "color-present-3";
                      }
                    }
                    return (
                      <div
                        key={d}
                        className={`heatmap-cell ${className}`}
                        data-tooltip-id="heatmap-tooltip"
                        data-tooltip-content={tooltipText}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <Tooltip id="heatmap-tooltip" />
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
                            : r.status === "Leave"
                            ? "status-badge leave"
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

        <div className="right-column">
          {/* LEAVE APPLICATION FORM */}
          <div className="leave-form-wrapper">
            <h3>Apply for Leave</h3>
            <p>Submit a request for an upcoming absence.</p>
            {leaveMessage && <div className="leave-message">{leaveMessage}</div>}
            <form onSubmit={handleApplyLeave}>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)} 
                  required
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", backgroundColor: "white" }}
                >
                  <option value="" disabled>Select a Subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} (Prof. {s.faculty_name})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Leave Date</label>
                <input 
                  type="date" 
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea 
                  rows="4" 
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain why you will be absent..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn-submit-leave">Submit Leave</button>
            </form>
          </div>

          <div className="table-wrapper" style={{ marginTop: "32px" }}>
            <h3>My Leave Applications</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.length > 0 ? myLeaves.map((l, i) => (
                  <tr key={i}>
                    <td>{l.date}</td>
                    <td>{l.subject_name || "General"}</td>
                    <td>
                      <span
                        className={
                          l.status === "Approved"
                            ? "status-badge present"
                            : l.status === "Rejected"
                            ? "status-badge absent"
                            : "status-badge leave"
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" style={{ textAlign: "center" }}>No leaves applied yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
