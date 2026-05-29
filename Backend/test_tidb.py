import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

try:
    conn = mysql.connector.connect(
        host=os.getenv("MYSQLHOST", "localhost"),
        user=os.getenv("MYSQLUSER", "root"),
        password=os.getenv("MYSQLPASSWORD", ""),
        database=os.getenv("MYSQLDATABASE", "attendance_db"),
        port=int(os.getenv("MYSQLPORT", "3306")),
        use_pure=True
    )
    print("SUCCESSFULLY CONNECTED TO TIDB CLOUD!")
    conn.close()
except Exception as e:
    print("FAILED TO CONNECT:")
    print(e)
