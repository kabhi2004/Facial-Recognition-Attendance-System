import { useRef, useState } from "react";
import { recognizeFace } from "../Api/Api";

function CameraView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [result, setResult] = useState("No face detected");

  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = mediaStream;
    setStream(mediaStream);
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const captureAndRecognize = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const res = await recognizeFace(formData);
      const recognized = res.data.recognized || [];

      if (recognized.length === 0) {
        setResult("Unknown Face");
        return;
      }

      const output = recognized
        .map((r) => {
          const confidence =
            r.confidence !== undefined
              ? `${(r.confidence).toFixed(2)}%`
              : "N/A";

          if (r.timestamp) {
            return `${r.name} — ${r.timestamp} (Confidence: ${confidence})`;
          }

          return `${r.name} (Confidence: ${confidence})`;
        })
        .join(", ");

      setResult(output);
    } catch (error) {
      console.error(error);
      setResult("Recognition failed");
    }
  }, "image/jpeg");
};


  return (
    <div className="card">
      <h2>Live Camera</h2>

      <video ref={videoRef} autoPlay className="camera" />
      <canvas ref={canvasRef} hidden />

      <div className="btn-group">
        <button onClick={startCamera}>Start</button>
        <button onClick={captureAndRecognize}>Recognize</button>
        <button onClick={stopCamera}>Stop</button>
      </div>

      <p className="result">Result: {result}</p>
    </div>
  );
}

export default CameraView;
