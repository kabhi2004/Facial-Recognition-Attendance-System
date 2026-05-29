import re

with open("Api.js", "r", encoding="utf-8") as f:
    content = f.read()

if "getMyLeaves" not in content:
    content += """
export async function getMyLeaves(student_id) {
  const res = await fetch(`${BASE_URL}/student/${student_id}/leaves`);
  return res.json();
}
"""
    with open("Api.js", "w", encoding="utf-8", newline="") as f:
        f.write(content)
    print("Api.js updated")
