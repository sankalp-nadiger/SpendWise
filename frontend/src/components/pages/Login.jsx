import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import * as faceapi from "face-api.js"; // Import face-api.js

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("individual");
  const [faceAuth, setFaceAuth] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  const captureFace = async () => {
    const video = webcamRef.current.video;
    if (!video) return;

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("No face detected, try again.");
      return;
    }

    setFaceDescriptor(Array.from(detection.descriptor)); // Convert Float32Array to normal array
  };

  const handleLogin = async () => {
    try {
      const loginData = { email, userType };

      if (faceAuth) {
        if (!faceDescriptor) {
          alert("Please capture your face first.");
          return;
        }
        loginData.faceDescriptor = faceDescriptor;
      } else {
        if (!password) {
          alert("Password is required for non-face login.");
          return;
        }
        loginData.password = password;
      }

      const response = await axios.post("http://localhost:8000/api/users/login", loginData, {
        withCredentials: true,
      });

      alert("Login Successful!");
      console.log(response.data);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>

        <label className="block mb-2 font-semibold">User Type</label>
        <select
          className="w-full p-2 border rounded mb-4"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="individual">Individual</option>
          <option value="organization">Organization</option>
        </select>

        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />

        {!faceAuth && (
          <>
            <label className="block mb-2 font-semibold">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </>
        )}

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="faceAuth"
            checked={faceAuth}
            onChange={() => setFaceAuth(!faceAuth)}
          />
          <label htmlFor="faceAuth" className="text-sm">Use Face Authentication</label>
        </div>

        {faceAuth && (
          <div className="flex flex-col items-center">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} />
            <button
              onClick={captureFace}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            >
              Capture Face
            </button>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-4"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
