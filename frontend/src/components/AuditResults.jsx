import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AuditPDF from './AuditPDF';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';

const AuditResults = ({ data, parameters, purpose, userType }) => {
  const [emailTo, setEmailTo] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!data) return null;
  
  const { summary, incomeAnalysis, expenseAnalysis, budgetAnalysis, investmentAnalysis, findings, recommendations } = data;

  const sendEmail = async () => {
    if (!emailTo) {
      setError('Please enter an email address');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('/api/audit/email', {
        to: emailTo,
        auditData: data,
        parameters,
        purpose
      }, { withCredentials: true });
      
      setEmailSent(true);
      setError(null);
    } catch (err) {
      setError('Failed to send email. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === "NaN") return 'N/A';
    return typeof value === 'string' ? value : `${value.toFixed(2)}%`;
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{userType === 'personal' ? 'Personal' : 'Organizational'} Financial Audit</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="text-yellow-300" size={20} />
            ) : (
              <Moon className="text-gray-600" size={20} />
            )}
          </button>
          
          <div className="flex space-x-2">
            <PDFDownloadLink
              document={<AuditPDF data={data} parameters={parameters} purpose={purpose} userType={userType} />}
              fileName="financial_audit_report.pdf"
              className={`${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded inline-flex items-center`}
            >
              {({ loading }) => loading ? 'Preparing PDF...' : 'Download PDF'}
            </PDFDownloadLink>
            
            <div className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Email address"
                className={`p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <button
                onClick={sendEmail}
                disabled={loading}
                className={`${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
              >
                {loading ? 'Sending...' : 'Email Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-800' : 'bg-red-100 border-red-400'} border text-red-700 px-4 py-3 rounded mb-4`}>
          {error}
        </div>
      )}
      
      {emailSent && (
        <div className={`${theme === 'dark' ? 'bg-green-900 border-green-800 text-green-300' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded mb-4`}>
          Audit report has been sent to {emailTo}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{summary}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Income Analysis Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded`}>
          <h3 className="text-lg font-semibold mb-3">Income Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Income:</span>
              <span>{formatCurrency(incomeAnalysis?.totalIncome || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Largest Source:</span>
              <span>{incomeAnalysis?.largestSource || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Income Streams:</span>
              <span>{incomeAnalysis?.incomeStreams || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Average Income Per Stream:</span>
              <span>{formatCurrency(incomeAnalysis?.averageIncomePerStream || 0)}</span>
            </div>
            
            {incomeAnalysis?.categoryBreakdown && incomeAnalysis.categoryBreakdown.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium mb-2">Category Breakdown</h4>
                <ul className="list-disc pl-5">
                  {incomeAnalysis.categoryBreakdown.map((item, index) => (
                    <li key={index}>
                      {item.category}: {formatCurrency(item.amount)} ({formatPercentage(item.percentage)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Expense Analysis Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded`}>
          <h3 className="text-lg font-semibold mb-3">Expense Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Expenses:</span>
              <span>{formatCurrency(expenseAnalysis?.totalExpenses || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Largest Category:</span>
              <span>{expenseAnalysis?.largestExpenseCategory || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Expense Count:</span>
              <span>{expenseAnalysis?.expenseCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Monthly Average:</span>
              <span>{formatCurrency(expenseAnalysis?.monthlyAverage || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Essential Spending:</span>
              <span>{formatCurrency(expenseAnalysis?.essentialSpending || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Discretionary Spending:</span>
              <span>{formatCurrency(expenseAnalysis?.discretionarySpending || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Discretionary %:</span>
              <span>{formatPercentage(expenseAnalysis?.discretionaryPercentage)}</span>
            </div>
            
            {expenseAnalysis?.categoryBreakdown && expenseAnalysis.categoryBreakdown.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium mb-2">Category Breakdown</h4>
                <ul className="list-disc pl-5">
                  {expenseAnalysis.categoryBreakdown.map((item, index) => (
                    <li key={index}>
                      {item.category}: {formatCurrency(item.amount)} ({formatPercentage(item.percentage)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Budget Analysis Section - if available */}
      {budgetAnalysis && (
        <div className={`mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded`}>
          <h3 className="text-lg font-semibold mb-2">Budget Compliance Analysis</h3>
          <div className="space-y-2">
            {/* Add structured view of budget analysis here when data model is known */}
            <pre className={`whitespace-pre-wrap overflow-auto text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {JSON.stringify(budgetAnalysis, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Investment Analysis Section */}
      {investmentAnalysis && (
        <div className={`mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded`}>
          <h3 className="text-lg font-semibold mb-3">Investment Performance Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Invested:</span>
              <span>{formatCurrency(investmentAnalysis?.totalInvested || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Investments:</span>
              <span>{investmentAnalysis?.totalInvestmentCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Average Investment Size:</span>
              <span>{formatCurrency(investmentAnalysis?.averageInvestmentSize || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Investment Types:</span>
              <span>{investmentAnalysis?.investmentTypes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Diversification Score:</span>
              <span>{investmentAnalysis?.diversificationScore || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Largest Asset Class:</span>
              <span>{investmentAnalysis?.largestAssetClass || 'None'}</span>
            </div>
            
            {investmentAnalysis?.assetAllocation && investmentAnalysis.assetAllocation.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium mb-2">Asset Allocation</h4>
                <ul className="list-disc pl-5">
                  {investmentAnalysis.assetAllocation.map((item, index) => (
                    <li key={index}>
                      {item.type}: {formatCurrency(item.amount)} ({formatPercentage(item.percentage)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Key Findings Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Key Findings</h3>
        <ul className="list-disc pl-5 space-y-1">
          {findings && findings.length > 0 ? (
            findings.map((finding, index) => (
              <li key={index} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{finding}</li>
            ))
          ) : (
            <li className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>No significant findings</li>
          )}
        </ul>
      </div>
      
      {/* Recommendations Section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
        <ul className="list-disc pl-5 space-y-1">
          {recommendations && recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <li key={index} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{rec}</li>
            ))
          ) : (
            <li className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>No recommendations at this time</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AuditResults;