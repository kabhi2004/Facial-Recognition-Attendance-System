import re

with open("StudentDashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add getMyLeaves to imports
content = content.replace(
'''import { getStudentAttendance, getStudentSummary, applyLeave, getStudentSubjects } from "../Api/Api";''',
'''import { getStudentAttendance, getStudentSummary, applyLeave, getStudentSubjects, getMyLeaves } from "../Api/Api";'''
)

# Add state and effect for leaves
content = content.replace(
'''  const [leaveMessage, setLeaveMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {''',
'''  const [leaveMessage, setLeaveMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    getMyLeaves(user.student_id).then(res => {
      if(res?.success) setMyLeaves(res.leaves);
    });'''
)

# Update handleApplyLeave to refetch
content = content.replace(
'''      if (res.success) {
        setLeaveMessage("Leave application submitted successfully!");
        setLeaveDate("");
        setLeaveReason("");
        setTimeout(() => setLeaveMessage(""), 3000);
      }''',
'''      if (res.success) {
        setLeaveMessage("Leave application submitted successfully!");
        setLeaveDate("");
        setLeaveReason("");
        getMyLeaves(user.student_id).then(res => {
          if(res?.success) setMyLeaves(res.leaves);
        });
        setTimeout(() => setLeaveMessage(""), 3000);
      }'''
)

# Render the leaves table
content = content.replace(
'''            </form>
          </div>
        </div>
      </div>
    </div>
  );
}''',
'''            </form>
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
}'''
)

# Fix summary rendering for total
content = content.replace(
'''        <div className="summary-card absent">
          <h2>{summary.absent ?? 0}</h2>
          <p>Absent</p>
        </div>''',
'''        <div className="summary-card absent">
          <h2>{summary.absent ?? 0}</h2>
          <p>Absent</p>
        </div>

        <div className="summary-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h2 style={{ color: "#334155" }}>{summary.total ?? 0}</h2>
          <p style={{ color: "#64748b" }}>Total Classes</p>
        </div>'''
)

with open("StudentDashboard.jsx", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("StudentDashboard.jsx updated")
