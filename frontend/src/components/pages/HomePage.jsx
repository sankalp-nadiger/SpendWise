"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { AuroraBackground } from "../ui/aurorabackground";

export default function HomePage() {
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
      {/* Dark Mode Toggle Button - Positioned Top Right */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 px-4 py-2 border rounded-full text-sm dark:bg-white dark:text-black bg-black text-white">
        {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4">
        <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
          SpendWise
        </div>
        <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
          Your personal and secure finance-tracker app
        </div>
        <button onClick={() => window.location.href = "/login"}
          className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
          Access Now
        </button>
      </motion.div>
    </AuroraBackground>
  );
}
