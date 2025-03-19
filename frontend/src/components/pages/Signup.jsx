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
    organizationName: "",
    inviteLink: "", 
    verificationCode: ""
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // New state variables for organization flow
  const [organizationExists, setOrganizationExists] = useState(null);
  const [checkingOrganization, setCheckingOrganization] = useState(false);
  const [organizationError, setOrganizationError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [organizationSuccess, setOrganizationSuccess] = useState("");

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset organization check and verification when organization name changes
    if (name === "organizationName") {
      setOrganizationExists(null);
      setOrganizationError("");
      setVerificationSent(false); // Add this line to reset verification sent state
      setVerificationError(""); // Also reset any verification errors
    }
  };

  // Check if organization exists
    const checkOrganization = async () => {
      if (!formData.organizationName.trim()) {
        setOrganizationError("Please enter an organization name");
        return;
      }
      
      setCheckingOrganization(true);
      setOrganizationError("");
      setVerificationSent(false);
    try {
      try {
        const response = await axios.get(`http://localhost:8000/api/org/exists/${formData.organizationName}`);
        const exists = response.data.exists;
        console.log(response.data)
        setOrganizationExists(exists);
      } catch (error) {
        console.error("Error checking organization:", error);
        setOrganizationExists(false);
      }
 
      if (!organizationExists) {
        // Check if email is a company email (not gmail, hotmail, etc.)
        const emailDomain = formData.email.split('@')[1];
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];
        
        if (!emailDomain || commonDomains.includes(emailDomain.toLowerCase())) {
          setOrganizationError("Organization creation requires a company email domain (not personal email providers like Gmail)");
          return;
        }
        
        // Check if domain is related to organization name (basic check)
        // Convert both strings to lowercase and remove spaces/dots for comparison
const orgNameNormalized = formData.organizationName.toLowerCase().replace(/\s+/g, '');
const domainNormalized = emailDomain.toLowerCase().replace(/\./g, '');

// Calculate character overlap between the two strings
const calculateOverlapPercentage = (str1, str2) => {
  const shorterString = str1.length <= str2.length ? str1 : str2;
  const longerString = str1.length > str2.length ? str1 : str2;
  
  let matchCount = 0;
  for (const char of shorterString) {
    if (longerString.includes(char)) {
      matchCount++;
    }
  }
  
  return (matchCount / shorterString.length) * 100;
};

// Check if the overlap percentage exceeds a threshold (e.g., 50%)
const overlapPercentage = calculateOverlapPercentage(orgNameNormalized, domainNormalized);
const THRESHOLD = 50; // Adjust this threshold as needed

if (overlapPercentage < THRESHOLD) {
  setOrganizationError("Email domain should reasonably match the organization name");
  return;
}
        
        // Check if user is an executive
        if (formData.careerStage !== "executive") {
          setOrganizationError("Only executives with a company email can create a new organization");
          return;
        }
      }
      
    } catch (error) {
      console.error("Error checking organization:", error);
      setOrganizationError("Failed to verify organization. Please try again.");
    } finally {
      setCheckingOrganization(false);
    }
  };
  
  // Send verification code
