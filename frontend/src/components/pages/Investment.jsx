import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import axios from 'axios';

const InvestmentsPage = () => {
  const [theme, setTheme] = useState('light');
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'stock',
    date: '',
    notes: ''
  });

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Fetch investments
  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/investments');
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/investments', formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        amount: '',
        type: 'stock',
        date: '',
        notes: ''
      });
      fetchInvestments();
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleEditInvestment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/investments/${currentInvestment.id}`, formData);
      setIsEditModalOpen(false);
      fetchInvestments();
    } catch (error) {
      console.error('Error updating investment:', error);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await axios.delete(`http://localhost:8000/api/investments/${id}`);
        fetchInvestments();
      } catch (error) {
        console.error('Error deleting investment:', error);
      }
    }
  };

  const openEditModal = (investment) => {
    setCurrentInvestment(investment);
    setFormData({
      name: investment.name,
      amount: investment.amount,
      type: investment.type,
      date: investment.date,
      notes: investment.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const getInvestmentTypeIcon = (type) => {
    switch (type) {
      case 'stock':
        return <TrendingUp className="text-blue-500" />;
      case 'crypto':
        return <RefreshCw className="text-purple-500" />;
      case 'real_estate':
        return <TrendingUp className="text-green-500" />;
      default:
        return <TrendingUp className="text-gray-500" />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`px-4 py-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className="h-6 w-6" />
            </a>
            <h1 className="text-2xl font-bold">Investments</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            <Plus className="h-5 w-5" />
            <span>Add Investment</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : investments.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
            <h3 className="text-xl font-medium mb-2">No investments found</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Start tracking your investments by adding your first one.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              <Plus className="h-5 w-5" />
              <span>Add Investment</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investments.map((investment) => (
              <div 
                key={investment.id}
                className={`relative rounded-lg shadow-sm p-6 ${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } transition-all duration-200 group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getInvestmentTypeIcon(investment.type)}
                    <h3 className="text-lg font-medium">{investment.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(investment)}
                      className={`p-1 rounded ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteInvestment(investment.id)}
                      className={`p-1 rounded ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                      } text-red-500`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className={`mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  {new Date(investment.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-2xl font-bold mb-2">
                  ${Number(investment.amount).toLocaleString()}
                </div>
                {investment.notes && (
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {investment.notes}
                  </p>
                )}
                <div className={`text-xs uppercase mt-4 inline-block px-2 py-1 rounded ${
                  investment.type === 'stock' ? 'bg-blue-100 text-blue-800' :
                  investment.type === 'crypto' ? 'bg-purple-100 text-purple-800' :
                  investment.type === 'real_estate' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {investment.type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Investment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Add New Investment</h2>
            <form onSubmit={handleAddInvestment}>
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                  placeholder="e.g., Apple Stock, Bitcoin"
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                  placeholder="e.g., 5000"
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors`}
                >
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Edit Investment</h2>
            <form onSubmit={handleEditInvestment}>
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors`}
                >
                  Update Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;