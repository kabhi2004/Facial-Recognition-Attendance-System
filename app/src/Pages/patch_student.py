import re

with open("StudentDashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
'''import { getStudentAttendance, getStudentSummary, applyLeave } from "../Api/Api";''',
'''import { getStudentAttendance, getStudentSummary, applyLeave, getStudentSubjects } from "../Api/Api";'''
)

content = content.replace(
'''  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");

  useEffect(() => {''',
'''  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    getStudentSubjects(user.student_id).then(res => {
      if(res?.success) {
        setSubjects(res.subjects);
        if(res.subjects.length > 0) setSelectedSubject(res.subjects[0].id);
      }
    });'''
)

content = content.replace(
'''  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate || !leaveReason) return;
    
    try {
      const res = await applyLeave({
        student_id: user.student_id,
        date: leaveDate,
        reason: leaveReason
      });''',
'''  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate || !leaveReason || !selectedSubject) return;
    
    try {
      const res = await applyLeave({
        student_id: user.student_id,
        subject_id: Number(selectedSubject),
        date: leaveDate,
        reason: leaveReason
      });'''
)

content = content.replace(
'''            <form onSubmit={handleApplyLeave}>
              <div className="form-group">
                <label>Leave Date</label>''',
'''            <form onSubmit={handleApplyLeave}>
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
                <label>Leave Date</label>'''
)

with open("StudentDashboard.jsx", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("StudentDashboard.jsx patched")
