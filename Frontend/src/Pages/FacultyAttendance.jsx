import { useEffect, useRef, useState } from "react";
import "./FacultyAttendance.css";

const BASE_URL = "http://localhost:8000";

export default function FacultyAttendance() {
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
      videoRef.current.srcObject = stream;
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
    canvas.width = 400;
    canvas.height = 300;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 400, 300);

    canvas.toBlob(async blob => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("subject_id", 1);

      const res = await fetch(`${BASE_URL}/recognize`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.recognized?.length) {
        setLogs(prev => [...data.recognized, ...prev]);
      }
    }, "image/jpeg");
  }

  return (
    <div className="attendance-page">
      <h1>Live Attendance</h1>

      <div className="attendance-card">
        <div className="camera-box">
          <video ref={videoRef} autoPlay muted />
          <span className={running ? "live-dot active" : "live-dot"} />
        </div>

        <div className="btn-row">
          <button
            className={running ? "scan-btn running" : "scan-btn"}
            onClick={startAttendance}
          >
            {running ? "Scanning Faces..." : "Start Attendance"}
          </button>

          <button className="stop-btn" onClick={stopCamera}>
            Stop Camera
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} hidden />

      <div className="log-card">
        <h3>Attendance Logs</h3>

        {logs.length === 0 && (
          <p className="empty">No students detected yet</p>
        )}

        {logs.map((l, i) => (
          <div className="log-row" key={i}>
            <span className="name">{l.name}</span>
            <span className="time">{l.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

