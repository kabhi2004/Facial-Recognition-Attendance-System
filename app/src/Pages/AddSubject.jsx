import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addSubject, getAdminFaculty } from "../Api/Api";
import "./AddSubject.css";
import { FaBook, FaBuilding, FaUserTie, FaArrowLeft, FaPlus } from "react-icons/fa";

export default function AddSubject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject_name: "",
    department: "",
    faculty_id: ""
  });
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
    if (!form.subject_name || !form.department || !form.faculty_id) {
      setMessage({ text: "Please fill in all the details", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const data = await addSubject({
        ...form,
        faculty_id: Number(form.faculty_id)
      });
      if (data.success) {
        setMessage({ text: "Subject added successfully!", type: "success" });
        setForm({
          subject_name: "",
          department: "",
          faculty_id: ""
        });
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
            <label>Assigned Faculty</label>
            <div className="input-wrapper">
              <FaUserTie className="input-field-icon" />
              <select
                name="faculty_id"
                value={form.faculty_id}
                onChange={handleChange}
                required
                className="afr-select"
              >
                <option value="">-- Select Faculty --</option>
                {faculties.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.department})
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
            {loading ? "Adding..." : <><FaPlus /> Create Subject</>}
          </button>
        </form>
      </div>
    </div>
  );
}
