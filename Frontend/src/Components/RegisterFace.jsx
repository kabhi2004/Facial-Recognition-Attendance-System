// import { useRef, useState } from "react";
// import axios from "axios";

// function RegisterFace() {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const [stream, setStream] = useState(null);
//   const [name, setName] = useState("");
//   const [message, setMessage] = useState("");

//   // Start camera
//   const startCamera = async () => {
//     const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
//     videoRef.current.srcObject = mediaStream;
//     setStream(mediaStream);
//   };

//   // Stop camera
//   const stopCamera = () => {
//     stream?.getTracks().forEach(track => track.stop());
//     setStream(null);
//   };

//   // Capture image & send to backend
//   const registerFace = async () => {
//     if (!name) {
//       setMessage("❌ Please enter name");
//       return;
//     }

//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     canvas.getContext("2d").drawImage(video, 0, 0);

//     canvas.toBlob(async (blob) => {
//       const formData = new FormData();
//       formData.append("name", name);
//       formData.append("file", blob, "face.jpg");

//       try {
//         const res = await axios.post(
//           "https://facial-recognition-attendance-system-production.up.railway.app/register-face",
//           formData
//         );

//         if (res.data.status === "success") {
//           setMessage(`✅ Face registered for ${name}`);
//         } else {
//           setMessage("❌ No face detected");
//         }
//       } catch (err) {
//         setMessage("❌ Error registering face");
//       }
//     }, "image/jpeg");
//   };

//   return (
//     <div className="bg-white p-6 rounded-xl shadow-md text-center">
//       <h2 className="text-xl font-semibold mb-4">Register Face</h2>

//       <input
//         type="text"
//         placeholder="Enter Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         className="border p-2 rounded w-full mb-3"
//       />

//       <video
//         ref={videoRef}
//         autoPlay
//         className="mx-auto rounded-lg border w-full max-w-sm"
//       />
//       <canvas ref={canvasRef} hidden />

//       <div className="flex justify-center gap-3 mt-4">
//         <button
//           onClick={startCamera}
//           className="px-4 py-2 bg-green-500 text-white rounded"
//         >
//           Start Camera
//         </button>

//         <button
//           onClick={registerFace}
//           className="px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Register Face
//         </button>

//         <button
//           onClick={stopCamera}
//           className="px-4 py-2 bg-red-500 text-white rounded"
//         >
//           Stop
//         </button>
//       </div>

//       {message && (
//         <p className="mt-4 font-semibold">{message}</p>
//       )}
//     </div>
//   );
// }

// export default RegisterFace;
import { useRef, useState } from "react";
import axios from "axios";

function RegisterFace() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");

  // 🎥 Start camera
  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = mediaStream;
    setStream(mediaStream);
  };

  // ⛔ Stop camera
  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  // 📸 Capture & send to backend
  const registerFace = async () => {
    if (!studentId) {
      setMessage("❌ Please enter Student ID");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("student_id", studentId);
      formData.append("file", blob, "face.jpg");

      try {
        const res = await axios.post(
          "https://facial-recognition-attendance-system-production.up.railway.app/register-face",
          formData
        );

        if (res.data.status === "success") {
          setMessage(`✅ Face registered for Student ID ${studentId}`);
        } else {
          setMessage("❌ No face detected");
        }
      } catch (err) {
        setMessage("❌ Error registering face (check student ID)");
      }
    }, "image/jpeg");
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Register Face</h2>

      <input
        type="number"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="border p-2 rounded w-full mb-3"
      />

      <video
        ref={videoRef}
        autoPlay
        className="mx-auto rounded-lg border w-full max-w-sm"
      />
      <canvas ref={canvasRef} hidden />

      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Start Camera
        </button>

        <button
          onClick={registerFace}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Register Face
        </button>

        <button
          onClick={stopCamera}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Stop
        </button>
      </div>

      {message && (
        <p className="mt-4 font-semibold">{message}</p>
      )}
    </div>
  );
}

export default RegisterFace;
