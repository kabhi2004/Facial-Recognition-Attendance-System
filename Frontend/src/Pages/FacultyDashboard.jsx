import { useNavigate } from "react-router-dom";
import { FiCamera, FiLogOut, FiUsers, FiClock, FiSettings, FiChevronRight } from "react-icons/fi";
import "./FacultyDashboard.css";

export default function FacultyDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
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
        <header className="dashboard-header">
          <div className="greeting-sec">
            <h1 className="gradient-text">Welcome back, Professor</h1>
            <p>Manage today's attendance and monitor student progress.</p>
          </div>
          <div className="header-date">
            <FiClock className="date-icon" size={18} />
            <span>{currentDate}</span>
          </div>
        </header>

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
          </div>
        </section>

        <section className="dashboard-stats">
          <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Total Classes</h4>
              <h2>42</h2>
              <span className="trend positive">↑ 12% this month</span>
            </div>
            <div className="stat-dec dec-blue"></div>
          </div>
          <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Avg. Attendance</h4>
              <h2>87%</h2>
              <span className="trend positive">↑ 5% from last week</span>
            </div>
            <div className="stat-dec dec-green"></div>
          </div>
           <div className="stat-card glass-effect">
            <div className="stat-info">
              <h4>Students Enrolled</h4>
              <h2>128</h2>
              <span className="trend neutral">- No change</span>
            </div>
             <div className="stat-dec dec-purple"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
