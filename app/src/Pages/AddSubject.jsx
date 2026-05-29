import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addSubject, getAdminFaculty } from "../Api/Api";
import "./AddSubject.css";
import { FaBook, FaBuilding, FaUserTie, FaArrowLeft, FaPlus } from "react-icons/fa";

export default function AddSubject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject_name: "",
    department: ""
  });
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all active faculty members to populate the dropdown mapping selector
    getAdminFaculty()
      .then(res => {
        if (res.success) {
          setFaculties(res.faculty || []);
        }
      })
      .catch(err => console.log("Failed to load faculty:", err));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.subject_name || !form.department || selectedFacultyIds.length === 0) {
      setMessage({ text: "Please fill in all the details and select at least one faculty", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await addSubject({
        ...form,
        faculty_ids: selectedFacultyIds
      });
      if (data.success) {
        setMessage({ text: "Subject added successfully!", type: "success" });
        setForm({
          subject_name: "",
          department: ""
        });
        setSelectedFacultyIds([]);
      } else {
        setMessage({ text: data.message || "Failed to add subject", type: "error" });
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
            <FaBook className="header-icon" />
          </div>
          <h2>Create Subject</h2>
          <p>Add a new subject to the university course register and map it to a faculty ID</p>
        </div>

        {message.text && (
          <div className={`form-feedback-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="admin-interactive-form">
          <div className="input-field-group">
            <label>Subject Name</label>
            <div className="input-wrapper">
              <FaBook className="input-field-icon" />
              <input
                name="subject_name"
                placeholder="e.g. Advanced Machine Learning"
                value={form.subject_name}
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
            <label>Assigned Faculty (Select one or more)</label>
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
                {faculties.map((fac) => (
                  <label key={fac.id} style={{
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
                      checked={selectedFacultyIds.includes(fac.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFacultyIds([...selectedFacultyIds, fac.id]);
                        } else {
                          setSelectedFacultyIds(selectedFacultyIds.filter(id => id !== fac.id));
                        }
                      }}
                      style={{ cursor: "pointer", width: "16px", height: "16px", margin: 0 }}
                    />
                    <span>{fac.name} ({fac.department})</span>
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
            {loading ? "Adding..." : <><FaPlus /> Create Subject</>}
          </button>
        </form>
      </div>
    </div>
  );
}
