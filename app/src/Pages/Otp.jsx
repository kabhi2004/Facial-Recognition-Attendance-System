import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { verifyOtp, resendOtp } from "../Api/Api";
import "./Otp.css";

export default function Otp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef([]);

  // Safe redirect if state is missing
  useEffect(() => {
    if (!state || !state.email) {
      navigate("/");
    }
  }, [state, navigate]);

  // Countdown timer hook
  useEffect(() => {
    if (!state || !state.email) return;
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, state]);

  if (!state || !state.email) {
    return null;
  }

  const handleChange = (val, index) => {
    if (isNaN(val)) return;
    
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);
    setErrorMsg("");

    // Auto-focus next box if a character is typed
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "Enter") {
      submitOtp(otp.join(""));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) {
      setErrorMsg("Please paste a valid 6-digit numeric OTP");
      return;
    }
    
    const digits = pastedData.split("");
    setOtp(digits);
    setErrorMsg("");
    
    inputRefs.current[5]?.focus();
    
    // Auto-submit upon pasting valid OTP
    submitOtp(pastedData);
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg("");
    try {
      const data = await resendOtp(state.email);
      if (data.success) {
        setTimeLeft(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setErrorMsg("");
      } else {
        setErrorMsg(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  async function submitOtp(otpValue = null) {
    const code = otpValue || otp.join("");
    if (code.length !== 6 || isNaN(code)) {
      setErrorMsg("Please enter all 6 digits");
      return;
    }

    try {
      const data = await verifyOtp(state.role, state.email, Number(code));

      if (!data.success) {
        setErrorMsg(data.message || "Verification failed");
        return;
      }

      const userData = {
        role: state.role,
        email: state.email,
      };

      if (data.subject_id) {
        userData.subject_id = data.subject_id;
      }
      if (data.faculty_id) {
        userData.faculty_id = data.faculty_id;
        userData.id = data.faculty_id;
      }
      if (data.name) {
        userData.name = data.name;
      }
      if (data.department) {
        userData.department = data.department;
      }

      localStorage.setItem("user", JSON.stringify(userData));

      if (state.role === "Admin") navigate("/admin/dashboard");
      if (state.role === "Faculty") navigate("/faculty/dashboard");
    } catch (err) {
      setErrorMsg("Network error verifying OTP");
    }
  }

  return (
    <div className="otp-page">
      <div className="otp-glow-bg"></div>
      
      <div className="otp-card">
        {/* Animated Security Lock Shield SVG */}
        <div className="security-icon-container">
          <svg className="security-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z" fill="url(#shieldGrad)" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M12 8V12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 16H12.01" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="shieldGrad" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="1" stopColor="#4f46e5" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1>Two-Step Verification</h1>
        <p className="subtitle">
          We sent a 6-digit security code to <br />
          <span className="email-highlight">{state.email}</span>
        </p>

        {errorMsg && <div className="otp-error-banner">{errorMsg}</div>}

        {/* 6 split-input fields */}
        <div className="otp-inputs-row" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="otp-digit-field"
              placeholder="-"
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <button className="otp-verify-btn" onClick={() => submitOtp()}>
          Verify & Continue
        </button>

        {/* Countdown and Resend */}
        <div className="otp-resend-section">
          {timeLeft > 0 ? (
            <p className="timer-text">
              Resend code in <span className="countdown">{timeLeft}s</span>
            </p>
          ) : (
            <button 
              className={`otp-resend-btn ${isResending ? "loading" : ""}`}
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
