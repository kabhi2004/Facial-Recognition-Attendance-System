import requests

print("Testing student dashboard attendance APIs...")

try:
    r = requests.get("http://localhost:8000/student/1/attendance")
    print("/attendance:", r.status_code, r.text[:100])
except Exception as e:
    print(e)

try:
    r = requests.get("http://localhost:8000/student/1/attendance-summary")
    print("/attendance-summary:", r.status_code, r.text[:100])
except Exception as e:
    print(e)

try:
    r = requests.get("http://localhost:8000/student/1/subjects")
    print("/subjects:", r.status_code, r.text[:100])
except Exception as e:
    print(e)

try:
    r = requests.get("http://localhost:8000/faculty/1/pending-leaves")
    print("/pending-leaves:", r.status_code, r.text[:100])
except Exception as e:
    print(e)
