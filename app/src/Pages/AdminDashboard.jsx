import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTodayAttendance, getAdminStats } from "../Api/Api";
import "./AdminDashboard.css";
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaBook, 
  FaUsers, 
  FaUserTie, 
  FaGraduationCap, 
  FaClipboardCheck, 
  FaSearch, 
  FaSignOutAlt, 
  FaIdCard, 
  FaChartLine 
} from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    subjects: 0,
    today_present: 0
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [adminUser, setAdminUser] = useState({ email: "admin@example.com" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }
    
    setAdminUser(user);

    // Fetch live database statistics
    getAdminStats()
      .then(res => {
        if (res.success) {
          setStats({
            students: res.students,
            faculty: res.faculty,
            subjects: res.subjects,
            today_present: res.today_present
          });
        }
      })
      .catch(err => console.log("Failed to fetch admin stats:", err));

    // Fetch today's real-time attendance logs
    getTodayAttendance()
      .then(res => setAttendance(res.attendance || []))
      .catch(() => setAttendance([]));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Extract unique departments for filtering
  const departments = ["All", ...new Set(attendance.map(item => item.department).filter(Boolean))];

  // Apply Search and Filters to Datagrid
  const filteredAttendance = attendance.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.roll_no && item.roll_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesDept = deptFilter === "All" || item.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate formatted current date
  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="admin-container">
      {/* 1. LEFT PANEL (SIDEBAR) */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">U</div>
          <h2>UniCheck</h2>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">{adminUser.name ? adminUser.name.charAt(0).toUpperCase() : "A"}</div>
          <div className="profile-info">
            <h3>{adminUser.name || "Super Admin"}</h3>
            <p>{adminUser.email}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <FaChartLine className="nav-icon" /> Dashboard
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/register-face")}>
            <FaIdCard className="nav-icon" /> Register Face
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/add-student")}>
            <FaUserGraduate className="nav-icon" /> Add Student
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/add-faculty")}>
            <FaChalkboardTeacher className="nav-icon" /> Add Faculty
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/add-subject")}>
            <FaBook className="nav-icon" /> Add Subject
          </button>
        </nav>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" /> Sign Out
        </button>
      </aside>

      {/* 2. RIGHT PANEL (MAIN CONTENT) */}
      <main className="admin-main">
        {/* Header Section */}
        <header className="main-header">
          <div className="header-greetings">
            <h1>Admin Panel</h1>
            <p className="calendar-date">{todayDateString}</p>
          </div>
          <button 
            className="header-btn"
            onClick={() => navigate("/admin/register-face")}
          >
            + Register Face
          </button>
        </header>

        {/* Dynamic Analytics Stats Widgets */}
        <section className="stats-grid">
          <div className="stat-glow-card purple">
            <div className="stat-info">
              <span className="stat-label">Total Students</span>
              <h2 className="stat-value">{stats.students}</h2>
            </div>
            <div className="stat-icon-wrapper">
              <FaUsers className="stat-icon" />
            </div>
          </div>

          <div className="stat-glow-card blue">
            <div className="stat-info">
              <span className="stat-label">Active Faculty</span>
              <h2 className="stat-value">{stats.faculty}</h2>
            </div>
            <div className="stat-icon-wrapper">
              <FaUserTie className="stat-icon" />
            </div>
          </div>

          <div className="stat-glow-card indigo">
            <div className="stat-info">
              <span className="stat-label">Total Subjects</span>
              <h2 className="stat-value">{stats.subjects}</h2>
            </div>
            <div className="stat-icon-wrapper">
              <FaGraduationCap className="stat-icon" />
            </div>
          </div>

          <div className="stat-glow-card emerald">
            <div className="stat-info">
              <span className="stat-label">Today's Checkins</span>
              <h2 className="stat-value">{stats.today_present}</h2>
            </div>
            <div className="stat-icon-wrapper">
              <FaClipboardCheck className="stat-icon" />
            </div>
          </div>
        </section>

        {/* Primary Action Shortcuts */}
        <section className="shortcuts-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="admin-actions">
            <div className="action-card" onClick={() => navigate("/admin/add-student")}>
              <FaUserGraduate className="card-icon" />
              <h3>Add Student</h3>
              <p>Register new student profiles and departments</p>
            </div>

            <div className="action-card" onClick={() => navigate("/admin/add-faculty")}>
              <FaChalkboardTeacher className="card-icon" />
              <h3>Add Faculty</h3>
              <p>Enroll faculty members and link credentials</p>
            </div>

            <div className="action-card" onClick={() => navigate("/admin/add-subject")}>
              <FaBook className="card-icon" />
              <h3>Add Subject</h3>
              <p>Map new subjects to respective faculty IDs</p>
            </div>
          </div>
        </section>

        {/* Live Today's Attendance Feed Datagrid */}
        <section className="datagrid-section">
          <div className="datagrid-header-row">
            <h3 className="section-title">Today's Live Attendance Feed</h3>
            <span className="live-pill"><span className="live-dot"></span> LIVE TRACKING</span>
          </div>

          <div className="datagrid-card">
            {/* Search & Filter Controls */}
            <div className="datagrid-controls">
              <div className="search-box-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by student name or roll no..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filters-wrapper">
                <div className="filter-select-group">
                  <label>Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Approved Leave">On Leave</option>
                  </select>
                </div>

                <div className="filter-select-group">
                  <label>Department</label>
                  <select 
                    value={deptFilter} 
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="filter-select"
                  >
                    {departments.map((dept, i) => (
                      <option key={i} value={dept}>{dept === "All" ? "All Departments" : dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Datagrid Table */}
            <div className="table-responsive">
              {filteredAttendance.length > 0 ? (
                <table className="modern-datagrid">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Department</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((row, idx) => (
                      <tr key={idx}>
                        <td className="student-name-cell">{row.name}</td>
                        <td className="mono-cell">{row.roll_no || "N/A"}</td>
                        <td>{row.department || "N/A"}</td>
                        <td className="subject-cell">{row.subject || "N/A"}</td>
                        <td>
                          <span className={`status-badge ${row.status.toLowerCase().replace(" ", "-")}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="timestamp-cell">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="datagrid-empty-state">
                  <p>No records found matching the active search and filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}