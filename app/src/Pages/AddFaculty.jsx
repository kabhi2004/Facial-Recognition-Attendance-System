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
    department: "",
    subject_id: ""
  });
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
    if (!form.id || !form.name || !form.email || !form.password || !form.department || !form.subject_id) {
      setMessage({ text: "Please fill in all the details", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await addFaculty({
        ...form,
        id: Number(form.id),
        subject_id: Number(form.subject_id)
      });
      if (data.success) {
        setMessage({ text: "Faculty registered successfully!", type: "success" });
        setForm({
          id: "",
          name: "",
          email: "",
          password: "",
          department: "",
          subject_id: ""
        });
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
            <label>Teaching Subject</label>
            <div className="input-wrapper">
              <FaBook className="input-field-icon" />
              <select
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                required
                className="afr-select"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_name} ({sub.department})
                  </option>
                ))}
              </select>
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
