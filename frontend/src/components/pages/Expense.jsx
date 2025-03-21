import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Filter, Download, Search, Edit, Trash2, 
  Moon, Sun, Calendar, FileText, TrendingUp, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

// Category configurations
const categoryConfig = {
  'Food': { icon: '🍽️', color: { light: 'bg-emerald-100 text-emerald-800', dark: 'bg-emerald-900 text-emerald-200' } },
  'Health': { icon: '💊', color: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-200' } },
  'Travel': { icon: '🚗', color: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-200' } },
  'Shopping': { icon: '🛍️', color: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-200' } },
  'Entertainment': { icon: '🎮', color: { light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-900 text-amber-200' } },
  'Bills': { icon: '📄', color: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-200' } },
  'Office Supplies': { icon: '📌', color: { light: 'bg-cyan-100 text-cyan-800', dark: 'bg-cyan-900 text-cyan-200' } },
  'Hardware': { icon: '💻', color: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-200' } },
  'Software': { icon: '📱', color: { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-900 text-pink-200' } },
  'Other': { icon: '📌', color: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700 text-gray-200' } },
'IT Equipment': { icon: '💻', color: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-200' } },
'TravelOrg': { icon: '✈️', color: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-200' } },
'Meetings': { icon: '👥', color: { light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-900 text-amber-200' } },
'Marketing': { icon: '📣', color: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-200' } },
'Training': { icon: '🎓', color: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900 text-green-200' } },
'Utilities': { icon: '💡', color: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900 text-yellow-200' } },
'Rent': { icon: '🏢', color: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-200' } },
'Misc': { icon: '📌', color: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700 text-gray-200' } }
};

function ExpensesPage() {
  // State management
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [branches, setBranches] = useState(['Headquarters', 'Regional Office', 'Satellite Office', 'Remote']);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  // Add these to your state declarations
const [showEmailModal, setShowEmailModal] = useState(false);
const [emailAddress, setEmailAddress] = useState('');
const [emailSending, setEmailSending] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    branch: '',
    teamId: '',
    department: ''
  });
  const [userType, setuserType] = useState(() => {
    // Get userType from localStorage or default to "personal"
    return localStorage.getItem("userType") || "personal";
  });
  const [darkMode, setDarkMode] = useState(() => {
      const saved = localStorage.getItem("theme");
      return saved === "dark"; // If "dark", set true; otherwise, set false (for "light" or null)
    });
  
  // Add this state for departments and teams
  const [departments, setDepartments] = useState(['Marketing', 'Engineering', 'Finance', 'HR', 'Sales', 'Operations']);

  // Add this state to manage the export dropdown
  const [showExportOptions, setShowExportOptions] = useState(false);

const handleDownloadReport = async (fileType) => {
  try {
    setLoading(true);
    
    // Create filters object to pass to backend
    const filters = {
      searchTerm,
      category: selectedCategory,
      department: selectedDepartment,
      team: selectedTeam,
      branch: selectedBranch,
      dateRange
    };
    
    // Make API request to generate document
const filenameResponse = await fetch(`http://localhost:8000/api/report/expense/filename/${fileType}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

if (!filenameResponse.ok) {
  throw new Error('Failed to generate filename');
}

const { filename } = await filenameResponse.json();

const response = await fetch(`http://localhost:8000/api/report/expense/export/${fileType}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({ filters }),
});

if (!response.ok) {
  throw new Error('Failed to generate report');
}

const blob = await response.blob();

// Create download link with the pre-fetched filename
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.style.display = 'none';
a.href = url;
a.download = filename;

// Trigger download
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);

// Close export options dropdown
setShowExportOptions(false);
  } catch (error) {
    console.error("Error downloading report:", error);
    alert("Failed to download report. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // Function to handle email sending
const handleEmailReport = async () => {
  if (!emailAddress) return;
  
  try {
    setEmailSending(true);
    
    // Create filters object to pass to backend
    const filters = {
      searchTerm,
      category: selectedCategory,
      department: selectedDepartment,
      team: selectedTeam,
      branch: selectedBranch,
      dateRange
    };
    
    // Make API request to send email
    const response = await fetch("http://localhost:8000/api/report/expense/email-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ 
        email: emailAddress,
        filters 
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    alert("Expense report has been sent to your email.");
    
    // Close modal and dropdown
    setShowEmailModal(false);
    setShowExportOptions(false);
    setEmailAddress('');
  } catch (error) {
    console.error("Error sending email:", error);
    alert("Failed to send email. Please try again.");
  } finally {
    setEmailSending(false);
  }
};
  
  // Add this ref to track the dropdown element
  const exportDropdownRef = useRef(null);

  // Add this effect to handle clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportOptions(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownRef]);
  
  // Fetch data and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = "http://localhost:8000/api/expense";
          
        const response = await axios.get(url, {
          withCredentials: true, // ✅ Send cookies (accessToken)
        });

        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType]);
  
  // Apply filters
useEffect(() => {
  let filtered = expenses;
  
  if (searchTerm) {
    filtered = filtered.filter(expense => 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(expense => expense.category === selectedCategory);
  }
  if (userType === "organization" && selectedBranch !== 'All') {
    filtered = filtered.filter(expense => expense.branch === selectedBranch);
  }
  
  if (userType === "organization" && selectedDepartment !== 'all') {
    filtered = filtered.filter(expense => expense.department === selectedDepartment);
  }

  if (userType === "organization" && selectedTeam !== 'All' && selectedTeam !== '') {
    filtered = filtered.filter(expense => 
      expense.teamId && expense.teamId.toLowerCase().includes(selectedTeam.toLowerCase())
    );
  }
  
  if (dateRange.start) {
    filtered = filtered.filter(expense => 
      new Date(expense.date) >= new Date(dateRange.start)
    );
  }
  
  if (dateRange.end) {
    filtered = filtered.filter(expense => 
      new Date(expense.date) <= new Date(dateRange.end)
    );
  }
  
  setFilteredExpenses(filtered);
}, [searchTerm, selectedCategory, selectedDepartment, selectedTeam, dateRange, expenses, userType]);


const categories = userType === "organization" 
? ["Office Supplies", "IT Equipment", "Software", "Travel", "Meetings", "Marketing", "Training", "Utilities", "Rent", "Misc"] 
: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Other"];

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Format currency in Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get category icon and color
  const getCategoryDisplay = (category) => {
    const config = categoryConfig[category] || categoryConfig['Other'];
    return {
      icon: config.icon,
      color: darkMode ? config.color.dark : config.color.light
    };
  };

  // Add new expense
  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return;
  
    try {
      // Show loading
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      
      // Prepare the expense object
      const expenseData = {
        title: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: new Date(newExpense.date),
      };

      if (userType === "organization") {
        expenseData.department = newExpense.department;
        expenseData.teamId = newExpense.teamId;
      }
      
      // Make API request
      const response = await fetch("http://localhost:8000/api/expense/add", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(expenseData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Expense Added:", data);
        
        // For demo/development, add to local state until page refresh
        const newId = (Math.max(...expenses.map(e => parseInt(e.id) || 0)) + 1).toString();
        const newExpenseWithId = {
          id: newId,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          date: new Date(newExpense.date),
          createdBy: { name: 'You' }
        };
        
        // Add organizationanization fields if needed
        if (userType === "organization") {
          newExpenseWithId.branch = newExpense.branch || 'Headquarters';
          newExpenseWithId.teamId = newExpense.teamId;
          newExpenseWithId.department = newExpense.department;
        }
        
        setExpenses([...expenses, newExpenseWithId]);
        
        // Close modal and reset form
        setShowAddModal(false);
        setNewExpense({
          description: '',
          amount: '',
          category: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          branch: '',
          teamId: '',
          department: ''
        });
      } else {
        console.error("Failed to add expense");
        alert("Failed to add expense. Please try again.");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Error adding expense. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Edit expense
  const handleEditExpense = async () => {
    if (!currentExpense || !currentExpense.description || !currentExpense.amount || !currentExpense.category) return;
  
    try {
      setLoading(true);
  
      const expenseData = {
        title: currentExpense.description,
        amount: parseFloat(currentExpense.amount),
        category: currentExpense.category,
        date: new Date(currentExpense.date),
      };
      
      // Add organizationanization-specific fields if userType is organization
      if (userType === "organization") {
        expenseData.branch = currentExpense.branch;
        expenseData.teamId = currentExpense.teamId;
        expenseData.department = currentExpense.department;
      }
  
      // Make API request with cookies
      const response = await fetch(`http://localhost:8000/api/expense/${currentExpense._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(expenseData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Expense Updated:", data);
  
        // Update local state
        const updatedExpenses = expenses.map((expense) =>
          expense._id === currentExpense._id
            ? { ...expense, ...expenseData }
            : expense
        );
  
        setExpenses(updatedExpenses);
        setShowEditModal(false);
        setCurrentExpense(null);
      } else {
        console.error("Failed to update expense");
        alert("Failed to update expense. Please try again.");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Error updating expense. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async () => {
    if (!currentExpense) return;

    try {
      setLoading(true);

      // Make API request with cookies
      const response = await fetch(`http://localhost:8000/api/expense/${currentExpense._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        console.log("Expense Deleted:", currentExpense.id);

        // Update local state
        const updatedExpenses = expenses.filter((expense) => expense._id !== currentExpense._id);
        setExpenses(updatedExpenses);

        setShowDeleteModal(false);
        setCurrentExpense(null);
      } else {
        console.error("Failed to delete expense");
        alert("Failed to delete expense. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with expense data
  const openEditModal = (expense) => {
    // Convert date object to string format for input
    const dateStr = format(new Date(expense.date), 'yyyy-MM-dd');
    
    setCurrentExpense({
      ...expense,
      date: dateStr
    });
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (expense) => {
    setCurrentExpense(expense);
    setShowDeleteModal(true);
  };

  // Theme classes based on dark mode
  const theme = {
    // Main background
    mainBg: darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 to-blue-50',
    // Cards
    card: darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-xl',
    // Buttons
    primaryBtn: darkMode 
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
      : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondaryBtn: darkMode 
      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    dangerBtn: darkMode
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white',
    // Text
    heading: darkMode ? 'text-white' : 'text-gray-900',
    subheading: darkMode ? 'text-gray-300' : 'text-gray-500',
    // Inputs
    input: darkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400',
    // Row hover
    rowHover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    // Table styles
    table: {
      header: darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500',
      row: darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
    },
    // Modal styles
    modal: {
      overlay: darkMode ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-50',
      content: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    }
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.mainBg}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${theme.mainBg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with navigation and theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/main"
              className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${theme.heading}`}>
                {userType === 'organization' ? 'Organization Expenses' : 'Personal Expense Tracker'}
              </h1>
              <p className={`mt-1 ${theme.subheading}`}>
                Manage and track your {userType === 'organization' ? 'organization\'s' : 'personal'} expenses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full ${theme.secondaryBtn}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className={`${theme.primaryBtn} px-4 py-2 rounded-lg flex items-center`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${theme.card} p-6 rounded-xl flex items-center transition-all duration-300 transform hover:scale-105`}>
            <div className="rounded-full p-4 mr-4 bg-indigo-500 bg-opacity-10">
              <FileText size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className={`${theme.subheading} text-sm`}>Total Expenses</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          
          <div className={`${theme.card} p-6 rounded-xl flex items-center transition-all duration-300 transform hover:scale-105`}>
            <div className="rounded-full p-4 mr-4 bg-emerald-500 bg-opacity-10">
              <Calendar size={24} className="text-emerald-500" />
            </div>
            <div>
              <h3 className={`${theme.subheading} text-sm`}>This Month</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {formatCurrency(
                  filteredExpenses
                    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </p>
            </div>
          </div>
          
          <div className={`${theme.card} p-6 rounded-xl flex items-center transition-all duration-300 transform hover:scale-105`}>
            <div className="rounded-full p-4 mr-4 bg-purple-500 bg-opacity-10">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className={`${theme.subheading} text-sm`}>Expenses Count</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {filteredExpenses.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`${theme.card} p-6 rounded-xl mb-8`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-60">
              <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expenses..."
                  className={`pl-10 pr-4 py-2 border rounded-lg w-full ${theme.input}`}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
            
            <div className="w-48">
              <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`border rounded-lg p-2 w-full ${theme.input}`}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Branch filter for organization user */}
            {userType === "organization" && (
  <div className="w-48">
    <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>Branch</label>
    <div className="relative">
      <input
        type="text"
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
        placeholder="Filter by branch..."
        className={`border rounded-lg p-2 w-full ${theme.input}`}
      />
    </div>
  </div>
)}
            
            {/* Show department filter for organizationanization user */}
            {userType === "organization" && (
              <div className="w-48">
                <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>Department</label>
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`border rounded-lg p-2 w-full ${theme.input}`}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Show team filter for organizationanization user */}
            {userType === "organization" && (
  <div className="w-48">
    <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>Team</label>
    <div className="relative">
      <input
        type="text"
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        placeholder="Filter by team..."
        className={`border rounded-lg p-2 w-full ${theme.input}`}
      />
    </div>
  </div>
)}
            
            <div className="w-40">
              <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className={`border rounded-lg p-2 w-full ${theme.input}`}
              />
            </div>
            
            <div className="w-40">
              <label className={`block text-sm font-medium ${theme.subheading} mb-1`}>To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className={`border rounded-lg p-2 w-full ${theme.input}`}
              />
            </div>

<div className="relative" ref={exportDropdownRef}>
  <button 
    className={`${theme.secondaryBtn} px-4 py-2 rounded-lg flex items-center gap-2`}
    onClick={() => setShowExportOptions(!showExportOptions)}
  >
    <Download size={18} />
    Export
  </button>
  
  {showExportOptions && (
    <div 
      className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 
      ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        <button
          className={`flex items-center px-4 py-2 text-sm w-full text-left
          ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          role="menuitem"
          onClick={() => handleDownloadReport('pdf')}
        >
          <Download size={16} className="mr-2" />
          Download as PDF
        </button>
        <button
          className={`flex items-center px-4 py-2 text-sm w-full text-left
          ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          role="menuitem"
          onClick={() => handleDownloadReport('docx')}
        >
          <Download size={16} className="mr-2" />
          Download as Word
        </button>
        <button
          className={`flex items-center px-4 py-2 text-sm w-full text-left
          ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          role="menuitem"
          onClick={() => setShowEmailModal(true)}
        >
          <Mail size={16} className="mr-2" />
          Send to Email
        </button>
      </div>
    </div>
  )}
</div>
          </div>
        </div>

        {/* Expenses Table */}
        {loading ? (
  <div className="text-center py-10">
    <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid ${darkMode ? 'border-blue-500 border-r-transparent' : 'border-blue-600 border-r-transparent'}`}></div>
    <p className={`mt-2 ${theme.subheading}`}>Loading expenses...</p>
  </div>
) : (
  <div className={`${theme.card} rounded-lg overflow-hidden`}>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className={theme.table.header}>
          <tr>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Date</th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Category</th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Description</th>
            {userType === 'organization' && (
              <>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Branch</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Department</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Team</th>
              </>
            )}
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Amount</th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Created By</th>
            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Actions</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan={userType === 'organization' ? 9 : 6} className={`px-6 py-8 text-center ${theme.subheading}`}>
                No expenses found. Add a new expense to get started.
              </td>
            </tr>
          ) : (
            filteredExpenses.map(expense => {
              const categoryStyle = getCategoryDisplay(expense.category);
              
              return (
                <tr key={expense.id} className={`${theme.table.row} transition-all duration-200`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.color}`}>
                      <span className="mr-1">{categoryStyle.icon}</span>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{expense.description}</td>
                  {userType === 'organization' && (
                    <>
                      <td className="px-6 py-4">{expense.branch || '-'}</td>
                      <td className="px-6 py-4">{expense.department || '-'}</td>
                      <td className="px-6 py-4">{expense.team || '-'}</td>
                    </>
                  )}
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {expense.createdBy?.name || 'You'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button 
                        className={darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}
                        onClick={() => openEditModal(expense)}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className={darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}
                        onClick={() => openDeleteModal(expense)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        
{/* Add Expense Modal */}
{showAddModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className={`fixed inset-0 ${theme.modal.overlay}`} onClick={() => setShowAddModal(false)}></div>
    <div className={`relative w-full max-w-lg p-6 rounded-lg shadow-xl ${theme.modal.content}`}>
      <h3 className={`text-xl font-semibold mb-4 ${theme.heading}`}>Add New Expense</h3>
      
      <div className="space-y-4">
        {/* Common fields */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Description</label>
          <input
            type="text"
            placeholder="What did you spend on?"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={newExpense.description}
            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Amount (₹)</label>
          <input
            type="number"
            placeholder="0.00"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={newExpense.amount}
            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Category</label>
          <select
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={newExpense.category}
            onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
          >
            <option value="">Select Category</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Date</label>
          <input
            type="date"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={newExpense.date}
            onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
          />
        </div>
        
        {/* Organization-specific fields */}
        {userType === 'organization' && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Department</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
                value={newExpense.department}
                onChange={(e) => setNewExpense({...newExpense, department: e.target.value})}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
  <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Team</label>
  <input
    type="text"
    placeholder="Enter Team ID"
    className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
    value={newExpense.teamId}
    onChange={(e) => setNewExpense({...newExpense, teamId: e.target.value})}
  />
</div>
          </>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowAddModal(false)}
          className={`px-4 py-2 rounded-lg ${theme.secondaryBtn}`}
        >
          Cancel
        </button>
        <button
          onClick={handleAddExpense}
          disabled={!newExpense.description || !newExpense.amount || !newExpense.category}
          className={`px-4 py-2 rounded-lg ${theme.primaryBtn} ${
            (!newExpense.description || !newExpense.amount || !newExpense.category) 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          Save Expense
        </button>
      </div>
    </div>
  </div>
)}

{/* Edit Expense Modal */}
{showEditModal && currentExpense && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className={`fixed inset-0 ${theme.modal.overlay}`} onClick={() => setShowEditModal(false)}></div>
    <div className={`relative w-full max-w-lg p-6 rounded-lg shadow-xl ${theme.modal.content}`}>
      <h3 className={`text-xl font-semibold mb-4 ${theme.heading}`}>Edit Expense</h3>
      
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Description</label>
          <input
            type="text"
            placeholder="What did you spend on?"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={currentExpense.description}
            onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
          /> 
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Amount (₹)</label>
          <input
            type="number"
            placeholder="0.00"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={currentExpense.amount}
            onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Category</label>
          <select
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={currentExpense.category}
            onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
          >
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Date</label>
          <input
            type="date"
            className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
            value={currentExpense.date}
            onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})}
          />
        </div>
        
        {userType === 'organization' && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Branch</label>
            <input
              type="text"
              placeholder="Branch name"
              className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
              value={currentExpense.branch}
              onChange={(e) => setCurrentExpense({...currentExpense, branch: e.target.value})}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowEditModal(false)}
          className={`px-4 py-2 rounded-lg ${theme.secondaryBtn}`}
        >
          Cancel
        </button>
        <button
          onClick={handleEditExpense}
          disabled={!currentExpense.description || !currentExpense.amount || !currentExpense.category}
          className={`px-4 py-2 rounded-lg ${theme.primaryBtn} ${
            (!currentExpense.description || !currentExpense.amount || !currentExpense.category) 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          Update Expense
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteModal && currentExpense && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className={`fixed inset-0 ${theme.modal.overlay}`} onClick={() => setShowDeleteModal(false)}></div>
    <div className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${theme.modal.content}`}>
      <h3 className={`text-xl font-semibold mb-2 ${theme.heading}`}>Confirm Delete</h3>
      
      <p className={`mb-6 ${theme.subheading}`}>
        Are you sure you want to delete the expense "{currentExpense.description}" of {formatCurrency(currentExpense.amount)}?
        This action cannot be undone.
      </p>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className={`px-4 py-2 rounded-lg ${theme.secondaryBtn}`}
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteExpense}
          className={`px-4 py-2 rounded-lg ${theme.dangerBtn}`}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

{/* Email Modal */}
{showEmailModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className={`fixed inset-0 ${theme.modal.overlay}`} onClick={() => setShowEmailModal(false)}></div>
    <div className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${theme.modal.content}`}>
      <h3 className={`text-xl font-semibold mb-4 ${theme.heading}`}>Send Report by Email</h3>
      
      <div>
        <label className={`block text-sm font-medium mb-1 ${theme.subheading}`}>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email address"
          className={`w-full px-3 py-2 border rounded-lg ${theme.input}`}
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowEmailModal(false)}
          className={`px-4 py-2 rounded-lg ${theme.secondaryBtn}`}
        >
          Cancel
        </button>
        <button
          onClick={handleEmailReport}
          disabled={!emailAddress || emailSending}
          className={`px-4 py-2 rounded-lg ${theme.primaryBtn} ${
            (!emailAddress || emailSending) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {emailSending ? 'Sending...' : 'Send Report'}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default ExpensesPage;