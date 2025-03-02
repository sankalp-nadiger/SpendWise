import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle, CardContent, CardDescription } from "../ui/card";

const FeaturesPage = () => {
  const navigate = useNavigate();

  // Theme state
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

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Get usage type
  const usageType = localStorage.getItem("usageType") || "personal";

  // Checkbox state
  const [isChecked, setIsChecked] = useState(false);

  // Features list
  const features = {
    personal: [
      { title: "Expense Tracking", desc: "Monitor and categorize your personal expenses effortlessly." },
      { title: "AI-Powered Insights", desc: "Get smart insights into your spending patterns." },
      { title: "PDF Reports", desc: "Download detailed financial reports." },
      { title: "Telegram Integration", desc: "Log expenses directly via Telegram bot." },
    ],
    organization: [
      { title: "Team Expense Management", desc: "Track expenses across different teams and departments." },
      { title: "Advanced Analytics", desc: "Gain deep insights into company spending." },
      { title: "Multi-User Access", desc: "Collaborate with your team on expense management." },
      { title: "Custom Budgeting", desc: "Set budget limits for different teams." },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header & Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to SpendWise</h1>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded-lg"
          >
            Toggle {isDarkMode ? "Light" : "Dark"} Mode
          </button>
        </div>

        <p className="text-lg mb-6">
          Here’s how you can make the most of your {usageType === "organization" ? "organization" : "personal"} account.
        </p>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features[usageType].map((feature, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4">
              <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              <CardContent>
                <CardDescription>{feature.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions & Terms */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Instructions & Terms</h2>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Ensure all expenses logged are accurate and up-to-date.</li>
            <li>Personal accounts are for individual use only.</li>
            <li>Organizations must assign appropriate permissions to team members.</li>
            <li>Data privacy is important – do not share sensitive financial details. We never ask any card or bank account details.</li>
            <li>Violation of terms may lead to account suspension.</li>
          </ul>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="agree"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            className="w-5 h-5 mr-2 cursor-pointer"
          />
          <label htmlFor="agree" className="text-gray-800 dark:text-gray-300 cursor-pointer">
            I agree to the terms and conditions.
          </label>
        </div>

        {/* Proceed Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/mainPage")}
            disabled={!isChecked}
            className={`px-6 py-3 font-semibold rounded-lg transition ${
              isChecked
                ? "bg-blue-600 dark:bg-blue-400 text-white dark:text-black hover:bg-blue-700 dark:hover:bg-blue-300"
                : "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
            }`}
          >
            Proceed to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
