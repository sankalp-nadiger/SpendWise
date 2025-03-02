import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import * as faceapi from "face-api.js";
import { FaUser, FaBuilding, FaFingerprint, FaKey, FaLock } from "react-icons/fa";
import { AuroraBackground } from "../ui/aurorabackground";

const IconButton = ({ icon: Icon, tooltip, onClick, active }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
        className={`p-2 rounded-full transition ${
          active 
            ? "bg-blue-200 hover:bg-blue-300" 
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        <Icon className={`text-xl ${active ? "text-blue-700" : "text-gray-700"}`} />
      </button>
      {showTooltip && (
        <div className="absolute left-12 bg-black text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState(localStorage.getItem("userType") || "individual");
  const [faceAuth, setFaceAuth] = useState(localStorage.getItem("faceAuth") === "true");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Loading face model...");
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  // Liveness detection states
  const [livenessCheck, setLivenessCheck] = useState({
    inProgress: false,
    passed: false,
    challenge: null,
    stage: 0,
    blinksDetected: 0,
    headMovementsDetected: 0,
    lastEyeState: null,
    eyeStateHistory: [],
    lastHeadPosition: null,
    headPositionHistory: [],
    textureScore: 0
  });
  
  const webcamRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const canvasRef = useRef(null);
  
  // Store frame history for movement analysis
  const frameHistory = useRef([]);
  const maxFrameHistory = 30; // Store last 30 frames
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL) // For additional analysis
        ]);
        setStatusMessage("Ready for secure face authentication");
      } catch (error) {
        setStatusMessage("❌ Failed to load face model");
        console.error("Error loading face-api models:", error);
      }
    };

    loadModels();
    
    return () => {
      // Clean up interval on component unmount
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("userType", userType);
    localStorage.setItem("faceAuth", faceAuth);
    
    // Stop face scanning when switching away from face auth
    if (!faceAuth && isScanning) {
      stopFaceScanning();
    }
  }, [userType, faceAuth, isScanning]);

  const validateEmail = (email) => {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const startFaceScanning = () => {
    setEmailError("");

    if (!webcamRef.current || !webcamRef.current.video) {
        setStatusMessage("⚠️ Webcam not available.");
        return;
    }

    if (!email) {
        setEmailError("Please enter your email first");
        setStatusMessage("⚠️ Please enter your email first.");
        return;
    }

    if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        setStatusMessage("⚠️ Please enter a valid email address.");
        return;
    }

    setIsScanning(true);
    setFaceDetected(false);
    setStatusMessage("👀 Looking for face...");

    // Reset liveness check
    setLivenessCheck({
        inProgress: true,
        passed: false,
        blinksDetected: 0,
        headMovementsDetected: 0,
        eyeStateHistory: [],
        headPositionHistory: [],
        textureScore: 0
    });

    // Start face detection loop
    faceDetectionInterval.current = setInterval(async () => {
        try {
            const detection = await detectFace();

            if (!detection) {
                if (!faceDetected) {
                    setStatusMessage("⚠️ No face detected. Adjust your camera. Place yourself against light.");
                }
                return;
            }

            setFaceDetected(true);
            setStatusMessage("👍 Face detected! Verifying...");

            // Process detection for liveness checks
            const livenessResult = await detectFaceAndLiveness(detection);

            if (livenessResult.isLivenessConfirmed) {
                clearInterval(faceDetectionInterval.current); // Stop detection loop
                setLivenessCheck({
                    inProgress: false,
                    passed: true,
                    textureScore: livenessResult.textureScore || 100
                });
                setStatusMessage("✅ Liveness check passed! Logging in...");

                // Auto-login after liveness check passes
                handleFaceLogin(Array.from(detection.descriptor));

            } else if (livenessResult.isSpoofingDetected) {
                setStatusMessage("❌ Possible spoofing detected. Please try again.");
                resetLivenessCheck();
            } else {
                // Update liveness check progress
                setLivenessCheck(prev => ({
                    ...prev,
                    blinksDetected: livenessResult.isBlinkDetected ? prev.blinksDetected + 1 : prev.blinksDetected,
                    textureScore: livenessResult.textureScore || prev.textureScore
                }));

                // Update status message based on progress
                if (livenessResult.textureScore < 50) {
                    setStatusMessage("⚠️ Please face the camera directly with good lighting.");
                } else if (!livenessResult.isBlinkDetected && livenessCheck.blinksDetected < 2) {
                    setStatusMessage("👁️ Please blink normally to confirm liveness.");
                } else {
                    setStatusMessage("👍 Verifying... please remain still.");
                }
            }
        } catch (error) {
            console.error("Error during face detection interval:", error);
            setStatusMessage("⚠️ Face detection error. Please try again.");
        }
    }, 1000);
};

  const resetLivenessCheck = () => {
    setLivenessCheck({
      inProgress: false,
      passed: false,
      challenge: null,
      stage: 0,
      blinksDetected: 0,
      headMovementsDetected: 0,
      lastEyeState: null,
      eyeStateHistory: [],
      lastHeadPosition: null,
      headPositionHistory: [],
      textureScore: 0
    });
  };

  const stopFaceScanning = () => {
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
      faceDetectionInterval.current = null;
    }

    setIsScanning(false);
    setFaceDetected(false);
    setStatusMessage("Face scanning stopped");
    resetLivenessCheck();
  };

  const detectFace = async () => {
    if (loginInProgress) return null;
    
    if (!webcamRef.current || !webcamRef.current.video) {
      setStatusMessage("⚠️ Webcam not available.");
      return null;
    }

    try {
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFaceDetected(false);
        return null;
      }

      // Face detected
      setFaceDetected(true);
      
      // Extract face descriptor for later use
      setFaceDescriptor(Array.from(detection.descriptor));

      return detection;
    } catch (error) {
      console.error("Face detection error:", error);
      setFaceDetected(false);
      setStatusMessage("⚠️ Error during face detection");
      return null;
    }
  };

 const EAR_THRESHOLD = 0.29; // 🔥 Adjusted to detect actual blinks
const MAX_HISTORY = 10;  // Keep track of last 10 eye states

let eyeStateHistory = [];  // Persistent history storage

const detectBlink = (landmarks) => {
    try {
        if (!landmarks || !landmarks.positions || landmarks.positions.length < 48) {
            console.warn("Invalid landmarks detected, skipping blink detection.");
            return { blinkDetected: false, eyeState: null };
        }

        const leftEyePoints = landmarks.positions.slice(36, 42);
        const rightEyePoints = landmarks.positions.slice(42, 48);

        // Compute EAR
        const leftEAR = calculateEyeAspectRatio(leftEyePoints);
        const rightEAR = calculateEyeAspectRatio(rightEyePoints);
        const earAvg = (leftEAR + rightEAR) / 2.0;

        console.log(`👀 Left EAR: ${leftEAR.toFixed(3)}, Right EAR: ${rightEAR.toFixed(3)}, Avg EAR: ${earAvg.toFixed(3)}`);

        // Determine eye state
        const currentEyeState = earAvg < EAR_THRESHOLD ? 'closed' : 'open';

        console.log(`Eye is ${currentEyeState.toUpperCase()}!`);

        // Update history (persist previous values)
        if (eyeStateHistory.length >= MAX_HISTORY) {
            eyeStateHistory.shift(); // Remove oldest entry
        }
        eyeStateHistory.push(currentEyeState);

        console.log("📝 Updated Eye History:", eyeStateHistory);

        // Detect blink pattern: open → closed → open
        let blinkDetected = false;
if (eyeStateHistory.length >= 3) {
    const lastThree = eyeStateHistory.slice(-3); // Last 3 states
    if (lastThree.includes('closed') && lastThree.includes('open')) {
        blinkDetected = true;
        console.log("✨✅ Blink detected!");
    }
}


        return { blinkDetected, eyeState: currentEyeState };
    } catch (error) {
        console.error("❌ Error in blink detection:", error);
        return { blinkDetected: false, eyeState: null };
    }
}; 

// Helper function to calculate Eye Aspect Ratio
const calculateEyeAspectRatio = (eyePoints) => {
    try {
        if (!eyePoints || eyePoints.length !== 6) {
            console.warn("Invalid eye points received for EAR calculation.");
            return 1; // Default to open if invalid
        }

        // Vertical distances
        const verticalDist1 = calculateDistance(eyePoints[1], eyePoints[5]);
        const verticalDist2 = calculateDistance(eyePoints[2], eyePoints[4]);

        // Horizontal distance
        const horizontalDist = calculateDistance(eyePoints[0], eyePoints[3]);

        if (horizontalDist === 0) {
            console.warn("Horizontal distance is zero, avoiding division by zero.");
            return 1;
        }

        const ear = (verticalDist1 + verticalDist2) / (2 * horizontalDist);
        console.log(`EAR Computed: ${ear}`);
        return ear;
    } catch (error) {
        console.error("❌ Error calculating EAR:", error);
        return 1; 
    }
};

// Euclidean distance function
const calculateDistance = (point1, point2) => {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + 
        Math.pow(point2.y - point1.y, 2)
    );
};

  
  const detectSpoofing = async (video, detection) => {
    if (!canvasRef.current) return false;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Match canvas to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the detected face on canvas
      const box = detection.detection.box;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Extract face region
      const faceImageData = ctx.getImageData(box.x, box.y, box.width, box.height);
      const data = faceImageData.data;

      let brightnessSum = 0;
      let sharpnessSum = 0;
      let colorVariance = 0;
      let count = 0;
      let brightnessSquaredSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Red channel
        const g = data[i + 1]; // Green channel
        const b = data[i + 2]; // Blue channel

        // Convert to grayscale
        const brightness = (r + g + b) / 3;
        brightnessSum += brightness;
        brightnessSquaredSum += brightness ** 2;
        // Calculate color variation
        colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);

        // Compute sharpness using Laplacian filter (edge detection)
        if (i > 4 && i < data.length - 4) {
          sharpnessSum += Math.abs(brightness - ((data[i - 4] + data[i + 4]) / 2));
        }

        count++;
      }

      // Compute averages (avoid division by zero)
      if (count === 0) return false;
      
      const avgBrightness = brightnessSum / count;
      const avgSharpness = sharpnessSum / count;
      const avgColorVariance = colorVariance / count;
      const brightnessVariance = (brightnessSquaredSum / count) - (avgBrightness ** 2);

      // Adjusted thresholds for more reliable detection
      const BRIGHTNESS_THRESHOLD = 180;  // Lowered to flag screens that are too bright
const BRIGHTNESS_VARIANCE_THRESHOLD = 40;  // Increased for better detection
const SHARPNESS_THRESHOLD = 25;  // Lowered to catch sharp screens
const COLOR_VARIANCE_THRESHOLD = 80; // Increased to avoid false positives

const isUniformBrightness = brightnessVariance < BRIGHTNESS_VARIANCE_THRESHOLD;
const isScreenGlare = avgBrightness > BRIGHTNESS_THRESHOLD;
const isHighSharpness = avgSharpness > SHARPNESS_THRESHOLD;  // Reversed condition
const isFakeColor = avgColorVariance > COLOR_VARIANCE_THRESHOLD;  // Reversed condition

const isSpoofingDetected = isScreenGlare || isHighSharpness || isFakeColor || isUniformBrightness;

console.log(`🧐 Spoof Check -> Brightness: ${avgBrightness.toFixed(2)}, Variance: ${brightnessVariance.toFixed(2)}, Sharpness: ${avgSharpness.toFixed(2)}, Color Variance: ${avgColorVariance.toFixed(2)}, Spoofing: ${isSpoofingDetected}`);

      console.log(`📏 Thresholds -> Brightness: ${BRIGHTNESS_THRESHOLD}, Sharpness: ${SHARPNESS_THRESHOLD}, Color Variance: ${COLOR_VARIANCE_THRESHOLD}`);
      return isSpoofingDetected;
    } catch (error) {
      console.error("Error in spoof detection:", error);
      return false; // Default to no spoofing on error
    }
  };
  
  // Function to perform texture analysis to detect real skin vs photo
  const checkFaceTexture = async (video, detection) => {
    if (!canvasRef.current) return 0;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Make sure canvas dimensions match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Extract face region
      const box = detection.detection.box;
      const faceImageData = ctx.getImageData(
        box.x, box.y, box.width, box.height
      );
      
      // Calculate standard deviation of pixel values as a texture measure
      const data = faceImageData.data;
      let sum = 0;
      let sumSquared = 0;
      let count = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
        sum += gray;
        sumSquared += gray * gray;
        count++;
      }
      
      if (count === 0) return 0;
      
      const mean = sum / count;
      const variance = (sumSquared / count) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0, variance)); // Avoid negative under sqrt
      
      // Adjusted thresholds for more reliability
      const MIN_EXPECTED_STDDEV = 8;  // Typical for flat images
      const MAX_EXPECTED_STDDEV = 45; // Typical for real faces with natural texture
      
      const normalizedScore = Math.min(100, Math.max(0, 
        ((stdDev - MIN_EXPECTED_STDDEV) / (MAX_EXPECTED_STDDEV - MIN_EXPECTED_STDDEV)) * 100
      ));
      
      //console.log(`Texture Score: ${normalizedScore.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`);
      return normalizedScore;
    } catch (error) {
      console.error("Error in texture analysis:", error);
      return 0;
    }
  };

  // Updated function to perform comprehensive liveness detection
  const detectFaceAndLiveness = async (detection) => {
    if (!detection || !webcamRef.current || !webcamRef.current.video) {
      return { 
        isLivenessConfirmed: false,
        isBlinkDetected: false,
        textureScore: 0,
        isSpoofingDetected: false
      };
    }

    try {
      // 1. Eye blink detection
      const blinkResult = detectBlink(detection.landmarks, livenessCheck);
    
      // Check if a new blink was detected
      const newBlinkDetected = blinkResult.blinkDetected;
      
      // Calculate total blinks detected
      const totalBlinksDetected = newBlinkDetected 
        ? (livenessCheck.blinksDetected || 0) + 1 
        : (livenessCheck.blinksDetected || 0);
      
      // Update state with new eye state history and blink count
      setLivenessCheck(prev => ({
        ...prev,
        eyeStateHistory: blinkResult.eyeHistory,
        lastEyeState: blinkResult.eyeState,
        blinksDetected: totalBlinksDetected
      }));
      
      // Use the updated blink count for further checks
      const isBlinkDetected = newBlinkDetected || totalBlinksDetected >= 2;
      
      
      // 2. Texture analysis
      const textureScore = await checkFaceTexture(webcamRef.current.video, detection);
      
      // 3. Spoofing detection
      const isSpoofingDetected = await detectSpoofing(webcamRef.current.video, detection);
      
      // Combined liveness determination
      // Criteria: At least one blink detected, good texture score, and no spoofing
      const isTextureValid = textureScore > 55;
      const isLivenessConfirmed = (isBlinkDetected || totalBlinksDetected >= 2) && 
                               isTextureValid && 
                               !isSpoofingDetected;
      
      //console.log(`Blink Detected: ${isBlinkDetected}, Texture Score: ${textureScore.toFixed(2)}, Spoofing Detected: ${isSpoofingDetected}, Liveness Confirmed: ${isLivenessConfirmed}`);
      return {
        isBlinkDetected,
        textureScore,
        isSpoofingDetected,
        isTextureValid,
        isLivenessConfirmed
      };
    } catch (error) {
      console.error("Error in liveness detection:", error);
      return { 
        isLivenessConfirmed: false,
        isBlinkDetected: false,
        textureScore: 0,
        isSpoofingDetected: false,
        error: error.message
      };
    }
  };

  const handleFaceLogin = async (descriptor) => {
    if (loginInProgress) return;
    
    setLoginInProgress(true);
    setStatusMessage("🔒 Verifying face...");

    try {
      const loginData = { 
        email, 
        userType,
        faceDescriptor: descriptor,
        livenessScore: livenessCheck.textureScore,
        livenessVerified: true
      };

      const response = await axios.post("http://localhost:8000/api/users/login", loginData, {
        withCredentials: true,
      });

      // Stop scanning on successful login
      stopFaceScanning();
      setStatusMessage("✅ Login successful!");

      // Redirect or update UI based on successful login
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        setStatusMessage("❌ Face not recognized. Please try again.");
        resetLivenessCheck();
      } else {
        setStatusMessage(`❌ Login failed: ${error.response?.data?.message || "Unknown error"}`);
        stopFaceScanning();
      }
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleManualLogin = async () => {
    if (loginInProgress) return;
    
    // Clear previous errors
    setEmailError("");
    
    // Validate email
    if (!email) {
      setEmailError("Email is required");
      setStatusMessage("⚠️ Email is required.");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      setStatusMessage("⚠️ Please enter a valid email address.");
      return;
    }
    
    try {
      setLoginInProgress(true);
      setStatusMessage("🔒 Logging in...");
      
      const loginData = { email, userType };

      if (faceAuth) {
        if (!faceDescriptor || !livenessCheck.passed) {
          setStatusMessage("⚠️ Please complete the face verification first.");
          setLoginInProgress(false);
          return;
        }
        loginData.faceDescriptor = faceDescriptor;
        loginData.livenessScore = livenessCheck.textureScore;
        loginData.livenessVerified = true;
      } else {
        if (!password) {
          setStatusMessage("⚠️ Password is required.");
          setLoginInProgress(false);
          return;
        }
        loginData.password = password;
      }

      const response = await axios.post("http://localhost:8000/api/users/login", loginData, {
        withCredentials: true,
      });

      setStatusMessage("✅ Login successful!");
      
      // Redirect or update UI based on successful login
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setStatusMessage(`❌ Login failed: ${error.response?.data?.message || "Unknown error"}`);
    } finally {
      setLoginInProgress(false);
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
  <AuroraBackground>
 
   <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'} p-8 rounded-lg shadow-lg w-96 relative`}>
      {/* Back to Home Button */}
      <button 
        onClick={() => window.location.href = '/'}
        className={`absolute top-4 left-4 p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition`}
        aria-label="Back to home"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <h2 className="text-2xl font-bold text-center mb-4">Login</h2>

      {/* User Type & Face Auth Icons */}
      <div className="absolute left-[-50px] top-[10px] flex flex-col gap-3">
        {/* User Type Toggle with Tooltip */}
        <IconButton
          icon={userType === "individual" ? FaUser : FaBuilding}
          tooltip={userType === "individual" ? "Individual Account" : "Organization Account"}
          onClick={() => setUserType(userType === "individual" ? "organization" : "individual")}
          active={true}
        />

        {/* Face Authentication Toggle with Tooltip */}
        <IconButton
          icon={faceAuth ? FaFingerprint : FaKey}
          tooltip={faceAuth ? "Face Authentication Enabled" : "Password Authentication"}
          onClick={() => {
            setFaceAuth(!faceAuth);
            if (isScanning) stopFaceScanning();
          }}
          active={faceAuth}
        />
      </div>

      {/* Email Input with Error Display */}
      <div className="mb-4">
        <input
          type="email"
          className={`w-full p-2 border rounded ${emailError ? 'border-red-500' : ''} ${
            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
          }`}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          placeholder="Enter your email"
        />
        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
      </div>

      {/* Password Input (Hidden if Face Auth is Enabled) */}
      {!faceAuth && (
        <input
          type="password"
          className={`w-full p-2 border rounded mb-4 ${
            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
          }`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      )}

      {/* Face Authentication Section */}
      {faceAuth && (
        <div className="flex flex-col items-center">
          <div className="relative w-full">
            <Webcam 
              ref={webcamRef} 
              screenshotFormat="image/jpeg" 
              className="w-full rounded"
              mirrored={true}
            />
            {isScanning && (
              <div className={`absolute inset-0 border-4 ${
                faceDetected ? 'border-green-500' : 'border-red-500'
              } ${livenessCheck.passed ? 'border-green-700' : 'animate-pulse'} rounded`}></div>
            )}
            
            {/* Hidden canvas for texture analysis */}
            <canvas 
              ref={canvasRef} 
              className="hidden" 
            />
          </div>
          
          {!isScanning ? (
            <button 
              onClick={startFaceScanning} 
              className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Start Secure Face Recognition
            </button>
          ) : (
            <button 
              onClick={stopFaceScanning}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Stop Scanning
            </button>
          )}
          
          <p className={`mt-2 text-sm ${
            statusMessage.includes("✅") ? "text-green-600" : 
            statusMessage.includes("❌") ? "text-red-600" : 
            statusMessage.includes("⚠️") ? "text-yellow-600" : 
            statusMessage.includes("👍") ? "text-green-600" :
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            {statusMessage}
          </p>
          
          {isScanning && livenessCheck.inProgress && !livenessCheck.passed && (
            <div className="mt-2 flex items-center text-xs text-gray-600">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                  width: `${Math.min(100, 
                    livenessCheck.blinksDetected * 25 + 
                    livenessCheck.headMovementsDetected * 25 + 
                    (livenessCheck.textureScore > 60 ? 50 : livenessCheck.textureScore * 0.5)
                  )}%` 
                }}></div>
              </div>
              <span className={`ml-2 ${isDarkMode ? "text-gray-300" : ""}`}>Verifying</span>
            </div>
          )}
          
          {livenessCheck.passed && (
            <div className="mt-2 text-green-600 text-xs flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Liveness verified
            </div>
          )}
        </div>
      )}

      {/* Login Button */}
      <button
        onClick={handleManualLogin}
        className={`w-full py-2 rounded mt-4 transition ${
          loginInProgress 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        disabled={loginInProgress}
      >
        {loginInProgress ? "Logging in..." : "Login"}
      </button>
      
      <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-4`}>
        Don't have an account? 
        <a href="/signup" className={`font-medium underline transition-colors duration-200 ml-1 ${
          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
        }`}>
          Sign Up
        </a>
      </p>
    </div>
  </AuroraBackground>
);
};

export default Login;