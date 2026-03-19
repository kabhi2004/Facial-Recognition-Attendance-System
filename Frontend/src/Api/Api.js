const BASE_URL = "http://localhost:8000";

/* ---------- LOGIN ---------- */
export async function loginUser(role, email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, email, password })
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