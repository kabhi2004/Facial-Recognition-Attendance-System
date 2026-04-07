import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiVideoOff, FiPlayCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import "./FacultyAttendance.css";

const BASE_URL = "http://localhost:8000";

export default function FacultyAttendance() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    startCamera();
    return stopCamera; // cleanup on unmount
  }, []);

  function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      streamRef.current = stream;
      if(videoRef.current) videoRef.current.srcObject = stream;
    });
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRunning(false);
  }

  function startAttendance() {
    if (running) return;
    setRunning(true);

    const interval = setInterval(capture, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setRunning(false);
    }, 30000);
  }

  async function capture() {
    const canvas = canvasRef.current;
    if(!canvas || !videoRef.current) return;
    
    canvas.width = 400;
    canvas.height = 300;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 400, 300);

    canvas.toBlob(async blob => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const subject_id = user.subject_id || 1;

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("subject_id", subject_id);

      try {
        const res = await fetch(`${BASE_URL}/recognize`, {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        if (data.recognized?.length) {
          setLogs(prev => {
            const newLogs = [...data.recognized, ...prev];
            // keep unique names to avoid spamming the UI with same person
            const uniqueLogs = Array.from(new Map(newLogs.map(item => [item.name, item])).values());
            return uniqueLogs;
          });
        }
      } catch (err) {
        console.error("Recognition Error", err);
      }
    }, "image/jpeg");
  }

  return (
    <div className="attendance-page-wrapper">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="brand-logo">
            <FiCamera size={22} className="camera-icon-spin" />
          </div>
          <h2>SmartAttend Live</h2>
        </div>
        <div className="nav-actions">
           <button className="btn-back-nav" onClick={() => navigate("/faculty/dashboard")}>
              <FiArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
        </div>
      </nav>

      <main className="attendance-main">
        <header className="attendance-header">
           <h1 className="gradient-text">Live Classroom Session</h1>
           <p>Position the camera so that students are clearly visible. The AI will automatically mark them present.</p>
        </header>

        <div className="attendance-content">
          <div className="camera-section glass-effect">
            <div className={`camera-box ${running ? 'scanning' : ''}`}>
               <video ref={videoRef} autoPlay muted playsInline />
               <div className="camera-overlay">
                  {running && <div className="scanning-bar"></div>}
                  <div className="live-badge">
                     <span className={running ? "live-dot active" : "live-dot"} />
                     {running ? "SCANNING PIPELINE ACTIVE" : "CAMERA READY"}
                  </div>
               </div>
            </div>

            <div className="attendance-controls">
              <button
                className={running ? "action-btn running pulse-animation" : "action-btn primary-btn"}
                onClick={startAttendance}
              >
                {running ? (
                  <>
                     <FiPlayCircle className="spin-icon" size={20} />
                     Scanning in Progress (30s)
                  </>
                ) : (
                  <>
                    <FiCamera size={20} />
                    Start Auto-Attendance
                  </>
                )}
              </button>

              <button className="action-btn danger-btn" onClick={stopCamera}>
                <FiVideoOff size={20} />
                Stop Camera Feed
              </button>
            </div>
          </div>
          
          <div className="logs-section glass-effect">
             <div className="logs-header">
                <h3>Live Attendance Log</h3>
                <span className="log-count">{logs.length} detected</span>
             </div>
             
             <div className="logs-container">
               {logs.length === 0 ? (
                 <div className="empty-logs">
                    <FiUsers size={40} className="empty-icon" />
                    <p>No students detected yet.</p>
                    <span>Start the scan to capture faces in real-time.</span>
                 </div>
               ) : (
                 <ul className="log-list">
                   {logs.map((l, i) => (
                     <li className="log-item" key={i}>
                       <div className="log-info">
                         <div className="log-avatar">{l.name.charAt(0)}</div>
                         <div className="log-details">
                            <span className="name">{l.name}</span>
                            <span className="confidence">Match: {Math.round(l.confidence || 95)}%</span>
                         </div>
                       </div>
                       <div className="log-status">
                          <FiCheckCircle size={16} className="text-success" />
                          <span className="time">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>
        </div>

        <canvas ref={canvasRef} hidden />
      </main>
    </div>
  );
}

// Temporary import for empty icon above
import { FiUsers } from "react-icons/fi";

