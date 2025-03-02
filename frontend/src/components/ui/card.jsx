import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`shadow-lg rounded-2xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children }) => {
  return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
};

export const CardContent = ({ children }) => {
  return <div className="text-gray-600 dark:text-gray-300">{children}</div>;
};

export const CardDescription = ({ children }) => {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;
};

export const CardHeader = ({ children, className = "" }) => {
    return (
      <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
        {children}
      </div>
    );
  };

  export const CardFooter = ({ children, className = "" }) => {
    return (
      <div className={`flex items-center p-6 pt-0 ${className}`}>
        {children}
      </div>
    );
  };