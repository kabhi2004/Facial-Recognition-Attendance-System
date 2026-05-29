import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addStudent } from "../Api/Api";
import "./AddStudent.css";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaIdCard, FaArrowLeft, FaPlus } from "react-icons/fa";

export default function AddStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    roll_no: "",
    name: "",
    email: "",
    password: "",
    department: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.roll_no || !form.name || !form.email || !form.password || !form.department) {
      setMessage({ text: "Please fill in all the details", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await addStudent(form);
      if (data.success) {
        setMessage({ text: "Student registered successfully!", type: "success" });
        setForm({
          roll_no: "",
          name: "",
          email: "",
          password: "",
          department: ""
        });
      } else {
        setMessage({ text: data.message || "Failed to register student", type: "error" });
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
          <h2>Register Student</h2>
          <p>Add a new student profile to the secure college registry</p>
        </div>

        {message.text && (
          <div className={`form-feedback-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="admin-interactive-form">
          <div className="input-field-group">
            <label>Roll Number</label>
            <div className="input-wrapper">
              <FaIdCard className="input-field-icon" />
              <input
                name="roll_no"
                placeholder="e.g. MCA-2026-04"
                value={form.roll_no}
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
                placeholder="e.g. Abhishek Kashyap"
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
                placeholder="e.g. abhishekkashyap@college.edu"
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

          <button 
            type="submit" 
            className={`form-submit-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Registering..." : <><FaPlus /> Register Student</>}
          </button>
        </form>
      </div>
    </div>
  );
}
