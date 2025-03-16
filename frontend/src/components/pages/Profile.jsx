import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, BuildingOfficeIcon, UserIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import axios from "axios";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark"; 
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/users/profile", {
          withCredentials: true, // Ensures cookies (JWT) are sent
        });

        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

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
          "bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6",
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
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                <p className="text-lg font-medium text-gray-900">{user.mobileNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="text-lg font-medium text-gray-900">{user.createdAt}</p>
              </div>
            </div>
          </div>

          {user.usageType === "organization" && user.organization && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-bold mb-4">Organization Details</h3>
              <p><strong>Organization:</strong> {user.organization.name}</p>
              <p><strong>Role:</strong> {user.organization.role}</p>
              <p><strong>Joined:</strong> {user.organization.joinedAt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
