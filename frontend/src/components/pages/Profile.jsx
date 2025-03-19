import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, BuildingOfficeIcon, UserIcon, ClipboardIcon, EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import axios from "axios";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteLinks, setInviteLinks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentInviteLink, setCurrentInviteLink] = useState("");
  const [emails, setEmails] = useState("");
  const [copySuccess, setCopySuccess] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark"; 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userResponse = await axios.get("http://localhost:8000/api/users/profile", {
          withCredentials: true,
        });
        setUser(userResponse.data.user);
        console.log("User profile response:", userResponse.data);
        
        // Fetch invite links only for organization admins
        if (
          userResponse.data.user.usageType === "organization" && 
          userResponse.data.user.organization && 
          userResponse.data.user.organization.role === "admin"
        ) {
          try {
            // Convert object to array of [role, link] pairs
            const linksResponse = await axios.get("http://localhost:8000/api/org/invite-links", {
              withCredentials: true,
            });
  
            console.log("Invite links response:", linksResponse.data);
  
            // Transform the object to an array format with role information
            const linksObj = linksResponse.data.inviteLinks || {};
            const formattedLinks = Object.entries(linksObj).map(([role, link]) => ({
              role,
              link
            }));
            setInviteLinks(formattedLinks);
          } catch (linkError) {
            console.error("Error fetching invite links:", linkError);
            setInviteLinks([]);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopySuccess(link);
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => console.error('Failed to copy link: ', err));
  };

  const handleEmailModal = (link) => {
    setCurrentInviteLink(link);
    setShowModal(true);
  };

  const handleSendEmails = async () => {
    try {
      // Split emails by comma, semicolon, space or newline and trim whitespace
      const emailList = emails
        .split(/[,;\s\n]+/)
        .map(email => email.trim())
        .filter(email => email);
      
      // Here you would typically send to your backend
      console.log("Sending invite to emails:", emailList, "with link:", currentInviteLink);
      
      // Close modal and reset form
      setShowModal(false);
      setEmails("");
      setCurrentInviteLink("");
    } catch (error) {
      console.error("Error sending invites:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Check if user is an admin
  const isAdmin = user.usageType === "organization" && 
                  user.organization && 
                  user.organization.role === "admin";

  return (
    <div className={clsx(
      "min-h-screen bg-gradient-to-br py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200",
      isDarkMode ? "from-gray-900 to-gray-800 text-white" : "from-indigo-50 to-blue-50"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/main"
            className={clsx(
              "flex items-center transition-colors",
              isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-indigo-600 hover:text-indigo-700"
            )}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <h1 className={clsx(
            "text-3xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>Profile</h1>
          <div className="w-24"></div>
        </div>

        <div className={clsx(
          "rounded-2xl shadow-xl p-6",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <div className="flex items-center mb-6">
            <div className={clsx(
              "p-4 rounded-full",
              isDarkMode ? "bg-gray-700" : "bg-indigo-50"
            )}>
              {user.usageType === "organization" ? (
                <BuildingOfficeIcon className={clsx(
                  "h-8 w-8",
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                )} />
              ) : (
                <UserIcon className={clsx(
                  "h-8 w-8",
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                )} />
              )}
            </div>
            <div className="ml-4">
              <h2 className={clsx(
                "text-2xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>{user.name}</h2>
              <p className={clsx(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {user.usageType === "organization" ? "Organization Account" : "Personal Account"}
                {isAdmin && " (Admin)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className={clsx(
                  "text-sm font-medium", 
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Email</h3>
                <p className={clsx(
                  "text-lg font-medium",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>{user.email}</p>
              </div>
              <div>
                <h3 className={clsx(
                  "text-sm font-medium", 
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Mobile Number</h3>
                <p className={clsx(
                  "text-lg font-medium",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>{user.mobileNumber}</p>
              </div>
              <div>
                <h3 className={clsx(
                  "text-sm font-medium", 
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>Member Since</h3>
                <p className={clsx(
                  "text-lg font-medium",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>{user.createdAt}</p>
              </div>
            </div>
          </div>

          {user.usageType === "organization" && user.organization && (
            <div className={clsx(
              "mt-8 p-6 rounded-xl",
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            )}>
              <h3 className={clsx(
                "text-xl font-bold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>Organization Details</h3>
              <p className={isDarkMode ? "text-gray-200" : "text-gray-700"}><strong>Organization:</strong> {user.organization.name}</p>
              <p className={isDarkMode ? "text-gray-200" : "text-gray-700"}><strong>Role:</strong> {user.organization.role}</p>
              <p className={isDarkMode ? "text-gray-200" : "text-gray-700"}><strong>Joined:</strong> {user.organization.joinedAt}</p>
            </div>
          )}

          {/* Invitation Links Section - Only visible for admins */}
          {isAdmin && inviteLinks.length > 0 && (
            <div className={clsx(
              "mt-6 p-6 rounded-xl",
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            )}>
              <h3 className={clsx(
                "text-xl font-bold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>Organization Invite Links</h3>
              
              <div className="space-y-4">
                {inviteLinks.map((item, index) => (
                  <div key={index} className={clsx(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg",
                    isDarkMode ? "bg-gray-800" : "bg-white",
                    "shadow"
                  )}>
                    <div className="mb-3 sm:mb-0 overflow-hidden">
                      <p className={clsx(
                        "text-sm font-medium truncate max-w-xs", 
                        isDarkMode ? "text-gray-300" : "text-gray-800"
                      )}>
                        {item.role}: {item.link}
                      </p>
                      {copySuccess === item.link && (
                        <span className={clsx(
                          "text-xs",
                          isDarkMode ? "text-green-400" : "text-green-600"
                        )}>Copied!</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopyLink(item.link)}
                        className={clsx(
                          "p-2 rounded-lg flex items-center transition-colors",
                          isDarkMode 
                            ? "bg-gray-700 hover:bg-gray-600 text-blue-400" 
                            : "bg-gray-100 hover:bg-gray-200 text-indigo-600"
                        )}
                      >
                        <ClipboardIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">Copy</span>
                      </button>
                      <button
                        onClick={() => handleEmailModal(item.link)}
                        className={clsx(
                          "p-2 rounded-lg flex items-center transition-colors",
                          isDarkMode 
                            ? "bg-blue-800 hover:bg-blue-700 text-white" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                      >
                        <EnvelopeIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">Email</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={clsx(
            "max-w-md w-full rounded-xl p-6",
            isDarkMode ? "bg-gray-800" : "bg-white"
          )}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={clsx(
                "text-xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>Send Invite by Email</h3>
              <button 
                onClick={() => setShowModal(false)}
                className={clsx(
                  "p-1 rounded-full",
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                )}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <label 
                htmlFor="emails"
                className={clsx(
                  "block text-sm font-medium mb-1",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}
              >
                Email Addresses (comma or line separated)
              </label>
              <textarea
                id="emails"
                rows="4"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="example@email.com, another@email.com"
                className={clsx(
                  "w-full px-3 py-2 border rounded-md",
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className={clsx(
                  "px-4 py-2 rounded-md transition-colors",
                  isDarkMode 
                    ? "bg-gray-700 hover:bg-gray-600 text-white" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmails}
                className={clsx(
                  "px-4 py-2 rounded-md transition-colors",
                  isDarkMode 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                Send Invites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;