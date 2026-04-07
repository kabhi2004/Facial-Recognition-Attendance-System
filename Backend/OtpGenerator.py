import smtplib
import random
import time
from email.message import EmailMessage

OTP_STORE = {}

SENDER_EMAIL = "abhishek250304@gmail.com"
APP_PASSWORD = "pxiddchoboxugula"   # Gmail App Password

def generate_and_send_otp(receiver_email: str):
    otp = random.randint(100000, 999999)

    OTP_STORE[receiver_email] = {
        "otp": otp,
        "time": time.time()
    }

    msg = EmailMessage()
    msg.set_content(f"Your OTP is {otp}. Valid for 2 minutes.")
    msg["Subject"] = "2-Step Authentication OTP"
    msg["From"] = SENDER_EMAIL
    msg["To"] = receiver_email

    print(f"\n======================================")
    print(f"🔑 OTP FOR {receiver_email}: {otp}")
    print(f"======================================\n")

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")
        print("Continuing with login process, use the OTP printed above.")

def verify_otp(receiver_email: str, user_otp: int):
    if receiver_email not in OTP_STORE:
        return False, "OTP not generated"

    data = OTP_STORE[receiver_email]

    if time.time() - data["time"] > 120:
        return False, "OTP expired"

    if data["otp"] == user_otp:
        return True, "OTP verified"

    return False, "Invalid OTP"
