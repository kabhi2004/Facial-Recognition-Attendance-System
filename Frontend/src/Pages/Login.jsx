import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../Api/Api";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    const data = await loginUser(role, email, password);

    if (!data.success) {
      alert(data.message);
      return;
    }

    // STUDENT → DIRECT LOGIN
    if (role === "Student") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          role: "Student",
          student_id: data.student_id,
          name: data.name,
          email: data.email,
        })
      );
      navigate("/student/dashboard");
      return;
    }

    // ADMIN / FACULTY → OTP
    navigate("/otp", { state: data });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <div className="logo-icon">U</div>
          <h2>UniCheck</h2>
        </div>

        <h3 className="title">Welcome to UniCheck</h3>
        <p className="subtitle">University Attendance System</p>

        {/* ROLE SELECTION */}
        <div className="role-box">
          <p>Select Your Role</p>
          <div className="roles">
            {["Student", "Faculty", "Admin"].map(r => (
              <button
                type="button"
                key={r}
                className={role === r ? "role active" : "role"}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="email@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="login-btn">Sign in securely</button>
        </form>

        <p className="footer">
          Secure · Face Recognition · Attendance
        </p>
      </div>
    </div>
  );
}
