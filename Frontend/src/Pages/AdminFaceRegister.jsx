import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminFaceRegister.css";
import { FaIdCard, FaCamera, FaVideoSlash, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const BASE_URL = "http://localhost:8000";

export default function AdminFaceRegister() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [personType, setPersonType] = useState("student");
  const [personId, setPersonId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);

  async function startCamera() {
    setMessage({ text: "", type: "" });
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        setStream(s);
      }
    } catch (err) {
      setMessage({ text: "❌ Camera access denied or unsupported", type: "error" });
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }

  async function registerFace() {
    if (!personId) {
      setMessage({ text: "Please enter a valid Student / Faculty ID", type: "error" });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !stream) {
      setMessage({ text: "Please start the camera first", type: "error" });
      return;
    }

    setCapturing(true);
    setMessage({ text: "Analyzing biometric markers...", type: "info" });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("person_type", personType);
      formData.append("person_id", String(personId));
      formData.append("file", blob, "face.jpg");

      try {
        const res = await fetch(`${BASE_URL}/admin/register-face`, {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setMessage({ text: "Face biometric registered successfully!", type: "success" });
          setPersonId("");
          stopCamera();
        } else {
          setMessage({ text: data.message || "Biometric registration failed", type: "error" });
        }
      } catch (err) {
        setMessage({ text: "Server connection failed", type: "error" });
      } finally {
        setCapturing(false);
      }
    }, "image/jpeg");
  }

  return (
    <div className="admin-form-page">
      <div className="form-glow-bg"></div>

      <div className="form-card-container biometric-card-container">
        <button className="form-back-btn" onClick={() => navigate("/admin/dashboard")}>
          <FaArrowLeft className="back-icon" /> Back to Dashboard
        </button>

        <div className="form-header">
          <div className="header-icon-wrapper biometric-icon-wrapper">
            <FaCamera className="header-icon" />
          </div>
          <h2>Biometric Face Register</h2>
          <p>Link face embeddings directly to student or faculty records</p>
        </div>

        {message.text && (
          <div className={`form-feedback-banner ${message.type}`}>
            {message.type === "success" && <FaCheckCircle style={{ marginRight: "6px" }} />}
            {message.type === "error" && <FaExclamationCircle style={{ marginRight: "6px" }} />}
            {message.text}
          </div>
        )}

        <div className="afr-form-grid">
          <div className="input-field-group">
            <label>Person Role</label>
            <div className="input-wrapper">
              <select value={personType} onChange={e => setPersonType(e.target.value)} className="afr-select">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>

          <div className="input-field-group">
            <label>Student / Faculty ID</label>
            <div className="input-wrapper">
              <FaIdCard className="input-field-icon" />
              <input
                placeholder="Enter database ID"
                value={personId}
                onChange={e => setPersonId(e.target.value)}
                className="afr-input"
                required
              />
            </div>
          </div>
        </div>

        {/* High-Tech Camera Viewport */}
        <div className="afr-camera-viewport">
          <div className="camera-frame-scanner">
            <video playsInline ref={videoRef} autoPlay muted className={`face-video-feed ${stream ? "active" : ""}`} />
            
            {!stream && (
              <div className="camera-fallback-screen">
                <FaVideoSlash className="fallback-camera-icon" />
                <p>Camera is currently offline</p>
              </div>
            )}

            {stream && (
              <>
                <div className="biometric-hud-overlay">
                  <div className="hud-corner top-left"></div>
                  <div className="hud-corner top-right"></div>
                  <div className="hud-corner bottom-left"></div>
                  <div className="hud-corner bottom-right"></div>
                  <div className="hud-reticle"></div>
                </div>
                <div className="camera-status-tag">
                  <span className="live-camera-pulse"></span> SCANNING ACTIVE
                </div>
              </>
            )}
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="afr-action-panel">
          {!stream ? (
            <button className="afr-btn start-stream-btn" onClick={startCamera}>
              <FaCamera className="btn-icon" /> Initialize Camera
            </button>
          ) : (
            <>
              <button 
                className={`afr-btn register-biometric-btn ${capturing ? "loading" : ""}`} 
                onClick={registerFace}
                disabled={capturing}
              >
                {capturing ? "Saving embeddings..." : "Analyze & Register Face"}
              </button>
              <button className="afr-btn stop-stream-btn" onClick={stopCamera}>
                Turn Off Camera
              </button>
            </>
          )}
        </div>

        <canvas ref={canvasRef} hidden />
      </div>
    </div>
  );
}
