import { useEffect, useState, useMemo } from "react";
import { getStudentAttendance, getStudentSummary } from "../Api/Api";
import { Tooltip } from "react-tooltip";
import { format, subDays } from "date-fns";
import "react-tooltip/dist/react-tooltip.css";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
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
      if (r.status === "Present") {
        map[dStr].count += 1;
        map[dStr].status = "Present";
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
      </div>

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
