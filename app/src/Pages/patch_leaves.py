import re

with open("LeaveApprovals.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
'''export default function LeaveApprovals() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);''',
'''export default function LeaveApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));
  const facultyId = user?.subject_id ? user.id : user?.faculty_id || user?.id; // Make sure we get faculty ID
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);'''
)

content = content.replace(
'''  const fetchLeaves = async () => {
    try {
      const res = await getPendingLeaves();''',
'''  const fetchLeaves = async () => {
    try {
      const res = await getPendingLeaves(user.id || user.faculty_id || 1); // Pass faculty ID'''
)

content = content.replace(
'''<th>Student Name</th>
                  <th>Roll No</th>
                  <th>Leave Date</th>
                  <th>Reason</th>
                  <th>Action</th>''',
'''<th>Student Name</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Leave Date</th>
                  <th>Reason</th>
                  <th>Action</th>'''
)

content = content.replace(
'''<td>{leave.roll_no}</td>
                      <td>{leave.date}</td>
                      <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>{leave.reason}</td>''',
'''<td>{leave.roll_no}</td>
                      <td>{leave.subject_name || "General"}</td>
                      <td>{leave.date}</td>
                      <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>{leave.reason}</td>'''
)

with open("LeaveApprovals.jsx", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("LeaveApprovals.jsx patched")
