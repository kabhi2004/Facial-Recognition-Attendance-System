import { useEffect, useState } from "react";
import "./dashboard.css";
import { Line } from "react-chartjs-2";

export default function Dashboard() {
  const [time, setTime] = useState("");
  const data = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Attendance",
      data: [0, 0, 0, 0, 0, 0, 1],
      borderColor: "green",
      fill: true,
    },
  ],
};

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* Sidebar */}
      <div className="sidebar">
        <h2>🎓 Attendance</h2>
        <p>Welcome,</p>
        <h3>Faizan Khan</h3>

        <button className="active">Dashboard</button>
        <button>Student Management</button>
        <button className="green">Mark Attendance</button>
        <button className="blue">Attendance Report</button>

        <button className="logout">Logout</button>
      </div>

      {/* Main Content */}
      <div className="main">
        
        {/* Header */}
        <div className="header">
          <div>
            <h2>Dashboard</h2>
            <p>{new Date().toDateString()}</p>
          </div>
          <h1>{time}</h1>
        </div>

        {/* Cards */}
        <div className="cards">
          <div className="card">
            <h4>Total Students</h4>
            <h1>1</h1>
          </div>

          <div className="card green">
            <h4>Present Today</h4>
            <h1>1</h1>
          </div>

          <div className="card red">
            <h4>Absent Today</h4>
            <h1>0</h1>
          </div>
        </div>

        {/* Chart Section */}
        <div className="chart">
          <h3>Attendance Trend (Last 7 Days)</h3>
          <div className="chart-box">
            📊 (You can integrate Chart.js here)
          </div>
        </div>

      </div>
    </div>
  );
}