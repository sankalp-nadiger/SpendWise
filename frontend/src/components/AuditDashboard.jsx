import React, { useState, useEffect } from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import AuditForm from './AuditForm';
import AuditResults from './AuditResults';
import AuditQueryBot from './AuditQueryBot';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuditDashboard = () => {
  const [userType, setUserType] = useState(localStorage.getItem('userType') || 'individual'); // Default fallback
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuditForm, setShowAuditForm] = useState(true);
  const [auditParameters, setAuditParameters] = useState({});
  const [auditPurpose, setAuditPurpose] = useState('');
  const [debugInfo, setDebugInfo] = useState(null); // For debugging purposes
  const navigate = useNavigate();

  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Configure axios with debugging interceptors
  useEffect(() => {
    // Request interceptor
    axios.interceptors.request.use(
      config => {
        console.log('Request being sent:', config);
        return config;
      },
      error => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      response => {
        console.log('Response received:', response);
        return response;
      },
      error => {
        console.error('Response error:', error);
        // Capture detailed error information
        let errorMessage = 'An error occurred';
        let errorDetails = null;
        
        if (error.response) {
          // Server responded with a status code outside of 2xx range
          errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`;
          errorDetails = error.response.data;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'No response received from server. Check your network connection and server status.';
        } else {
          // Something else happened while setting up the request
          errorMessage = error.message;
        }
        
        setDebugInfo({ errorMessage, errorDetails });
        return Promise.reject(error);
      }
    );
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleBackToMain = () => {
    navigate('/main');
  };

  const handleAuditSubmit = async (parameters, purpose) => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setAuditParameters(parameters);
    setAuditPurpose(purpose);
    
    console.log('Submitting audit with parameters:', parameters);
    console.log('Purpose:', purpose);
    
    try {
      // Test server connection first
            
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/audit/generate`, 
        { parameters, purpose, userType },
        { 
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Audit response:', response.data);
      setAuditData(response.data);
      setShowAuditForm(false);
    } catch (err) {
      console.error('Audit generation error:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate audit. Please check the console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAudit = () => {
    setAuditData(null);
    setShowAuditForm(true);
    setDebugInfo(null);
    setError(null);
  };

  return (
    <div className={`container mx-auto p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={handleBackToMain}
            className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Financial Audit System</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <div className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'}`}>
            <p>Mode: <span className="font-semibold">{userType === 'individual' ? 'Personal' : 'Organization'}</span></p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={`border px-4 py-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-100' : 'bg-red-100 border-red-400 text-red-700'}`}>
          {error}
        </div>
      )}
      
      {loading && (
        <div className={`border px-4 py-3 rounded mb-4 ${theme === 'dark' ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-100 border-blue-400 text-blue-700'}`}>
          Processing audit request... Please wait.
        </div>
      )}
      
      {showAuditForm ? (
        <AuditForm onSubmit={handleAuditSubmit} userType={userType} theme={theme} />
      ) : (
        <>
          <AuditResults 
            data={auditData} 
            parameters={auditParameters}
            purpose={auditPurpose}
            userType={userType}
            theme={theme}
          />
          <AuditQueryBot 
            auditData={auditData} 
            onUpdateAudit={setAuditData} 
            parameters={auditParameters}
            userType={userType}
            theme={theme}
          />
          <button 
            onClick={resetAudit}
            className={`mt-6 font-bold py-2 px-4 rounded ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            Start New Audit
          </button>
        </>
      )}
    </div>
  );
};

export default AuditDashboard;