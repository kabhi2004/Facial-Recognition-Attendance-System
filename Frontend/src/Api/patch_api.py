import re

with open("Api.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add getStudentSubjects
content = content.replace(
'''export async function applyLeave(data) {''',
'''export async function getStudentSubjects(student_id) {
  const res = await fetch(`${BASE_URL}/student/${student_id}/subjects`);
  return res.json();
}

export async function applyLeave(data) {'''
)

# Update getPendingLeaves to take faculty_id
content = content.replace(
'''export async function getPendingLeaves() {
  const res = await fetch(`${BASE_URL}/faculty/pending-leaves`);''',
'''export async function getPendingLeaves(faculty_id) {
  const res = await fetch(`${BASE_URL}/faculty/${faculty_id}/pending-leaves`);'''
)

with open("Api.js", "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("Api.js patched")
