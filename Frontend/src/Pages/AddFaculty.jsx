import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addFaculty, getAdminSubjects } from "../Api/Api";
import "./AddFaculty.css";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaBook, FaArrowLeft, FaPlus } from "react-icons/fa";

export default function AddFaculty() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    department: ""
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all available subjects to populate the dropdown selector
    getAdminSubjects()
      .then(res => {
        if (res.success) {
          setSubjects(res.subjects || []);
        }
      })
      .catch(err => console.log("Failed to load subjects:", err));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.id || !form.name || !form.email || !form.password || !form.department || selectedSubjectIds.length === 0) {
      setMessage({ text: "Please fill in all the details and select at least one subject", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await addFaculty({
        ...form,
        id: Number(form.id),
        subject_ids: selectedSubjectIds
      });
      if (data.success) {
        setMessage({ text: "Faculty registered successfully!", type: "success" });
        setForm({
          id: "",
          name: "",
          email: "",
          password: "",
          department: ""
        });
        setSelectedSubjectIds([]);
      } else {
        setMessage({ text: data.message || "Failed to register faculty member", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-form-page">
      <div className="form-glow-bg"></div>
      
      <div className="form-card-container">
        <button className="form-back-btn" onClick={() => navigate("/admin/dashboard")}>
          <FaArrowLeft className="back-icon" /> Back to Dashboard
        </button>

        <div className="form-header">
          <div className="header-icon-wrapper">
            <FaUser className="header-icon" />
          </div>
          <h2>Register Faculty</h2>
          <p>Add a new faculty member profile to the secure college registry</p>
        </div>

        {message.text && (
          <div className={`form-feedback-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="admin-interactive-form">
          <div className="input-field-group">
            <label>Faculty ID (Number)</label>
            <div className="input-wrapper">
              <FaUser className="input-field-icon" />
              <input
                type="number"
                name="id"
                placeholder="e.g. 101"
                value={form.id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <FaUser className="input-field-icon" />
              <input
                name="name"
                placeholder="e.g. Hariom Yadav"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-field-icon" />
              <input
                type="email"
                name="email"
                placeholder="e.g. hariom@college.edu"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Security Password</label>
            <div className="input-wrapper">
              <FaLock className="input-field-icon" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Department</label>
            <div className="input-wrapper">
              <FaBuilding className="input-field-icon" />
              <input
                name="department"
                placeholder="e.g. MCA / CSE"
                value={form.department}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Teaching Subjects (Select one or more)</label>
            <div className="input-wrapper" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
              <div className="checkboxes-scroll-container" style={{
                maxHeight: "150px",
                overflowY: "auto",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "10px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                {subjects.map((sub) => (
                  <label key={sub.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#fff",
                    padding: "6px 0",
                    cursor: "pointer",
                    fontSize: "14px",
                    width: "100%"
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(sub.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                        } else {
                          setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                        }
                      }}
                      style={{ cursor: "pointer", width: "16px", height: "16px", margin: 0 }}
                    />
                    <span>{sub.subject_name} ({sub.department})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className={`form-submit-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Registering..." : <><FaPlus /> Register Faculty</>}
          </button>
        </form>
      </div>
    </div>
  );
}
