import smtplib
import random
import time
from email.message import EmailMessage

OTP_STORE = {}

SENDER_EMAIL = "abhishek250304@gmail.com"
APP_PASSWORD = "pxiddchoboxugula"   # Gmail App Password

def generate_and_send_otp(receiver_email: str):
    # 🔥 DUMMY DEMO OTP 🔥
    otp = 123456

    OTP_STORE[receiver_email] = {
        "otp": otp,
        "time": time.time()
    }

    print(f"\n======================================")
    print(f"🔑 DUMMY DEMO OTP FOR {receiver_email}: {otp}")
    print(f"======================================\n")
    print("Demo mode: Email sending disabled. Please use 123456 as OTP.")

def verify_otp(receiver_email: str, user_otp: int):
    if receiver_email not in OTP_STORE:
        return False, "OTP not generated"

    data = OTP_STORE[receiver_email]

    if time.time() - data["time"] > 120:
        return False, "OTP expired"

    if data["otp"] == user_otp:
        return True, "OTP verified"

    return False, "Invalid OTP"
