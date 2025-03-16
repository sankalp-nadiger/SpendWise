import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import { ArrowLeftIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';

const categoryColors = {
  Food: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  Transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Shopping: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Entertainment: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  Bills: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const categoryIcons = {
  Food: '🍽️',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎮',
  Bills: '📄',
  Other: '📌',
};

// Define expense level colors
const expenseLevelColors = {
  high: {
    light: 'bg-red-200',
    dark: 'dark:bg-red-900/50',
    dot: 'bg-red-500'
  },
  medium: {
    light: 'bg-yellow-200',
    dark: 'dark:bg-yellow-900/50',
    dot: 'bg-yellow-500'
  },
  low: {
    light: 'bg-green-200',
    dark: 'dark:bg-green-900/50',
    dot: 'bg-green-500'
  },
  none: {
    light: '',
    dark: '',
    dot: ''
  }
};

function BudgetCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark"; // If "dark", set true; otherwise, set false (for "light" or null)
  });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch expenses and budget data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch expenses
        const expensesResponse = await axios.get("http://localhost:8000/api/expense", {
          withCredentials: true,
        });
        setExpenses(expensesResponse.data);
        
        // Fetch user budget
        const budgetResponse = await axios.get("http://localhost:8000/api/budget", {
          withCredentials: true,
        });
        
        if (budgetResponse.data && budgetResponse.data.budget) {
          setMonthlyBudget(parseFloat(budgetResponse.data.budget));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save budget to backend
  const saveBudget = async () => {
    try {
      setIsSaving(true);
      await axios.post(
        "http://localhost:8000/api/budget",
        { budget: monthlyBudget },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getDayExpenses = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return expenses.filter(expense => 
      expense.date.substring(0, 10) === formattedDate
    );
  };

  const getMonthExpenses = (date) => {
    const monthStart = format(date, 'yyyy-MM');
    return expenses.filter(expense => 
      expense.date.substring(0, 7) === monthStart
    );
  };

  const getExpenseLevel = (total) => {
    const dailyBudget = monthlyBudget / 30;
    if (total > dailyBudget * 1.5) return 'high';
    if (total > dailyBudget * 0.75) return 'medium';
    if (total > 0) return 'low';
    return 'none';
  };

  const getTileClassName = ({ date }) => {
    const expenses = getDayExpenses(date);
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const level = getExpenseLevel(total);
    
    let className = 'relative ';
    
    if (level !== 'none') {
      className += `${isDarkMode ? expenseLevelColors[level].dark : expenseLevelColors[level].light}`;
    }
    
    return className;
  };

  const getTileContent = ({ date }) => {
    const expenses = getDayExpenses(date);
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const level = getExpenseLevel(total);
    
    // Group expenses by category
    const categories = {};
    expenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0;
      }
      categories[expense.category] += expense.amount;
    });
    
    const categoryKeys = Object.keys(categories);
    
    if (total > 0) {
      return (
        <div className="text-xs mt-1">
          <div className="font-semibold text-emerald-600 dark:text-emerald-400">₹{total.toFixed(0)}</div>
          {/* Show dots based on categories */}
          <div className="flex justify-center mt-1 space-x-1">
            {categoryKeys.length > 0 ? (
              categoryKeys.slice(0, 3).map((category, index) => (
                <span 
                  key={index} 
                  className={`h-2 w-2 rounded-full inline-block ${expenseLevelColors[level].dot}`} 
                  title={`${category}: ₹${categories[category].toFixed(2)}`}
                />
              ))
            ) : (
              <span className={`h-2 w-2 rounded-full inline-block ${expenseLevelColors[level].dot}`} />
            )}
            {categoryKeys.length > 3 && (
              <span className="h-2 w-2 rounded-full inline-block bg-gray-500" title="More categories" />
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const selectedDayExpenses = getDayExpenses(selectedDate);
  const totalForDay = selectedDayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthExpenses = getMonthExpenses(selectedDate);
  const totalForMonth = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetRemaining = monthlyBudget - totalForMonth;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      isDarkMode 
        ? 'from-gray-900 to-gray-800 text-white' 
        : 'from-indigo-50 to-blue-50'
    } py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/main"
            className={`flex items-center ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-700'
            } transition-colors`}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Budget Calendar
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-white hover:bg-gray-100'
            } transition-colors`}
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-xl p-6`}>
            <div className="mb-6">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-4`}>
                Monthly Budget
              </h2>
              <div className="flex items-center space-x-4 mb-4">
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`block w-full px-4 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-indigo-500`}
                />
                <button
                  onClick={saveBudget}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } transition-colors`}
                >
                  {isSaving ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
              <div className={`grid grid-cols-2 gap-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className={`p-4 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
                }`}>
                  <p className="text-sm font-medium">Spent</p>
                  <p className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-indigo-600'
                  }`}>
                    ₹{totalForMonth.toFixed(2)}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${
                  budgetRemaining >= 0 
                    ? isDarkMode ? 'bg-green-900/30' : 'bg-green-50' 
                    : isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}>
                  <p className="text-sm font-medium">Remaining</p>
                  <p className={`text-xl font-bold ${
                    budgetRemaining >= 0
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    ₹{budgetRemaining.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Legend for color coding */}
            <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Expense Level:
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${expenseLevelColors.high.dot} mr-1`}></span>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${expenseLevelColors.medium.dot} mr-1`}></span>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${expenseLevelColors.low.dot} mr-1`}></span>
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading calendar data...</p>
              </div>
            ) : (
              <div className="relative">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={getTileContent}
                  tileClassName={getTileClassName}
                  className={`w-full border-none ${isDarkMode ? 'dark-calendar' : ''}`}
                />
                
                {/* Add custom CSS for the calendar */}
                <style jsx="true">{`
                  .react-calendar {
                    font-family: inherit;
                    border: none !important;
                  }
                  
                  .react-calendar__tile {
                    position: relative;
                    height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                  }
                  
                  .react-calendar__tile {
                    position: relative;
                    height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                  }
                  
                  .react-calendar__month-view__days__day {
                    font-weight: 500;
                  }

                  /* Dark mode styles */
                  .dark-calendar .react-calendar__tile {
                    color: #e2e8f0;
                    background-color: #1f2937;
                  }

                  .dark-calendar .react-calendar__tile:enabled:hover,
                  .dark-calendar .react-calendar__tile:enabled:focus {
                    background-color: #374151;
                  }

                  .dark-calendar .react-calendar__tile--now {
                    background-color: #3b82f6 !important;
                    color: white;
                  }

                  .dark-calendar .react-calendar__tile--active {
                    background-color: #2563eb !important;
                    color: white;
                  }

                  .dark-calendar .react-calendar__navigation button:enabled:hover,
                  .dark-calendar .react-calendar__navigation button:enabled:focus {
                    background-color: #374151;
                  }

                  .dark-calendar .react-calendar__navigation button {
                    color: #e2e8f0;
                  }

                  .dark-calendar .react-calendar__month-view__weekdays__weekday {
                    color: #9ca3af;
                  }

                  .dark-calendar .react-calendar__month-view__days__day--neighboringMonth {
                    color: #6b7280;
                  }

.dark-calendar .react-calendar__navigation {
  background-color: #1f2937;
}

.dark-calendar .react-calendar__month-view__weekdays {
  background-color: #1f2937;
}

.dark-calendar .react-calendar__month-view__weekdays__weekday abbr {
  text-decoration: none;
}
                  }
                `}</style>
              </div>
            )}
          </div>

          <div className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-xl p-6`}>
            <div className="mb-6">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-2`}>
                Expenses for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <div className={`${
                isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
              } rounded-xl p-4`}>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-blue-400' : 'text-indigo-600'
                }`}>
                  Total Spending
                </p>
                <p className={`text-3xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-indigo-700'
                }`}>
                  ₹{totalForDay.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading expenses...</p>
                </div>
              ) : selectedDayExpenses.length === 0 ? (
                <p className={`text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                } py-8`}>
                  No expenses recorded for this date
                </p>
              ) : (
                selectedDayExpenses.map(expense => (
                  <div
                    key={expense._id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ₹{categoryColors[expense.category] || categoryColors.Other}`}>
                        {categoryIcons[expense.category] || categoryIcons.Other}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {expense.description}
                        </p>
                        <span className={`px-2 py-1 rounded-md text-sm font-medium ₹{categoryColors[expense.category] || categoryColors.Other}`}>
                          {expense.category}
                        </span>
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                     ₹{expense.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetCalendarPage;