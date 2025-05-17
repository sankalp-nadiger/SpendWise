import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'react-hot-toast';
import EditIncomeModal from '../EditIncome';
const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [recurringIncomes, setRecurringIncomes] = useState([]);
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem("userType") || "individual";
  });
   // "individual" or "organization"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isRecurringListOpen, setIsRecurringListOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [totalIncome, setTotalIncome] = useState(0);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [newIncome, setNewIncome] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    units: "",
    pricePerUnit: "",
    source: "",
    notes: "",
    isRecurring: false
  });

  const [recurringIncome, setRecurringIncome] = useState({
    title: "",
    amount: "",
    category: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    units: "",
    pricePerUnit: "",
    source: "",
    notes: ""
  });

  const categories = ["Salary", "Freelance", "Investment", "Business", "Gift", "Refund", "Sale", "Rental", "Other"];
  const recurringCategories = [...categories];
  const frequencies = ["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"];
  const sources = ["Cash", "Bank Transfer", "UPI", "Credit Card", "Check", "Online Payment", "Other"];
  
  useEffect(() => {
    fetchIncomes();
    fetchRecurringIncomes();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [incomes]);
  useEffect(() => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }, [theme]);
    const toggleTheme = () => {
      setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };
    
  const fetchIncomes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/income`, {
        withCredentials: true
      });
      setIncomes(response.data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      toast.error("Failed to fetch income data");
    }
  };

  const fetchRecurringIncomes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/income?recurring=true`, {
        withCredentials: true
      });
      setRecurringIncomes(response.data);
    } catch (error) {
      console.error("Error fetching recurring incomes:", error);
      toast.error("Failed to fetch recurring income data");
    }
  };

  const calculateTotals = () => {
    // Total income
    const total = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    setTotalIncome(total);
    
    // Current month income
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTotal = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    }).reduce((sum, income) => sum + parseFloat(income.amount), 0);
    setCurrentMonthIncome(monthlyTotal);
    
    // Income count
    setIncomeCount(incomes.length);
  };

  const handleAddIncome = async () => {
    try {
      // For organization type, calculate amount based on units and price per unit
      const payload = { ...newIncome };
      
      if (userType === "organization" && newIncome.units && newIncome.pricePerUnit) {
        payload.amount = (parseFloat(newIncome.units) * parseFloat(newIncome.pricePerUnit)).toString();
      }
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/income`, payload, {
        withCredentials: true
      });
      
      setIncomes([...incomes, response.data]);
      setNewIncome({
        title: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split('T')[0],
        units: "",
        pricePerUnit: "",
        source: "",
        notes: "",
        isRecurring: false
      });
      
      setIsAddModalOpen(false);
      toast.success("Income added successfully!");
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("Failed to add income");
    }
  };

  const handleAddRecurringIncome = async () => {
    try {
      const payload = { ...recurringIncome, isRecurring: true };
      
      // For organization type, calculate amount from units and price per unit
      if (userType === "organization" && recurringIncome.units && recurringIncome.pricePerUnit) {
        payload.amount = (parseFloat(recurringIncome.units) * parseFloat(recurringIncome.pricePerUnit)).toString();
      }
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/income`, payload, {
        withCredentials: true
      });
      
      setRecurringIncomes([...recurringIncomes, response.data]);
      setRecurringIncome({
        title: "",
        amount: "",
        category: "",
        frequency: "monthly",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        units: "",
        pricePerUnit: "",
        source: "",
        notes: ""
      });
      
      setIsRecurringModalOpen(false);
      toast.success("Recurring income added successfully!");
    } catch (error) {
      console.error("Error adding recurring income:", error);
      toast.error("Failed to add recurring income");
    }
  };

  const handleDeleteIncome = async (id, isRecurring) => {
    if (!window.confirm("Are you sure you want to delete this income?")) {
      return;
    }
    
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/income/${id}`, {
        withCredentials: true
      });
      
      if (isRecurring) {
        setRecurringIncomes(recurringIncomes.filter(income => income._id !== id));
      } else {
        setIncomes(incomes.filter(income => income._id !== id));
      }
      
      toast.success("Income deleted successfully!");
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income");
    }
  };

  const filteredIncomes = incomes.filter(income => {
    // Filter by search query
    const matchesSearch = income.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === "All Categories" || income.category === categoryFilter;
    
    // Filter by date range
    const incomeDate = new Date(income.date);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    const matchesDateRange = 
      (!fromDate || incomeDate >= fromDate) && 
      (!toDate || incomeDate <= toDate);
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Date", "Category", "Description", "Amount", "Source", "Notes"].join(",") + "\n" +
      filteredIncomes.map(income => {
        return [
          income.date,
          income.category,
          income.title,
          income.amount,
          income.source,
          income.notes
        ].join(",");
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "income_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button 
              onClick={() => window.history.back()} 
              className="text-blue-500 hover:text-blue-600 flex items-center"
            >
              <span className="mr-2">←</span> Back
            </button>
            <h1 className="text-3xl font-bold mt-2">Income Tracker</h1>
            <p className="text-gray-500">Manage and track your income</p>
          </div>
          <div className="flex items-center space-x-4">
          <div className="flex items-center mb-4">
  <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
    {userType === "individual" ? "Personal Mode" : "Organization Mode"}
  </span>
</div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <span className="mr-2">+</span> Add Income
            </button>
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Add Recurring
            </button>
            <button
              onClick={() => setIsRecurringListOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              View Recurring
            </button>
            <button
    onClick={toggleTheme}
    className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
  >
    {theme === "dark" ? "☀️" : "🌙"}
  </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-lg p-6 ${theme=== "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${theme=== "dark" ? "bg-blue-900" : "bg-blue-100"} mr-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Income</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-6 ${theme=== "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${theme=== "dark" ? "bg-green-900" : "bg-green-100"} mr-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold">{formatCurrency(currentMonthIncome)}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-6 ${theme=== "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${theme=== "dark" ? "bg-purple-900" : "bg-purple-100"} mr-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Income Entries</p>
                <p className="text-2xl font-semibold">{incomeCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-lg p-6 mb-8 ${theme=== "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <Input
                  type="text"
                  placeholder="Search incomes..."
                  className={`pl-10 ${theme=== "dark" ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={theme=== "dark" ? "bg-gray-700 border-gray-600 text-white" : ""}>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">From</label>
              <Input
                type="date"
                className={theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : ""}
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">To</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  className={theme=== "dark" ? "bg-gray-700 border-gray-600 text-white" : ""}
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
                <Button
                  onClick={exportData}
                  className={`${theme=== "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Income Table */}
        <div className={`rounded-lg overflow-hidden ${theme=== 'dark' ? "bg-gray-800" : "bg-white shadow"}`}>
          <table className="min-w-full divide-y divide-gray-700">
            <thead className={theme=== "dark" ? "bg-gray-900" : "bg-gray-100"}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                {userType === "organization" && (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Units</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price/Unit</th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme=== "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredIncomes.length > 0 ? (
                filteredIncomes.map((income) => (
                  <tr key={income._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateDDMMYYYY(new Date(income.date).toLocaleDateString())}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                        backgroundColor: getCategoryColor(income.category, theme),
                        color: 'white' 
                      }}>
                        {income.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{income.title}</td>
                    {userType === "organization" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{income.units || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{income.pricePerUnit ? formatCurrency(income.pricePerUnit) : "-"}</td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(income.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{income.source || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-blue-500 hover:text-blue-700 mr-3"
                        onClick={() => {
                          // Open edit modal with pre-filled data
                          setNewIncome(income);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteIncome(income._id, false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={userType === "organization" ? 8 : 6} className="px-6 py-4 text-center text-sm">
                    No income entries found. Add your first income by clicking "Add Income" button.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
              {/* Add Income Modal */}
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
  <DialogContent className={`p-6 max-h-[90vh] overflow-y-auto ${theme=== "dark" ? "bg-gray-900 text-white border-gray-800" : "bg-white text-black"}`}>
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">"Add Income"</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 my-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input
          type="text"
          placeholder={userType === "individual" ? "Salary, Freelance work, etc." : "Product sales, Service fees, etc."}
          className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
          value={newIncome.title}
          onChange={(e) => setNewIncome({ ...newIncome, title: e.target.value })}
        />
      </div>
      
      {userType === "individual" ? (
        <div>
          <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
          <Input
            type="number"
            placeholder="0.00"
            className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
            value={newIncome.amount}
            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Units</label>
            <Input
              type="number"
              placeholder="Quantity"
              className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={newIncome.units}
              onChange={(e) => setNewIncome({ ...newIncome, units: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Price per Unit (₹)</label>
            <Input
              type="number"
              placeholder="0.00"
              className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={newIncome.pricePerUnit}
              onChange={(e) => setNewIncome({ ...newIncome, pricePerUnit: e.target.value })}
            />
          </div>
          {newIncome.units && newIncome.pricePerUnit && (
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Total Amount (₹)</label>
              <Input
                type="text"
                readOnly
                className={`${theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""} cursor-not-allowed`}
                value={(parseFloat(newIncome.units) * parseFloat(newIncome.pricePerUnit)).toFixed(2)}
              />
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="text-sm font-medium mb-1 block">Category</label>
        <Select
          value={newIncome.category}
          onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}
        >
          <SelectTrigger className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Date</label>
        <Input
          type="date"
          className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
          value={newIncome.date}
          onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Source</label>
        <Select
          value={newIncome.source}
          onValueChange={(value) => setNewIncome({ ...newIncome, source: value })}
        >
          <SelectTrigger className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            <SelectValue placeholder="Select Source" />
          </SelectTrigger>
          <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
        <Input
          type="text"
          placeholder="Additional information"
          className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
          value={newIncome.notes}
          onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
        />
      </div>
    </div>

    <div className="flex justify-end space-x-4 mt-4">
      <DialogClose asChild>
        <Button variant="outline" className={theme === "dark" ? "bg-gray-600 hover:bg-red-700 text-white" : ""}>
          Cancel
        </Button>
      </DialogClose>
      <Button
        onClick={handleAddIncome}
        disabled={!newIncome.title || (userType === "individual" ? !newIncome.amount : (!newIncome.units || !newIncome.pricePerUnit)) || !newIncome.category}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {newIncome._id ? "Update" : "Save"} Income
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Add Recurring Income Modal */}
<Dialog open={isRecurringModalOpen} onOpenChange={setIsRecurringModalOpen}>
  <DialogContent className={`p-6 max-h-[90vh] overflow-y-auto ${theme=== "dark" ? "bg-gray-900 text-white border-gray-800" : "bg-white text-black"}`}>
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Add Recurring Income</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 my-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input
          type="text"
          placeholder={userType === "individual" ? "Salary, Rent Income, etc." : "Subscription Fees, Retainer Payments, etc."}
          className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
          value={recurringIncome.title}
          onChange={(e) => setRecurringIncome({ ...recurringIncome, title: e.target.value })}
        />
      </div>
      
      {userType === "individual" ? (
        <div>
          <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
          <Input
            type="number"
            placeholder="0.00"
            className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
            value={recurringIncome.amount}
            onChange={(e) => setRecurringIncome({ ...recurringIncome, amount: e.target.value })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Units</label>
            <Input
              type="number"
              placeholder="Quantity"
              className={theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={recurringIncome.units}
              onChange={(e) => setRecurringIncome({ ...recurringIncome, units: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Price per Unit (₹)</label>
            <Input
              type="number"
              placeholder="0.00"
              className={theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={recurringIncome.pricePerUnit}
              onChange={(e) => setRecurringIncome({ ...recurringIncome, pricePerUnit: e.target.value })}
            />
          </div>
          {recurringIncome.units && recurringIncome.pricePerUnit && (
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Total Amount (₹)</label>
              <Input
                type="text"
                readOnly
                className={`${theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""} cursor-not-allowed`}
                value={(parseFloat(recurringIncome.units) * parseFloat(recurringIncome.pricePerUnit)).toFixed(2)}
              />
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="text-sm font-medium mb-1 block">Category</label>
        <Select
          value={recurringIncome.category}
          onValueChange={(value) => setRecurringIncome({ ...recurringIncome, category: value })}
        >
          <SelectTrigger className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            {recurringCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Frequency</label>
        <Select
          value={recurringIncome.frequency}
          onValueChange={(value) => setRecurringIncome({ ...recurringIncome, frequency: value })}
        >
          <SelectTrigger className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            <SelectValue placeholder="Select Frequency" />
          </SelectTrigger>
          <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            {frequencies.map((freq) => (
              <SelectItem key={freq} value={freq}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Start Date</label>
          <Input
            type="date"
            className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
            value={recurringIncome.startDate}
            onChange={(e) => setRecurringIncome({ ...recurringIncome, startDate: e.target.value })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">End Date (Optional)</label>
          <Input
            type="date"
            className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
            value={recurringIncome.endDate}
            onChange={(e) => setRecurringIncome({ ...recurringIncome, endDate: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Source</label>
        <Select
          value={recurringIncome.source}
          onValueChange={(value) => setRecurringIncome({ ...recurringIncome, source: value })}
        >
          <SelectTrigger className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            <SelectValue placeholder="Select Source" />
          </SelectTrigger>
          <SelectContent className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
        <Input
          type="text"
          placeholder="Contract ID, reference, etc."
          className={theme=== "dark" ? "bg-gray-800 border-gray-700 text-white" : ""}
          value={recurringIncome.notes}
          onChange={(e) => setRecurringIncome({ ...recurringIncome, notes: e.target.value })}
        />
      </div>
    </div>

    <div className="flex justify-end space-x-4 mt-4">
      <DialogClose asChild>
        <Button variant="outline" className={theme=== "dark" ? "bg-gray-600 hover:bg-red-700 text-white" : ""}>
          Cancel
        </Button>
      </DialogClose>
      <Button
        onClick={handleAddRecurringIncome}
        disabled={!recurringIncome.title || (userType === "individual" ? !recurringIncome.amount : (!recurringIncome.units || !recurringIncome.pricePerUnit)) || !recurringIncome.category || !recurringIncome.startDate}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Save Recurring Income
      </Button>
    </div>
  </DialogContent>
</Dialog>

      {/* View Recurring Incomes Modal */}
      <Dialog open={isRecurringListOpen} onOpenChange={setIsRecurringListOpen}>
  <DialogContent className={`p-6 max-w-4xl ${theme === "dark" ? "bg-gray-900 text-white border-gray-800" : "bg-white text-black"}`}>
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Recurring Incomes</DialogTitle>
    </DialogHeader>

    <div className="mt-4">
      {recurringIncomes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className={theme=== "dark" ? "bg-gray-800" : "bg-gray-100"}>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Frequency</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Next Date</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {recurringIncomes.map((income) => (
                <tr key={income._id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{income.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                      backgroundColor: getCategoryColor(income.category, theme),
                      color: 'white' 
                    }}>
                      {income.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(income.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">{income.frequency}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{getNextOccurrenceDate(income.startDate, income.frequency)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-500 hover:text-blue-700 mr-3"
                      onClick={() => {
                        // Set the income to edit
                        setNewIncome({
                          ...income,
                          date: income.startDate ? new Date(income.startDate).toISOString().split('T')[0] : '',
                          isRecurring: true,
                        });
                        // Open edit modal and close the recurring list
                        setIsEditModalOpen(true);
                        setIsRecurringListOpen(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        handleDeleteIncome(income._id, true);
                        if (recurringIncomes.length === 1) {
                          setIsRecurringListOpen(false);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">No recurring incomes found. Add your first recurring income.</p>
        </div>
      )}
    </div>

    <div className="flex justify-end mt-4">
      <DialogClose asChild>
        <Button className={theme==="dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : ""}>
          Close
        </Button>
      </DialogClose>
    </div>
  </DialogContent>
</Dialog>
<EditIncomeModal
  isEditModalOpen={isEditModalOpen}
  setIsEditModalOpen={setIsEditModalOpen}
  newIncome={newIncome}
  setNewIncome={setNewIncome}
  userType={userType}
  theme={theme}
  categories={categories}
  sources={sources}
  incomes={incomes}
  setIncomes={setIncomes}
  recurringIncomes={recurringIncomes}
  setRecurringIncomes={setRecurringIncomes}
/>
    </div>
    
  );
};

// Helper functions
const getCategoryColor = (category, theme) => {
  const colors = {
    "Salary": "#4299E1",
    "Freelance": "#9F7AEA",
    "Investment": "#48BB78",
    "Business": "#ED8936",
    "Gift": "#F687B3",
    "Refund": "#A0AEC0",
    "Sale": "#F56565",
    "Rental": "#ECC94B",
    "Other": "#718096"
  };

  return colors[category] || (theme ? "#4A5568" : "#CBD5E0");
};

const getNextOccurrenceDate = (startDate, frequency) => {
  const start = new Date(startDate);
  const today = new Date();
  
  // If start date is in the future, that's the next occurrence
  if (start > today) {
    return start.toLocaleDateString();
  }
  
  // Calculate next occurrence based on frequency
  const nextDate = new Date(start);
  
  while (nextDate <= today) {
    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "annually":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  
  return formatDateDDMMYYYY(nextDate.toLocaleDateString());
};
function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return "Invalid date";
  }
  
  // Get day, month, and year
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = d.getFullYear();
  
  // Return in DD/MM/YYYY format
  return `${day}/${month}/${year}`;
}

export default IncomePage;