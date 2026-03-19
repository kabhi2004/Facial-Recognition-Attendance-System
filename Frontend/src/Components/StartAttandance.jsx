// import React, {useState} from 'react'
// import { startAttendance } from '../Api/Api'


// export default function StartAttendance(){
// const [loading, setLoading] = useState(false)
// const [recognized, setRecognized] = useState([])


// const handleStart = async ()=>{
// setLoading(true)
// try{
// const res = await startAttendance()
// setRecognized(res.data.recognized || [])
// }catch(err){
// alert('Error starting attendance')
// }
// setLoading(false)
// }


// return (
// <div style={{textAlign:'center'}}>
// <h3>Start Attendance</h3>
// <button onClick={handleStart}>{loading? 'Processing...': 'Start'}</button>
// {recognized.length>0 && (
// <div>
// <h4>Recognized</h4>
// <ul>{recognized.map((r, i)=> <li key={i}>{r[0]} — {r[1]}</li>)}</ul>
// </div>
// )}
// </div>
// )
// }
// import React, { useState } from "react";
// import { startAttendance } from "../Api/Api";

// export default function StartAttendance() {
//   const [loading, setLoading] = useState(false);
//   const [recognized, setRecognized] = useState([]);

//   const handleStart = async () => {
//     setLoading(true);
//     try {
//       const res = await startAttendance();

//       // ✅ AXIOS RESPONSE
//       setRecognized(res.data.recognized || []);
//     } catch (err) {
//       console.error(err);
//       alert("Error starting attendance");
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ textAlign: "center" }}>
//       <h3>Start Attendance</h3>

//       <button onClick={handleStart} disabled={loading}>
//         {loading ? "Processing..." : "Start"}
//       </button>

//       {recognized.length > 0 && (
//         <div>
//           <h4>Recognized</h4>
//           <ul>
//             {recognized.map((r, i) => (
//             <li key={i}>
//                <strong>{r.name}</strong> — {r.timestamp}
//             </li>
//              ))}

//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
