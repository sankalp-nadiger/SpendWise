import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Search, Edit, Trash2, Moon, Sun, Calendar, FileText, TrendingUp } from 'lucide-react';

const ExpensesPage = () => {
  // State management
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [userType, setUserType] = useState('individual'); // Default to individual
  const [darkMode, setDarkMode] = useState(false);
  
  // Sample expense data for demonstration
  const sampleExpenses = [
    {
      _id: '1',
      amount: 7850,
      category: 'Office Supplies',
      description: 'Printer ink and paper',
      date: new Date('2025-02-28'),
      branch: 'Headquarters',
      createdBy: { name: 'John Doe' }
    },
    {
      _id: '2',
      amount: 2499,
      category: 'Travel',
      description: 'Cab to client meeting',
      date: new Date('2025-03-01'),
      branch: 'Sales',
      createdBy: { name: 'Jane Smith' }
    },
    {
      _id: '3',
      amount: 4500,
      category: 'Food & Dining',
      description: 'Team lunch',
      date: new Date('2025-03-02'),
      branch: 'Marketing',
      createdBy: { name: 'Alex Johnson' }
    },
    {
      _id: '4',
      amount: 12000,
      category: 'Hardware',
      description: 'External monitor',
      date: new Date('2025-03-01'),
      branch: 'Engineering',
      createdBy: { name: 'Priya Sharma' }
    },
    {
      _id: '5',
      amount: 999,
      category: 'Software',
      description: 'Monthly subscription',
      date: new Date('2025-02-25'),
      branch: 'IT',
      createdBy: { name: 'Rahul Gupta' }
    }
  ];

  // Fetch user type and mode from localStorage on component mount
  useEffect(() => {
    const storedUserType = localStorage.getItem('usageType');
    if (storedUserType) {
      setUserType(storedUserType);
    }
    
    const storedMode = localStorage.getItem('mode');
    if (storedMode === 'dark') {
      setDarkMode(true);
    }
    
    // In a real app, you would fetch expenses from API
    // For now, we'll use sample data
    setExpenses(sampleExpenses);
    setFilteredExpenses(sampleExpenses);
    setLoading(false);
  }, []);

  // Filter expenses based on search term, category, and date range
  useEffect(() => {
    let filtered = expenses;
    
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
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
  }, [searchTerm, selectedCategory, dateRange, expenses]);

  // Get unique categories for filter dropdown
  const categories = [...new Set(expenses.map(expense => expense.category))];
  
  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency - Indian Rupee
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('mode', newMode ? 'dark' : 'light');
  };

  // Dynamic classes based on dark mode
  const getThemeClasses = {
    // Main background
    mainBg: darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800',
    // Cards
    card: darkMode ? 'bg-gray-800 shadow-md' : 'bg-white shadow',
    // Table
    table: {
      header: darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500',
      row: darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
    },
    // Inputs
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700',
    // Buttons
    primaryBtn: darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    secondaryBtn: darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    // Text
    heading: darkMode ? 'text-white' : 'text-gray-800',
    subheading: darkMode ? 'text-gray-300' : 'text-gray-500'
  };

  // Category badge color mapping
  const categoryColors = {
    'Office Supplies': { bg: darkMode ? 'bg-blue-900' : 'bg-blue-100', text: darkMode ? 'text-blue-200' : 'text-blue-800' },
    'Travel': { bg: darkMode ? 'bg-green-900' : 'bg-green-100', text: darkMode ? 'text-green-200' : 'text-green-800' },
    'Food & Dining': { bg: darkMode ? 'bg-orange-900' : 'bg-orange-100', text: darkMode ? 'text-orange-200' : 'text-orange-800' },
    'Hardware': { bg: darkMode ? 'bg-purple-900' : 'bg-purple-100', text: darkMode ? 'text-purple-200' : 'text-purple-800' },
    'Software': { bg: darkMode ? 'bg-pink-900' : 'bg-pink-100', text: darkMode ? 'text-pink-200' : 'text-pink-800' }
  };

  // Default category colors
  const defaultCategoryColor = { bg: darkMode ? 'bg-gray-700' : 'bg-gray-100', text: darkMode ? 'text-gray-300' : 'text-gray-800' };

  return (
    <div className={`min-h-screen p-6 ${getThemeClasses.mainBg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${getThemeClasses.heading}`}>
              {userType === 'organization' ? 'Organization Expenses' : 'Personal Expenses'}
            </h1>
            <p className={`mt-1 ${getThemeClasses.subheading}`}>
              Manage and track your {userType === 'organization' ? 'organization\'s' : 'personal'} expenses
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full ${getThemeClasses.secondaryBtn}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className={`${getThemeClasses.primaryBtn} px-4 py-2 rounded-lg flex items-center gap-2`}
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${getThemeClasses.card} p-6 rounded-lg flex items-center`}>
            <div className="rounded-full p-4 mr-4 bg-blue-500 bg-opacity-10">
              <FileText size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className={`${getThemeClasses.subheading} text-sm`}>Total Expenses</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
          
          <div className={`${getThemeClasses.card} p-6 rounded-lg flex items-center`}>
            <div className="rounded-full p-4 mr-4 bg-green-500 bg-opacity-10">
              <Calendar size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className={`${getThemeClasses.subheading} text-sm`}>This Month</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {formatCurrency(
                  filteredExpenses
                    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </p>
            </div>
          </div>
          
          <div className={`${getThemeClasses.card} p-6 rounded-lg flex items-center`}>
            <div className="rounded-full p-4 mr-4 bg-purple-500 bg-opacity-10">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className={`${getThemeClasses.subheading} text-sm`}>Expenses Count</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {filteredExpenses.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${getThemeClasses.card} p-6 rounded-lg mb-8`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className={`block text-sm font-medium ${getThemeClasses.subheading} mb-1`}>Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expenses..."
                  className={`pl-10 pr-4 py-2 border rounded-lg w-full ${getThemeClasses.input}`}
                />
                <Search className={`absolute left-3 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={18} />
              </div>
            </div>
            
            <div className="w-48">
              <label className={`block text-sm font-medium ${getThemeClasses.subheading} mb-1`}>Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`border rounded-lg p-2 w-full ${getThemeClasses.input}`}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="w-40">
              <label className={`block text-sm font-medium ${getThemeClasses.subheading} mb-1`}>From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className={`border rounded-lg p-2 w-full ${getThemeClasses.input}`}
              />
            </div>
            
            <div className="w-40">
              <label className={`block text-sm font-medium ${getThemeClasses.subheading} mb-1`}>To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className={`border rounded-lg p-2 w-full ${getThemeClasses.input}`}
              />
            </div>
            
            <button className={`${getThemeClasses.secondaryBtn} px-4 py-2 rounded-lg flex items-center gap-2`}>
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div className="text-center py-10">
            <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid ${darkMode ? 'border-blue-500 border-r-transparent' : 'border-blue-600 border-r-transparent'}`}></div>
            <p className={`mt-2 ${getThemeClasses.subheading}`}>Loading expenses...</p>
          </div>
        ) : (
          <div className={`${getThemeClasses.card} rounded-lg overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={getThemeClasses.table.header}>
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Date</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Category</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Description</th>
                    {userType === 'organization' && (
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Branch</th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Created By</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={userType === 'organization' ? 7 : 6} className={`px-6 py-8 text-center ${getThemeClasses.subheading}`}>
                        No expenses found. Add a new expense to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => {
                      const categoryColor = categoryColors[expense.category] || defaultCategoryColor;
                      
                      return (
                        <tr key={expense._id} className={getThemeClasses.table.row}>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(expense.date)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${categoryColor.bg} ${categoryColor.text}`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">{expense.description}</td>
                          {userType === 'organization' && (
                            <td className="px-6 py-4">{expense.branch}</td>
                          )}
                          <td className="px-6 py-4 font-medium">{formatCurrency(expense.amount)}</td>
                          <td className="px-6 py-4">{expense.createdBy.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button className={darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}>
                                <Edit size={18} />
                              </button>
                              <button className={darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}>
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
        
        {/* Modal would be implemented here */}
      </div>
    </div>
  );
};

export default ExpensesPage;