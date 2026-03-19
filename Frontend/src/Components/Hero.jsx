import AttendanceTable from "./AttandanceTable";
import CameraView from "./CameraView";
import styles from "./Hero.module.css"


export default function HeroSection(){
  return(
    <>
     <h1 className={styles.h1}>
        Face Recognition Attendance System
      </h1>
      <div className={styles.container}>
        <div>
            <img src="Img1.jpg" alt="Image" srcset="" />
        </div>
        <div>
         <CameraView/>
         <AttendanceTable/>
        </div>
    
    </div>
    </>
  )
}