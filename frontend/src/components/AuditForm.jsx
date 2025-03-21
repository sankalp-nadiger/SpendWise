import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuditForm = ({ onSubmit, userType }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState([]);
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState([]);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [includeInvestments, setIncludeInvestments] = useState(true);
  const [purpose, setPurpose] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [branchInput, setBranchInput] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    // Store theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      try {
        // Using the metadata directly instead of axios call for this example
        const metadata = {
          individual: {
            incomeCategories: ["Salary", "Freelance", "Investment", "Business", "Gift", "Refund", "Sale", "Rental", "Other"],
            expenseCategories: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Other"]
          },
          organization: {
            incomeCategories: ["Salary", "Freelance", "Investment", "Business", "Gift", "Refund", "Sale", "Rental", "Other"],
            expenseCategories: ["Office Supplies", "IT Equipment", "Software", "Travel", "Meetings", "Marketing", "Training", "Utilities", "Rent", "Misc"],
            departments: ['Marketing', 'Engineering', 'Finance', 'HR', 'Sales', 'Operations'],
          }
        };
        
        const data = metadata[userType] || metadata.individual;
        
        setIncomeCategories(data.incomeCategories || []);
        setExpenseCategories(data.expenseCategories || []);
        
        if (userType === 'organization') {
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetadata();
  }, [userType]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parameters = {
      dateRange,
      selectedIncomeCategories,
      selectedExpenseCategories,
      includeBudgets,
      includeInvestments,
      ...(userType === 'organization' && {
        selectedDepartments,
        selectedBranches
      })
    };
    
    onSubmit(parameters, purpose || 'General financial audit' + (customRequirements ? ` with focus on ${customRequirements}` : ''));
  };

  const handleAddBranch = () => {
    if (branchInput.trim() && !selectedBranches.includes(branchInput.trim())) {
      setSelectedBranches([...selectedBranches, branchInput.trim()]);
      setBranchInput('');
    }
  };

  const handleRemoveBranch = (branch) => {
    setSelectedBranches(selectedBranches.filter(b => b !== branch));
  };

  // Dynamic classes based on theme
  const containerClass = `p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`;
  const inputClass = `p-2 w-full border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`;
  const buttonClass = `font-bold py-2 px-4 rounded ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`;
  const labelClass = `${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`;
  const themeButtonClass = `ml-2 font-bold py-1 px-3 rounded ${theme === 'dark' ? 'bg-yellow-400 text-gray-800 hover:bg-yellow-300' : 'bg-gray-700 text-white hover:bg-gray-600'}`;
  const chipClass = `flex items-center px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`;

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">Audit Parameters</h2>
        </div>
        <button
          type="button"
          className={themeButtonClass}
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">What is the purpose of this audit?</h3>
        <select 
          className={inputClass}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          <option value="">Select a purpose...</option>
          <option value="Tax preparation">Tax preparation</option>
          <option value="Financial planning">Financial planning</option>
          <option value="Cost reduction analysis">Cost reduction analysis</option>
          <option value="Budget compliance">Budget compliance</option>
          <option value="Investment performance">Investment performance</option>
          <option value="Custom">Custom purpose...</option>
        </select>
        
        {purpose === 'Custom' && (
          <textarea
            className={`${inputClass} mt-2`}
            placeholder="Describe your audit requirements..."
            value={customRequirements}
            onChange={(e) => setCustomRequirements(e.target.value)}
            rows={3}
          />
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Date Range</h3>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${labelClass}`}>Start Date</label>
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                required
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${labelClass}`}>End Date</label>
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                required
              />
            </div>
          </div>
        </div>
        
        {/* Income Categories */}
        <div>
          <h3 className="text-lg font-medium mb-2">Income Categories</h3>
          
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="select-all-income"
              checked={selectedIncomeCategories.length === incomeCategories.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIncomeCategories([...incomeCategories]);
                } else {
                  setSelectedIncomeCategories([]);
                }
              }}
              className="mr-2"
            />
            <label htmlFor="select-all-income" className="font-medium">Select All</label>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {incomeCategories.map(category => (
              <div key={`income-${category}`} className="flex items-center">
                <input
                  type="checkbox"
                  id={`income-${category}`}
                  checked={selectedIncomeCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIncomeCategories([...selectedIncomeCategories, category]);
                    } else {
                      setSelectedIncomeCategories(selectedIncomeCategories.filter(c => c !== category));
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor={`income-${category}`} className={labelClass}>{category}</label>
              </div>
            ))}
          </div>
          
          {selectedIncomeCategories.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Select at least one income category</p>
          )}
        </div>
        
        {/* Expense Categories */}
        <div>
          <h3 className="text-lg font-medium mb-2">Expense Categories</h3>
          
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="select-all-expense"
              checked={selectedExpenseCategories.length === expenseCategories.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedExpenseCategories([...expenseCategories]);
                } else {
                  setSelectedExpenseCategories([]);
                }
              }}
              className="mr-2"
            />
            <label htmlFor="select-all-expense" className="font-medium">Select All</label>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {expenseCategories.map(category => (
              <div key={`expense-${category}`} className="flex items-center">
                <input
                  type="checkbox"
                  id={`expense-${category}`}
                  checked={selectedExpenseCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedExpenseCategories([...selectedExpenseCategories, category]);
                    } else {
                      setSelectedExpenseCategories(selectedExpenseCategories.filter(c => c !== category));
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor={`expense-${category}`} className={labelClass}>{category}</label>
              </div>
            ))}
          </div>
          
          {selectedExpenseCategories.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Select at least one expense category</p>
          )}
        </div>
        
        {userType === 'organization' && (
          <>
            <div>
              <h3 className="text-lg font-medium mb-2">Departments</h3>
              <div className="grid grid-cols-3 gap-2">
                {departments.map(dept => (
                  <div key={dept} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`dept-${dept}`}
                      checked={selectedDepartments.includes(dept)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDepartments([...selectedDepartments, dept]);
                        } else {
                          setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`dept-${dept}`} className={labelClass}>{dept}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Branches</h3>
              <div className="flex mb-2">
                <input
                  type="text"
                  className={`flex-1 ${inputClass}`}
                  placeholder="Enter branch name"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                />
                <button 
                  type="button"
                  className={`ml-2 ${buttonClass}`}
                  onClick={handleAddBranch}
                >
                  Add
                </button>
              </div>
              
              {selectedBranches.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Selected Branches:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBranches.map(branch => (
                      <div key={branch} className={chipClass}>
                        <span>{branch}</span>
                        <button
                          type="button"
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveBranch(branch)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeBudgets"
              checked={includeBudgets}
              onChange={(e) => setIncludeBudgets(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="includeBudgets" className={labelClass}>Include Budget Analysis</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeInvestments"
              checked={includeInvestments}
              onChange={(e) => setIncludeInvestments(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="includeInvestments" className={labelClass}>Include Investment Performance</label>
          </div>
        </div>
        
        <button
          type="submit"
          className={buttonClass}
          disabled={(selectedIncomeCategories.length === 0 || selectedExpenseCategories.length === 0) || loading}
        >
          {loading ? 'Loading...' : 'Generate Audit Report'}
        </button>
      </form>
    </div>
  );
};

export default AuditForm;