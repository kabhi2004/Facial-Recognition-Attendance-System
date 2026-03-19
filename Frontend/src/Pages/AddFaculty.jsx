// import { useState } from "react";

// const BASE_URL = "http://localhost:8000";

// export default function AddFaculty() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     department: "",
//     subject_id: ""
//   });

//   function handleChange(e) {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   }

//   async function submit() {
//     const res = await fetch(`${BASE_URL}/admin/add-faculty`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form)
//     });

//     const data = await res.json();
//     alert(data.message);
//   }

//   return (
//     <div className="form-page">
//       <h2>Add Faculty</h2>

//       <input name="name" placeholder="Name" onChange={handleChange} />
//       <input name="email" placeholder="Email" onChange={handleChange} />
//       <input name="password" placeholder="Password" type="password" onChange={handleChange} />
//       <input name="department" placeholder="Department" onChange={handleChange} />
//       <input name="subject_id" placeholder="Subject ID" onChange={handleChange} />

//       <button onClick={submit}>Save Faculty</button>
//     </div>
//   );
// }
import { useState } from "react";
import "../Style/AddFaculty.css";

const BASE_URL = "http://localhost:8000";

export default function AddFaculty() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    subject_id: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    const res = await fetch(`${BASE_URL}/admin/add-faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Add Faculty</h2>

        <input name="name" placeholder="Full Name" onChange={handleChange} />
        <input name="email" placeholder="Email Address" onChange={handleChange} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <input
          name="department"
          placeholder="Department"
          onChange={handleChange}
        />
        <input
          name="subject_id"
          placeholder="Subject ID"
          onChange={handleChange}
        />

        <button onClick={submit}>Save Faculty</button>
      </div>
    </div>
  );
}
