import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  ClipboardIcon, 
  EnvelopeIcon, 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  BanknotesIcon
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

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

  // Recurring Expenses State
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseDialogMode, setExpenseDialogMode] = useState('add'); // 'add', 'edit', 'delete'
  const [currentExpense, setCurrentExpense] = useState({
    title: '',
    amount: '',
    category: 'Utilities',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    paymentMethod: 'upi',
    notes: '',
    active: true
  });
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Categories and frequencies for selects
  const categories = [
    "Rent", "Phone", "Internet", "Utilities", "Subscriptions", 
    "Insurance", "Loan", "Taxes", "Equipment", "Maintenance", 
    "Services", "Payroll", "Other"
  ];

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "custom", label: "Custom" }
  ];

  const paymentMethods = [
    { value: "upi", label: "UPI" },
    { value: "credit card", label: "Credit Card" },
    { value: "debit card", label: "Debit Card" },
    { value: "net banking", label: "Net Banking" },
    { value: "cash", label: "Cash" },
    { value: "auto debit", label: "Auto Debit" },
    { value: "bank transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
    { value: "invoice", label: "Invoice" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userResponse = await axios.get("http://localhost:8000/api/users/profile", {
          withCredentials: true,
        });
        setUser(userResponse.data.user);
        
        // Fetching invite links only for organization admins
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

        // Fetch recurring expenses
        await fetchRecurringExpenses();
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const fetchRecurringExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const response = await axios.get("http://localhost:8000/api/recExpense/get", {
        withCredentials: true,
      });
      setRecurringExpenses(response.data.data || []);
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
    } finally {
      setLoadingExpenses(false);
    }
  };

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
      const emailList = emails
        .split(/[,;\s\n]+/)
        .map(email => email.trim())
        .filter(email => email);
  
      if (emailList.length === 0) {
        alert("Please enter valid email addresses.");
        return;
      }
  
      await axios.post("http://localhost:8000/api/organizations/invite", {
        emails: emailList.join(","),
        inviteLink: currentInviteLink,
      });
  
      alert("Invitations sent successfully!");
      setShowModal(false);
      setEmails("");
      setCurrentInviteLink("");
    } catch (error) {
      console.error("Error sending invites:", error);
      alert("Failed to send invitations.");
    }
  };

  // Recurring Expense Functions
  const openAddExpenseDialog = () => {
    setCurrentExpense({
      title: '',
      amount: '',
      category: 'Utilities',
      frequency: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      paymentMethod: 'upi',
      notes: '',
      active: true
    });
    setExpenseDialogMode('add');
    setShowExpenseDialog(true);
  };

  const openEditExpenseDialog = (expense) => {
    // Format dates for the input fields
    const formattedExpense = {
      ...expense,
      startDate: format(new Date(expense.startDate), 'yyyy-MM-dd'),
      endDate: expense.endDate ? format(new Date(expense.endDate), 'yyyy-MM-dd') : ''
    };
    setCurrentExpense(formattedExpense);
    setExpenseDialogMode('edit');
    setShowExpenseDialog(true);
  };

  const openDeleteExpenseDialog = (expense) => {
    setCurrentExpense(expense);
    setExpenseDialogMode('delete');
    setShowExpenseDialog(true);
  };

  const handleExpenseChange = (field, value) => {
    setCurrentExpense(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseSubmit = async () => {
    try {
      if (expenseDialogMode === 'add') {
        await axios.post("http://localhost:8000/api/recExpense/add", currentExpense, {
          withCredentials: true
        });
      } else if (expenseDialogMode === 'edit') {
        await axios.put(`http://localhost:8000/api/recExpense/update/${currentExpense._id}`, currentExpense, {
          withCredentials: true
        });
      } else if (expenseDialogMode === 'delete') {
        await axios.delete(`http://localhost:8000/api/recExpense/delete/${currentExpense._id}`, {
          withCredentials: true
        });
      }
      
      await fetchRecurringExpenses();
      setShowExpenseDialog(false);
    } catch (error) {
      console.error(`Error ${expenseDialogMode === 'add' ? 'adding' : expenseDialogMode === 'edit' ? 'updating' : 'deleting'} expense:`, error);
      alert(`Failed to ${expenseDialogMode === 'add' ? 'add' : expenseDialogMode === 'edit' ? 'update' : 'delete'} recurring expense.`);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy');
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

          {/* Recurring Expenses Section */}
          <div className={clsx(
            "mt-8 p-6 rounded-xl",
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
          )}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={clsx(
                "text-xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>Recurring Expenses</h3>
              <button
                onClick={openAddExpenseDialog}
                className={clsx(
                  "p-2 rounded-lg flex items-center transition-colors",
                  isDarkMode 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                <span>Add New</span>
              </button>
            </div>

            {loadingExpenses ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : recurringExpenses.length === 0 ? (
              <div className={clsx(
                "text-center py-8",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <p>No recurring expenses set up yet.</p>
                <p className="mt-2">Add your first recurring expense to keep track of your regular payments.</p>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {recurringExpenses.map((expense) => (
                  <div key={expense._id} className={clsx(
                    "p-4 rounded-lg",
                    isDarkMode ? "bg-gray-800" : "bg-white",
                    "shadow"
                  )}>
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <div className={clsx(
                          "p-2 rounded-lg mr-3",
                          isDarkMode ? "bg-gray-700" : "bg-indigo-50"
                        )}>
                          <BanknotesIcon className={clsx(
                            "h-5 w-5",
                            isDarkMode ? "text-indigo-400" : "text-indigo-600"
                          )} />
                        </div>
                        <div>
                          <h4 className={clsx(
                            "font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                          )}>{expense.title}</h4>
                          <div className="flex flex-wrap gap-x-4 mt-1">
                            <p className={clsx(
                              "text-sm",
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Amount:</span> {formatCurrency(expense.amount)}
                            </p>
                            <p className={clsx(
                              "text-sm",
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Frequency:</span> {expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)}
                            </p>
                            <p className={clsx(
                              "text-sm",
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Category:</span> {expense.category}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-4 mt-1">
                            <p className={clsx(
                              "text-sm",
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Started:</span> {formatDate(expense.startDate)}
                            </p>
                            {expense.endDate && (
                              <p className={clsx(
                                "text-sm",
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              )}>
                                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Next Due:</span> {formatDate(expense.endDate)}
                              </p>
                            )}
                          </div>
                          {expense.notes && (
                            <p className={clsx(
                              "text-sm mt-2",
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            )}>
                              {expense.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 items-start">
  <button
    onClick={() => openEditExpenseDialog(expense)}
    className={clsx(
      "p-1 rounded-lg", // smaller overall padding
      isDarkMode 
        ? "bg-gray-700 hover:bg-gray-600 text-blue-400" 
        : "bg-gray-100 hover:bg-gray-200 text-indigo-600"
    )}
  >
    <PencilIcon className="h-5 w-5" /> {/* smaller icon */}
  </button>
  <button
    onClick={() => openDeleteExpenseDialog(expense)}
    className={clsx(
      "p-1 rounded-lg", // smaller overall padding
      isDarkMode 
        ? "bg-gray-700 hover:bg-gray-600 text-red-400" 
        : "bg-gray-100 hover:bg-gray-200 text-red-600"
    )}
  >
    <TrashIcon className="h-5 w-5" /> {/* smaller icon */}
  </button>
</div>
                    </div>
                    <div className={clsx(
                      "mt-3 py-1 px-2 rounded text-xs inline-block",
                      expense.active
                        ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                        : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                    )}>
                      {expense.active ? "Active" : "Inactive"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className={clsx(
          isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900"
        )}>
          <DialogHeader>
            <DialogTitle>
              {expenseDialogMode === 'add' 
                ? 'Add Recurring Expense' 
                : expenseDialogMode === 'edit' 
                  ? 'Edit Recurring Expense' 
                  : 'Delete Recurring Expense'}
            </DialogTitle>
          </DialogHeader>
          
          {expenseDialogMode === 'delete' ? (
            <div className="py-4">
              <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Are you sure you want to delete the recurring expense "{currentExpense.title}"?
              </p>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Title
                  </label>
                  <Input
                    value={currentExpense.title}
                    onChange={(e) => handleExpenseChange('title', e.target.value)}
                    placeholder="Enter expense title"
                    className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Amount
                  </label>
                  <Input
                    type="number"
                    value={currentExpense.amount}
                    onChange={(e) => handleExpenseChange('amount', e.target.value)}
                    placeholder="Enter amount"
                    className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Category
                    </label>
                  <Select
                    value={currentExpense.category}
                    onValueChange={(value) => handleExpenseChange('category', value)}
                  >
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Frequency
                  </label>
                  <Select
                    value={currentExpense.frequency}
                    onValueChange={(value) => handleExpenseChange('frequency', value)}
                  >
                    <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className={clsx(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )} />
                    <Input
                      type="date"
                      value={currentExpense.startDate}
                      onChange={(e) => handleExpenseChange('startDate', e.target.value)}
                      className={clsx(
                        "pl-10",
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    End Date (Optional)
                  </label>
                  <div className="relative">
                    <CalendarIcon className={clsx(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )} />
                    <Input
                      type="date"
                      value={currentExpense.endDate}
                      onChange={(e) => handleExpenseChange('endDate', e.target.value)}
                      className={clsx(
                        "pl-10",
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={clsx(
                  "text-sm font-medium",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Payment Method
                </label>
                <Select
                  value={currentExpense.paymentMethod}
                  onValueChange={(value) => handleExpenseChange('paymentMethod', value)}
                >
                  <SelectTrigger className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className={clsx(
                  "text-sm font-medium",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Notes (Optional)
                </label>
                <Textarea
                  value={currentExpense.notes}
                  onChange={(e) => handleExpenseChange('notes', e.target.value)}
                  placeholder="Add any additional notes"
                  className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={currentExpense.active}
                  onChange={(e) => handleExpenseChange('active', e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="active"
                  className={clsx(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  Active
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExpenseDialog(false)}
              className={isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExpenseSubmit}
              className={clsx(
                expenseDialogMode === 'delete' ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700",
                "text-white"
              )}
            >
              {expenseDialogMode === 'add' 
                ? 'Add Expense' 
                : expenseDialogMode === 'edit' 
                  ? 'Save Changes' 
                  : 'Delete Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilePage;