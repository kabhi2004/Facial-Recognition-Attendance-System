import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiLogOut, FiUsers, FiClock, FiSettings, FiChevronRight, FiUser, FiBook, FiMail } from "react-icons/fi";
import { getFacultyStats, BASE_URL } from "../Api/Api";
import "./FacultyDashboard.css";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [cacheBust, setCacheBust] = useState(Date.now());
  const [stats, setStats] = useState({
    total_classes: 0,
    avg_attendance: 0.0,
    enrolled_students: 0
  });

  useEffect(() => {
    if (!user || user.role !== "Faculty") {
      navigate("/login");
      return;
    }
    
    getFacultyStats(user.faculty_id || 1).then(res => {
      if (res && res.success) {
        setStats({
          total_classes: res.total_classes,
          avg_attendance: res.avg_attendance,
          enrolled_students: res.enrolled_students
        });
      }
    });
  }, [user?.faculty_id]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("person_type", "faculty");
    formData.append("person_id", String(user.faculty_id));
    formData.append("file", file);

    try {
      const res = await fetch(`${BASE_URL}/photo/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImgError(false);
        setCacheBust(Date.now()); // bust cache
      } else {
        alert("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error uploading photo: " + err.message);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="faculty-dashboard-wrapper">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="brand-logo">
            <FiCamera size={22} className="camera-icon-spin" />
          </div>
          <h2>SmartAttend</h2>
        </div>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Settings">
            <FiSettings size={20} />
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span>Logout</span>
            <FiLogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {/* FACULTY PROFILE CARD */}
        <div className="profile-header-card">
          <div 
            className="profile-photo-section" 
            onClick={triggerFileInput} 
            title="Click to upload profile photo"
          >
            {!imgError ? (
              <img
                src={`${BASE_URL}/photo/faculty/${user?.faculty_id}?t=${cacheBust}`}
                alt={user?.name}
                className="student-profile-photo"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="student-profile-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser size={36} />}
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            hidden 
          />

          <div className="profile-info-section">
            <div className="profile-title-row">
              <h1 className="gradient-text">Welcome back, <span>Prof. {user?.name || "Professor"}</span></h1>
              <span className="student-active-badge">Active Faculty</span>
            </div>
            
            <div className="profile-meta-grid">
              <div className="meta-item">
                <FiBook className="meta-icon" />
                <span><strong>Dept:</strong> {user?.department || "N/A"}</span>
              </div>
              <div className="meta-item">
                <FiMail className="meta-icon" />
                <span><strong>Email:</strong> {user?.email || "N/A"}</span>
              </div>
              <div className="meta-item">
                <FiClock className="meta-icon" />
                <span><strong>Session Date:</strong> {currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="quick-actions">
          <h2 className="section-title">Overview</h2>
          <div className="action-grid">
            <div 
              className="action-card primary-action glass-effect" 
              onClick={() => navigate("/faculty/attendance")}
            >
              <div className="card-icon-wrapper glow">
                <FiCamera size={32} />
              </div>
              <div className="card-content">
                <h3>Start Attendance Session</h3>
                <p>Launch AI face recognition for real-time tracking.</p>
              </div>
              <div className="card-arrow">
                <FiChevronRight size={24} />
              </div>
            </div>

            <div 
              className="action-card secondary-action glass-effect"
              onClick={() => navigate("/faculty/records")}
            >
              <div className="card-icon-wrapper purple-glow">
                <FiUsers size={32} />
              </div>
              <div className="card-content">
                <h3>Student Records</h3>
                <p>Review attendance history and generate reports.</p>
              </div>
              <div className="card-arrow">
                <FiChevronRight size={24} />
              </div>
            </div>

            <div 
              className="action-card secondary-action glass-effect"
              onClick={() => navigate("/faculty/leaves")}
            >
              <div className="card-icon-wrapper glow" style={{boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)'}}>
                <FiClock size={32} color="#facc15" />
              </div>
              <div className="card-content">
                <h3>Leave Approvals</h3>
                <p>Review and approve student leave requests.</p>
              </div>
              <div className="card-arrow">
                <FiChevronRight size={24} />
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-stats">
          <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Total Classes Conducted</h4>
              <h2>{stats.total_classes}</h2>
              <span className="trend positive">Live DB record</span>
            </div>
            <div className="stat-dec dec-blue"></div>
          </div>
          <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Avg. Attendance Rate</h4>
              <h2>{stats.avg_attendance}%</h2>
              <span className={`trend ${stats.avg_attendance >= 75 ? "positive" : "neutral"}`}>
                {stats.avg_attendance >= 75 ? "Good Standings" : "Attention Required"}
              </span>
            </div>
            <div className="stat-dec dec-green"></div>
          </div>
           <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Students Enrolled</h4>
              <h2>{stats.enrolled_students}</h2>
              <span className="trend neutral">Active count</span>
            </div>
             <div className="stat-dec dec-purple"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
