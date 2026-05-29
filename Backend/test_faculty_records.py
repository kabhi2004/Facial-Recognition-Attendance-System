import requests

print("Testing faculty records API...")

try:
    r = requests.get("http://localhost:8000/faculty/records")
    print("/faculty/records:", r.status_code, r.text[:200])
except Exception as e:
    print(e)
