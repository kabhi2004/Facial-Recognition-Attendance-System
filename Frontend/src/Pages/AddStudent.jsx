// import { useState } from "react";

// const BASE_URL = "https://facial-recognition-attendance-system-production.up.railway.app";

// export default function AddStudent() {
//   const [form, setForm] = useState({
//     roll_no: "",
//     name: "",
//     email: "",
//     password: "",
//     department: ""
//   });

//   function handleChange(e) {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   }

//   async function submit() {
//     const res = await fetch(`${BASE_URL}/admin/add-student`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form)
//     });

//     const data = await res.json();
//     alert(data.message);
//   }

//   return (
//     <div className="form-page">
//       <h2>Add Student</h2>

//       <input name="roll_no" placeholder="Roll No" onChange={handleChange} />
//       <input name="name" placeholder="Name" onChange={handleChange} />
//       <input name="email" placeholder="Email" onChange={handleChange} />
//       <input name="password" placeholder="Password" type="password" onChange={handleChange} />
//       <input name="department" placeholder="Department" onChange={handleChange} />

//       <button onClick={submit}>Save Student</button>
//     </div>
//   );
// }
import { useState } from "react";
import "./AddStudent.css";

const BASE_URL = "https://facial-recognition-attendance-system-production.up.railway.app";

export default function AddStudent() {
  const [form, setForm] = useState({
    roll_no: "",
    name: "",
    email: "",
    password: "",
    department: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    const res = await fetch(`${BASE_URL}/admin/add-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);
  }

  return (
    <div className="student-page">
      <div className="student-card">
        <h2>Add Student</h2>

        <input
          name="roll_no"
          placeholder="Roll Number"
          onChange={handleChange}
        />

        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email Address"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <input
          name="department"
          placeholder="Department"
          onChange={handleChange}
        />

        <button onClick={submit}>Save Student</button>
      </div>
    </div>
  );
}
