import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { verifyOtp } from "../Api/Api";
import "./Otp.css";

export default function Otp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  async function submitOtp() {
    const data = await verifyOtp(state.role, state.email, otp);

    if (!data.success) {
      alert(data.message);
      return;
    }

    const userData = {
      role: state.role,
      email: state.email,
    };

    if (data.subject_id) {
      userData.subject_id = data.subject_id;
    }

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    if (state.role === "Admin") navigate("/admin/dashboard");
    if (state.role === "Faculty") navigate("/faculty/dashboard");
  }

  return (
    <div className="otp-page">
      <div className="otp-card">
        <h1>Verify OTP</h1>
        <p>
          We have sent a verification code to <br />
          <span>{state.email}</span>
        </p>

        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button onClick={submitOtp}>Verify & Continue</button>
      </div>
    </div>
  );
}

