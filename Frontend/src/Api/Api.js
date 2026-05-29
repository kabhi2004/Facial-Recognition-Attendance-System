const BASE_URL = "https://kabhi25-unicheck.hf.space";

/* ---------- LOGIN ---------- */
export async function loginUser(role, email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, email, password })
  });
  return await res.json();
}

export async function faceLogin(blob, role) {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("role", role);
  
  const res = await fetch(`${BASE_URL}/face-login`, {
    method: "POST",
    body: formData
  });
  return await res.json();
}

/* ---------- OTP ---------- */
export async function verifyOtp(role, email, otp) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, email, otp: Number(otp) })
  });
  return await res.json();
}

export async function resendOtp(email) {
  const res = await fetch(`${BASE_URL}/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return await res.json();
}


/* ---------- ATTENDANCE ---------- */
export async function getTodayAttendance() {
  const res = await fetch(`${BASE_URL}/get-attendance-today`);
  return await res.json();
}

export async function getStudentAttendance(id) {
  const res = await fetch(`${BASE_URL}/student/${id}/attendance`);
  return await res.json();
}

export async function getStudentSummary(id) {
  const res = await fetch(`${BASE_URL}/student/${id}/attendance-summary`);
  return await res.json();
}
export async function getAdminStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`);
  return res.json();
}

export async function getAdminSubjects() {
  const res = await fetch(`${BASE_URL}/admin/subjects`);
  return res.json();
}

export async function getAdminFaculty() {
  const res = await fetch(`${BASE_URL}/admin/faculty`);
  return res.json();
}



export async function addStudent(data) {

  const res = await fetch(`${BASE_URL}/admin/add-student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function addFaculty(data) {
  const res = await fetch(`${BASE_URL}/admin/add-faculty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function addSubject(data) {
  const res = await fetch(`${BASE_URL}/admin/add-subject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

/* ---------- LEAVES ---------- */
export async function getStudentSubjects(student_id) {
  const res = await fetch(`${BASE_URL}/student/${student_id}/subjects`);
  return res.json();
}

export async function applyLeave(data) {
  const res = await fetch(`${BASE_URL}/student/apply-leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getPendingLeaves(faculty_id) {
  const res = await fetch(`${BASE_URL}/faculty/${faculty_id}/pending-leaves`);
  return res.json();
}

export async function updateLeaveStatus(data) {
  const res = await fetch(`${BASE_URL}/faculty/update-leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getMyLeaves(student_id) {
  const res = await fetch(`${BASE_URL}/student/${student_id}/leaves`);
  return res.json();
}

export async function getFacultyStats(faculty_id) {
  const res = await fetch(`${BASE_URL}/faculty/${faculty_id}/stats`);
  return res.json();
}
