import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiVideoOff, FiPlayCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import "./FacultyAttendance.css";
import { BASE_URL } from "../Api/Api";


export default function FacultyAttendance() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [facultySubjects, setFacultySubjects] = useState([]);

  useEffect(() => {
    startCamera();
    
    // Retrieve subjects dynamically from the backend to ensure fresh database records
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const facultyId = user.faculty_id || user.id;
    if (facultyId) {
      fetch(`${BASE_URL}/faculty/${facultyId}/subjects`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.subjects) {
            setFacultySubjects(data.subjects);
            if (data.subjects.length > 0) {
              setSelectedSubject(data.subjects[0].id.toString());
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch faculty subjects:", err);
          // Fallback to localStorage session
          const subs = user.subjects || [];
          setFacultySubjects(subs);
          if (subs.length > 0) {
            setSelectedSubject(subs[0].id.toString());
          } else if (user.subject_id) {
            setSelectedSubject(user.subject_id.toString());
          }
        });
    } else {
      const subs = user.subjects || [];
      setFacultySubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0].id.toString());
      } else if (user.subject_id) {
        setSelectedSubject(user.subject_id.toString());
      }
    }

    return stopCamera; // cleanup on unmount
  }, []);

  function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
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
      const subject_id = selectedSubject || user.subject_id || 1;

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
               <video playsInline ref={videoRef} autoPlay muted />
               <div className="camera-overlay">
                  {running && <div className="scanning-bar"></div>}
                  <div className="live-badge">
                     <span className={running ? "live-dot active" : "live-dot"} />
                     {running ? "SCANNING PIPELINE ACTIVE" : "CAMERA READY"}
                  </div>
               </div>
            </div>

            {facultySubjects.length > 0 && (
              <div className="subject-select-container glass-effect" style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxSizing: "border-box",
                textAlign: "left"
              }}>
                <label style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500"
                }}>
                  Select Subject for Attendance:
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={running}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#1e293b",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  {facultySubjects.map(sub => (
                    <option key={sub.id} value={sub.id} style={{ background: "#1e293b", color: "#fff" }}>
                      {sub.subject_name} ({sub.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

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

