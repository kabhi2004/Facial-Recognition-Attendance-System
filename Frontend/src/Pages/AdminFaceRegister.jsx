import { useRef, useState } from "react";
import "./AdminFaceRegister.css";

const BASE_URL = "https://facial-recognition-attendance-system-production.up.railway.app";

export default function AdminFaceRegister() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [personType, setPersonType] = useState("student");
  const [personId, setPersonId] = useState("");
  const [message, setMessage] = useState("");
  const [stream, setStream] = useState(null);

  async function startCamera() {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    videoRef.current.srcObject = s;
    setStream(s);
  }

  function stopCamera() {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }

  async function registerFace() {
    if (!personId) {
      setMessage("❌ Enter valid ID");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setMessage("❌ Camera not ready");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();

      formData.append("person_type", personType);
      formData.append("person_id", String(personId));
      formData.append("file", blob, "face.jpg");

      const res = await fetch(`${BASE_URL}/admin/register-face`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("✅ Face Registered Successfully");
      } else {
        setMessage("❌ " + (data.message || "Registration failed"));
      }
    }, "image/jpeg");
  }

  return (
    <div className="afr-page">
      <div className="afr-card">
        <h2>Admin Face Registration</h2>

        <div className="afr-form">
          <select value={personType} onChange={e => setPersonType(e.target.value)}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>

          <input
            placeholder="Enter Student / Faculty ID"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
          />
        </div>

        <div className="afr-camera-box">
          <video playsInline ref={videoRef} autoPlay muted />
          <span className={stream ? "live-dot active" : "live-dot"} />
        </div>

        <div className="afr-buttons">
          <button className="btn start" onClick={startCamera}>Start Camera</button>
          <button className="btn register" onClick={registerFace}>Register Face</button>
          <button className="btn stop" onClick={stopCamera}>Stop</button>
        </div>

        <p className="afr-message">{message}</p>

        <canvas ref={canvasRef} hidden />
      </div>
    </div>
  );
}
