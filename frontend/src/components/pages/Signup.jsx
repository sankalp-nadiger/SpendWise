import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const Signup = () => {
  const webcamRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    gender: "",
    mobile: "",
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Capture face and extract descriptors
  const captureFace = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    const img = await faceapi.fetchImage(imageSrc);

    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      alert("No face detected. Try again.");
      return;
    }

    setFaceDescriptor(Array.from(detections.descriptor)); // Convert Float32Array to normal array
    alert("Face captured successfully!");
  };

  // Handle registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/users/register", {
        ...formData,
        faceDescriptor, // Send face descriptor (if captured)
      });

      alert("Registration successful!");
      console.log(response.data);
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Signup</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" name="fullName" placeholder="Full Name" className="input" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" className="input" onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" className="input" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" className="input" onChange={handleChange} required />
          <input type="text" name="mobile" placeholder="Mobile Number" className="input" onChange={handleChange} required />
          <select name="gender" className="input" onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {/* Webcam for Face Authentication */}
          <div className="flex flex-col items-center">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={200} height={150} />
            <button type="button" className="btn mt-2" onClick={captureFace}>
              Set up Face Authentication(Can be done later)
            </button>
          </div>

          <button type="submit" className="btn bg-blue-500 text-white" disabled={loading}>
            {loading ? "Registering..." : "Signup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
