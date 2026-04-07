import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, faceLogin } from "../Api/Api";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useCamera, setUseCamera] = useState(false);
  const [message, setMessage] = useState("");
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const navigate = useNavigate();

  const handleLoginSuccess = (data) => {
    // Both Password and Face Login converge here upon success
    if (data.role === "Student") {
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

    if (data.role === "Faculty") {
        localStorage.setItem(
            "user",
            JSON.stringify({
                role: "Faculty",
                email: data.email,
                subject_id: data.subject_id
            })
        );
        navigate("/faculty/dashboard");
        return;
    }
    
    if (data.role === "Admin") {
        localStorage.setItem(
            "user",
            JSON.stringify({
                role: "Admin",
                email: data.email
            })
        );
        navigate("/admin/dashboard");
        return;
    }
  };

  async function handleLogin(e) {
    e.preventDefault();
    const data = await loginUser(role, email, password);

    if (!data.success) {
      alert(data.message);
      return;
    }

    if (role === "Student") {
      handleLoginSuccess(data);
      return;
    }

    navigate("/otp", { state: data });
  }

  async function startCamera() {
    setUseCamera(true);
    setMessage("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = s;
      setStream(s);
    } catch (err) {
      setMessage("❌ Camera access denied.");
      setUseCamera(false);
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setUseCamera(false);
    setMessage("");
  }

  async function captureAndLogin() {
    setMessage("Analyzing face...");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const data = await faceLogin(blob, role);
      if (!data.success) {
        setMessage(`❌ ${data.message}`);
        return;
      }
      
      setMessage(`✅ ${data.message}. Redirecting...`);
      stopCamera();
      setTimeout(() => {
        handleLoginSuccess(data);
      }, 1000);
      
    }, "image/jpeg");
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
        {!useCamera ? (
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
            <button type="button" className="login-btn face-btn" onClick={startCamera}>Login with Face</button>
          </form>
        ) : (
          <div className="face-login-box">
             <video ref={videoRef} autoPlay muted className="face-video" />
             <canvas ref={canvasRef} hidden />
             <p className="message">{message}</p>
             <div className="btn-row">
                <button className="login-btn" onClick={captureAndLogin}>Scan & Login</button>
                <button className="cancel-btn" onClick={stopCamera}>Cancel</button>
             </div>
          </div>
        )}

        <p className="footer">
          Secure · Face Recognition · Attendance
        </p>
      </div>
    </div>
  );
}
