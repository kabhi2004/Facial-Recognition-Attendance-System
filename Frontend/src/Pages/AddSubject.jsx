// import { useState } from "react";

// const BASE_URL = "http://localhost:8000";

// export default function AddSubject() {
//   const [form, setForm] = useState({
//     subject_name: "",
//     department: "",
//     faculty_id: ""
//   });

//   function handleChange(e) {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   }

//   async function submit() {
//     const res = await fetch(`${BASE_URL}/admin/add-subject`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form)
//     });

//     const data = await res.json();
//     alert(data.message);
//   }

//   return (
//     <div className="form-page">
//       <h2>Add Subject</h2>

//       <input name="subject_name" placeholder="Subject Name" onChange={handleChange} />
//       <input name="department" placeholder="Department" onChange={handleChange} />
//       <input name="faculty_id" placeholder="Faculty ID" onChange={handleChange} />

//       <button onClick={submit}>Save Subject</button>
//     </div>
//   );
// }
import { useState } from "react";
import "./AddSubject.css";

const BASE_URL = "http://localhost:8000";

export default function AddSubject() {
  const [form, setForm] = useState({
    subject_name: "",
    department: "",
    faculty_id: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    const res = await fetch(`${BASE_URL}/admin/add-subject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);
  }

  return (
    <div className="subject-page">
      <div className="subject-card">
        <h2>Add Subject</h2>

        <input
          name="subject_name"
          placeholder="Subject Name"
          onChange={handleChange}
        />

        <input
          name="department"
          placeholder="Department"
          onChange={handleChange}
        />

        <input
          name="faculty_id"
          placeholder="Faculty ID"
          onChange={handleChange}
        />

        <button onClick={submit}>Save Subject</button>
      </div>
    </div>
  );
}
