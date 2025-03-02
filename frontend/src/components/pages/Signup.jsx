import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { AuroraBackground } from "../ui/aurorabackground";

const Signup = () => {
  const webcamRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    gender: "",
    mobile: "",
    profession: "",
    careerStage: "",
    usageType: "", // Personal or Organization
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    if (showWebcam && !modelsLoaded) {
      const loadModels = async () => {
        try {
          console.log("Checking access to models...");
  
          const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          
          console.log("Face-api models loaded successfully!");
          setModelsLoaded(true);
        } catch (error) {
          console.error("Error loading face-api models:", error);
          setFaceError("Failed to load face detection models. Please try again later.");
        }
      };
  
      loadModels();
    }
  }, [showWebcam, modelsLoaded]);
  
  
  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle webcam display
  const toggleWebcam = () => {
    setShowWebcam((prev) => !prev);
    setFaceError(""); // Clear any previous errors
  };

  // Capture face and extract descriptors
  // Replace your current captureFace function with this improved version
const captureFace = async () => {
  if (!webcamRef.current) return;

  setFaceCapturing(true);
  setFaceError("");

  try {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setFaceError("Could not capture image. Please try again.");
      setFaceCapturing(false);
      return;
    }

    // Create an HTML image element from the screenshot
    const img = document.createElement('img');
    img.src = imageSrc;
    
    // Wait for the image to load before processing
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Ensure models are loaded
    if (!modelsLoaded) {
      setFaceError("Face detection models are still loading. Please wait a moment.");
      setFaceCapturing(false);
      return;
    }

    // Detect face with landmarks and descriptor
    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setFaceError("No face detected. Please ensure your face is clearly visible and against light and try again.");
      setFaceCapturing(false);
      return;
    }

    // Success - save descriptor and update state
    setFaceDescriptor(Array.from(detections.descriptor)); // Convert Float32Array to normal array
    setFaceCaptured(true);
    
    // Close webcam after a short delay to show success state
    setTimeout(() => {
      setShowWebcam(false);
    }, 1500);
  } catch (error) {
    console.error("Face capture error:", error);
    setFaceError(`Error processing face capture: ${error.message}`);
  } finally {
    setFaceCapturing(false);
  }
};

  // Handle registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem("usageType", formData.usageType);
    try {
      const response = await axios.post("http://localhost:8000/api/users/register", {
        ...formData,
        faceDescriptor, // Send face descriptor (if captured)
      });

      // Show success message and redirect
      alert("Registration successful!");
      console.log(response.data);
      // Redirect to login page or dashboard
      // window.location.href = "/login";
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
 
  // Add this at the component level to retrieve dark mode setting

  return (
    <AuroraBackground className="absolute min-h-[150vh] w-full flex flex-col items-center justify-start p-4 overflow-auto pointer-events-none">
    <div className="pointer-events-auto w-full justify-center flex">
    {/* <div className={`flex flex-col items-center justify-start min-h-screen py-8 ${isDarkMode ? 'bg-black' : 'bg-gray-100'}`}> */}
      <div className={`${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-xl shadow-lg w-full max-w-md border mb-8`}>
                   <h2 className={`text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'} clear-both`}>Create Your Account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Personal Information Section */}
          <div className="mb-4">
            <h3 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Personal Information</h3>
            <div className="space-y-3">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                }`}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                }`}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                  onChange={handleChange}
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                  }`}
                  onChange={handleChange}
                  required
                />
                <select
                  name="gender"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                  }`}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
  
          {/* Professional Information Section */}
          <div className="mb-4">
            <h3 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Professional Information</h3>
            <div className="space-y-3">
              <select
                name="profession"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                }`}
                onChange={handleChange}
                required
              >
                <option value="">Select Career Stage</option>
                <option value="student">Student</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid-Career (3-10 years)</option>
                <option value="senior">Senior Level (10+ years)</option>
                <option value="executive">Executive</option>
                <option value="retired">Retired</option>
              </select>
              <div className="mt-2">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  What will you use this account for?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="usageType"
                      value="personal"
                      onChange={handleChange}
                      className="mr-2"
                      required
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>Personal Use</span>
                  </label>
                  <label className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="usageType"
                      value="organization"
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>Organization</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
  
          {/* Face Authentication Section */}
          <div className="mb-4">
            <h3 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Face Authentication {faceCaptured ? "(Enabled)" : "(Optional- Can be set up later)"}
            </h3>
            <div className={`flex flex-col items-center border rounded-md p-4 ${
              isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              {!showWebcam ? (
                <button
                  type="button"
                  onClick={toggleWebcam}
                  className={`flex items-center justify-center w-full py-2 px-4 rounded-md transition-all shadow-sm ${
                    faceCaptured 
                      ? isDarkMode
                        ? "bg-green-900 border border-green-700 text-green-300 hover:bg-green-800"
                        : "bg-green-50 border border-green-300 text-green-700 hover:bg-green-100"
                      : isDarkMode
                        ? "bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">
                    {faceCaptured ? "Change Face ID" : "Enable Face Authentication"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </button>
              ) : (
                <div className="w-full flex flex-col items-center space-y-3">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    width={280}
                    height={210}
                    videoConstraints={{
                      facingMode: "user",
                    }}
                    className="rounded-md border border-gray-400 shadow-sm"
                  />
                  
                  {faceError && (
                    <div className={`text-sm text-red-600 font-medium p-2 rounded w-full text-center ${
                      isDarkMode ? 'bg-red-900' : 'bg-red-50'
                    }`}>
                      {faceError}
                    </div>
                  )}
                  
                  {!modelsLoaded && (
                    <div className={`text-sm font-medium p-2 rounded w-full text-center flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading face detection models...
                    </div>
                  )}
                  
                  {faceCaptured && faceCapturing === false && (
                    <div className={`text-sm font-medium p-2 rounded w-full text-center ${
                      isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-600'
                    }`}>
                      ✓ Face captured successfully!
                    </div>
                  )}
                  
                  <div className="flex space-x-2 w-full">
                    <button
                      type="button"
                      onClick={captureFace}
                      disabled={faceCapturing || !modelsLoaded}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {faceCapturing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Capture Face"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleWebcam}
                      className={`py-2 px-4 rounded-md transition-all ${
                        isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {faceCaptured && !showWebcam && (
                <div className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ✓ Face authentication set up successfully
                </div>
              )}
            </div>
          </div>
  
          <button
            type="submit"
            className="w-full py-3 px-4 mt-4 mb-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
  
          <p className={`text-center mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Already have an account?
            <a
              href="/login"
              className={`font-medium ml-1 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Sign In
            </a>
          </p>
        </form>
      </div>
    </div>
     </AuroraBackground>
  );
};

export default Signup;