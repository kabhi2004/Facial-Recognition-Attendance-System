import { useEffect, useState } from "react";
import { getAttendance } from "../Api/Api";

function AttendanceTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    const res = await getAttendance();
    setData(res.data.attendance || []);
  };

  return (
    <div className="card">
      <h2>Attendance Records</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row[0]}</td>
              <td>{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;