const sendVerificationCode = async () => {
  if (!formData.email) {
    setVerificationError("Email is required");
    return;
  }
  
  setVerificationLoading(true);
  setVerificationError("");
  
  try {
    // Make the actual API call
    const response = await axios.post("http://localhost:8000/api/organizations/verify", {
      email: 'nadigersankalp@gmail.com',
      organizationName: formData.organizationName,
    });
    
    // Check if the API call was successful (status code 200)
    if (response.status === 200) {
      setVerificationSent(true);
      // Hide the organization error message when verification code is successfully sent
      setOrganizationError("");
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("Error sending verification code:", error);
    setVerificationError("Failed to send verification code. Please try again.");
  } finally {
    setVerificationLoading(false);
  }
};

// Validate verification code
const validateVerificationCode = async () => {
  if (!formData.verificationCode) {
    setVerificationError("Please enter the verification code");
    return;
  }
  
  setVerificationLoading(true);
  setVerificationError("");
  
  try {
    // Make the API call to validate the code
    const response = await axios.post("http://localhost:8000/api/organizations/validate-code", {
      email: 'nadigersankalp@gmail.com',
      code: formData.verificationCode,
      organizationName: formData.organizationName,
    });
    
    // Check if validation was successful
    if (response.status === 200) {
      // Clear verification states
      setVerificationSent(false);

      // Show success message with green background
      setOrganizationError(""); // Clear any existing error messages
      setVerificationError(""); // Clear any verification errors
      setOrganizationSuccess("Verification successfull! You can now create your account thereby the organization.");
    } else {
      throw new Error("Code validation failed");
    }
  } catch (error) {
    console.error("Error validating code:", error);
    setVerificationError("Invalid verification code. Please try again.");
  } finally {
    setVerificationLoading(false);
  }
};
 
  // Toggle webcam display
  const toggleWebcam = () => {
    setShowWebcam((prev) => !prev);
    setFaceError(""); // Clear any previous errors
  };

  // Capture face and extract descriptors
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
    
    // Additional validation for organization flow
    if (formData.usageType === "organization") {
      if (!formData.organizationName) {
        setOrganizationError("Organization name is required");
        return;
      }
      
      if (organizationExists === null) {
        setOrganizationError("Please verify the organization first");
        return;
      }
      
      if (organizationExists === true && !formData.inviteLink) {
        setOrganizationError("Invite link is required for existing organizations");
        return;
      }
      
      if (organizationExists === false && !organizationSuccess) {
        setOrganizationError("Please complete the organization verification process");
        return;
      }
    }
    
    setLoading(true);
    localStorage.setItem("usageType", formData.usageType);
    
    try {
      // In a real app, you would include the organization info in the API call
      const response = await axios.post("http://localhost:8000/api/users/register", {
        ...formData,
        faceDescriptor,
        // Include organization data if applicable
        ...(formData.usageType === "organization" && {
          organizationData: {
            name: formData.organizationName,
            inviteLink: formData.inviteLink,
            isNew: organizationExists === false
          }
        })
      });

      // Show success message and redirect
      alert("Registration successful!");
      console.log(response.data);
      console.log(response.inviteLinks)
      window.location.href = "/features";
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

  return (
    <AuroraBackground className="absolute min-h-[150vh] w-full flex flex-col items-center justify-start p-4 overflow-auto pointer-events-none" isDarkMode={isDarkMode}>
      <div className="pointer-events-auto w-full justify-center flex">
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
                  name="careerStage"
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
            
            {/* Organization Section - Only show if organization is selected */}
            {formData.usageType === "organization" && (
  <div className="mb-4">
    <h3 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Organization Details</h3>
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          name="organizationName"
          placeholder="Organization Name"
          className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
          }`}
          onChange={handleChange}
          required={formData.usageType === "organization"}
          disabled={checkingOrganization}
        />
        <button
          type="button"
          onClick={checkOrganization}
          disabled={checkingOrganization || !formData.organizationName.trim()}
          className={`px-4 py-2 rounded-md transition-all ${
            isDarkMode 
              ? 'bg-blue-700 text-white hover:bg-blue-600' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {checkingOrganization ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking
            </div>
          ) : "Verify"}
        </button>
      </div>
      
      {/* Organization verification error message */}
      {organizationError && (
        <div className={`text-sm font-medium p-2 rounded-md ${
          isDarkMode ? 'bg-red-900 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {organizationError}
        </div>
      )}
      
      {/* Existing organization - invite link field */}
      {organizationExists === true && (
        <div className="space-y-2">
          <div className={`p-3 rounded-md ${
            isDarkMode ? 'bg-blue-900 border border-blue-800 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            Organization exists! Please enter your invite link to join.
          </div>
          <input
            type="text"
            name="inviteLink"
            placeholder="Organization Invite Link"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
            }`}
            onChange={handleChange}
            required={organizationExists === true}
          />
        </div>
      )}
      
      {organizationExists === false && (
        <div className="space-y-3">
          {organizationSuccess ? (
            // Show success message when verification is complete
            <div className={`p-3 rounded-md ${
              isDarkMode 
                ? 'bg-green-900 border border-green-800 text-green-300' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              <p>{organizationSuccess}</p>
            </div>
          ) : (
            <>
              <div className={`p-3 rounded-md ${
                isDarkMode ? 'bg-amber-900 border border-amber-800 text-amber-300' : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <p>This organization doesn't exist yet. Only executives with a company email can create a new organization.</p>
                <p className="mt-1 font-medium">Email domain must match the organization name.</p>
              </div>
              
              {!verificationSent ? (
                /* Only show the verification button if no errors and user is executive with matching domain */
                (!organizationError && formData.careerStage === "executive") ? (
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={verificationLoading}
                    className={`w-full py-2 px-4 rounded-md transition-all flex items-center justify-center ${
                      isDarkMode
                        ? 'bg-green-700 text-white hover:bg-green-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {verificationLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : "Send Verification Code"}
                  </button>
                ) : (
                  /* If user is not an executive, show a message */
                  formData.careerStage !== "executive" && (
                    <div className={`text-sm font-medium p-2 rounded-md ${
                      isDarkMode ? 'bg-red-900 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      Only executives can create new organizations
                    </div>
                  )
                )
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-md ${
                    isDarkMode ? 'bg-green-900 border border-green-800 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'
                  }`}>
                    Verification code sent to your email. Please enter it below.
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="verificationCode"
                      placeholder="Verification Code"
                      className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                      }`}
                      onChange={handleChange}
                      required={verificationSent}
                    />
                    <button
                      type="button"
                      onClick={validateVerificationCode}
                      disabled={verificationLoading || !formData.verificationCode}
                      className={`px-4 py-2 rounded-md transition-all ${
                        isDarkMode
                          ? 'bg-blue-700 text-white hover:bg-blue-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {verificationLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying
                        </div>
                      ) : "Verify Code"}
                    </button>
                  </div>
                  
                  {/* Add Resend Code option */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={verificationLoading}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {verificationLoading ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                  
                  {verificationError && (
                    <div className={`text-sm font-medium p-2 rounded-md ${
                      isDarkMode ? 'bg-red-900 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      {verificationError}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  </div>
)}
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
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
            
            <div className="text-center text-sm">
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Already have an account?{" "}
              </span>
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Log In
              </a>
            </div>
          </form>
        </div>
      </div>
    </AuroraBackground>
  );
};
export default Signup;