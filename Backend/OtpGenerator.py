import os
import random
import time
import requests
from dotenv import load_dotenv

load_dotenv()

# --- IN-MEMORY OTP DATA STORE ---
OTP_STORE = {}

# --- BREVO CONFIGURATION ---
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "abhishekkashyap2501@gmail.com")
SENDER_NAME = "UniCheck Team"

def generate_and_send_otp(receiver_email: str):
    # 1. Generate a random 6-digit OTP
    otp = random.randint(100000, 999999)

    OTP_STORE[receiver_email] = {
        "otp": otp,
        "time": time.time()
    }

    # 2. Check if Brevo is configured; otherwise bypass and log to console
    if not BREVO_API_KEY or "xkeysib-xxxx" in BREVO_API_KEY.lower():
        print(f"WARNING: Brevo API Key not configured. Using local fallback.")
        print_fallback(receiver_email, otp)
        return

    # 3. Compose Payload for Brevo REST API
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": receiver_email}],
        "subject": "UniCheck OTP Verification",
        "textContent": (
            f"Dear User,\n\n"
            f"Your OTP for UniCheck Attendance System login is: {otp}.\n\n"
            f"This OTP is valid for 2 minutes.\n\n"
            f"Regards,\n"
            f"Team UniCheck"
        )
    }

    # 4. Execute HTTP POST request
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201, 202]:
            print(f"DEBUG: OTP email successfully sent to {receiver_email} via Brevo API")
        else:
            print(f"WARNING: Brevo API returned error status {response.status_code}: {response.text}")
            print_fallback(receiver_email, otp)
    except Exception as e:
        print(f"WARNING: Failed to connect to Brevo REST API: {e}")
        print_fallback(receiver_email, otp)

def print_fallback(receiver_email: str, otp: int):
    print(f"\n======================================")
    print(f"[OTP] FALLBACK OTP FOR {receiver_email}: {otp}")
    print(f"======================================\n")

def verify_otp(receiver_email: str, user_otp: int):
    # ================= TEMPORARY OTP BYPASS =================
    # Bypasses OTP verification for convenience during development/testing.
    # Any 6-digit OTP entered (e.g. 123456) will be accepted instantly.
    # TO RE-ENABLE OTP FOR PRODUCTION: Simply uncomment the code below and delete/comment this return statement.
    return True, "OTP verified"

    # if receiver_email not in OTP_STORE:
    #     return False, "OTP not generated"
    # 
    # data = OTP_STORE[receiver_email]
    # 
    # if time.time() - data["time"] > 120:
    #     return False, "OTP expired"
    # 
    # if data["otp"] == user_otp:
    #     return True, "OTP verified"
    # 
    # return False, "Invalid OTP"
