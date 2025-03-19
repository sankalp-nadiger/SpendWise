import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, DollarSign } from "lucide-react";
import axios from 'axios'
import { BarChart3, PieChart, FileText, Bot, Plus, Home, Settings, CreditCard, TrendingUp, Calendar, ExternalLink, Zap, LogOut } from "lucide-react";

const MainPage = () => {
  const navigate = useNavigate();

  // Apply theme from localStorage
  const isDarkMode = localStorage.getItem("theme") === "dark";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expense, setExpense] = useState({ title: "", amount: "", category: "" });
  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Other"];
  
  // State for market data and news
  const [marketData, setMarketData] = useState([]);
  const [financialNews, setFinancialNews] = useState([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  // Fetch market data
 // Financial News with Indian Sources
useEffect(() => {
    const fetchFinancialNews = async () => {
      try {
        setIsLoadingNews(true);
        // You can use NewsAPI, Finnhub News, or other news API providers
        // Make sure to specify Indian news sources or add a query parameter for Indian financial news
        const response = await fetch('https://markets-api.ndtv.com/financial-news', {
            headers: {
              'Accept': 'application/json'
              // Add any required authentication headers if needed
            }
          });
        
        if (!response.ok) throw new Error('News data fetch failed');
        
        const data = await response.json();
        
        // Format the data for your UI
        const formattedNews = data.articles?.slice(0, 4).map(article => ({
          title: article.title,
          source: article.source.name,
          time: formatNewsTime(new Date(article.publishedAt)),
          url: article.url
        })) || [];
        
        setFinancialNews(formattedNews);
      } catch (error) {
        console.error("Error fetching Indian financial news:", error);
        // Fallback to sample Indian financial news if API fails
        setFinancialNews([
          {
            title: "RBI Holds Key Interest Rates Steady in Latest Policy Meeting",
            source: "Economic Times",
            time: "2 hours ago",
            url: "#"
          },
          {
            title: "Sensex Crosses 77,000 Mark for First Time on FII Inflows",
            source: "Business Standard",
            time: "4 hours ago",
            url: "#"
          },
          {
            title: "IT Sector Leads Indian Market Rally After Strong Global Tech Earnings",
            source: "Mint",
            time: "Yesterday",
            url: "#"
          },
          {
            title: "Rupee Gains Against Dollar as Foreign Investments Rise",
            source: "Financial Express",
            time: "Yesterday",
            url: "#"
          }
        ]);
      } finally {
        setIsLoadingNews(false);
      }
    };

    // Helper function to format time as "X hours ago" or "Yesterday"
    const formatNewsTime = (publishDate) => {
      const now = new Date();
      const diffHours = Math.floor((now - publishDate) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffHours < 48) return 'Yesterday';
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(publishDate);
    };

    fetchFinancialNews();
    
    // Set up polling to refresh news (e.g., every 30 minutes)
    const intervalId = setInterval(fetchFinancialNews, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

// Market Data with Indian Markets
useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoadingMarket(true);
        // You can use Alpha Vantage, Yahoo Finance API, or other financial data providers
        // Make sure to request Indian market indices like Sensex and Nifty
        async function fetchMarketData() {
            try {
              const response = await fetch('https://cors-anywhere.herokuapp.com/https://www.nseindia.com/api/marketStatus', {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                  'Referer': 'https://www.nseindia.com/'
                }
              });
          
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
          
              const data = await response.json(); // Await the JSON response
              console.log("Market Data:", data);
            } catch (error) {
              console.error('Error fetching Indian market data:', error);
            }
          }
          
          fetchMarketData();
          
     
          
        // if (!response.ok) throw new Error('Market data fetch failed');
        
        
        // Format the data for your UI with Indian market indices
        const formattedData = [
          {
            index: "SENSEX",
            value: data.sensex?.price || "N/A",
            change: data.sensex?.percentChange || "N/A",
            trending: parseFloat(data.sensex?.percentChange) > 0 ? "up" : "down"
          },
          {
            index: "NIFTY 50",
            value: data.nifty?.price || "N/A",
            change: data.nifty?.percentChange || "N/A",
            trending: parseFloat(data.nifty?.percentChange) > 0 ? "up" : "down"
          },
          {
            index: "BSE SmallCap",
            value: data.bseSmallcap?.price || "N/A",
            change: data.bseSmallcap?.percentChange || "N/A",
            trending: parseFloat(data.bseSmallcap?.percentChange) > 0 ? "up" : "down"
          },
          {
            index: "INR/USD",
            value: data.inrUsd?.price || "N/A",
            change: data.inrUsd?.percentChange || "N/A",
            trending: parseFloat(data.inrUsd?.percentChange) < 0 ? "up" : "down" // Inverted for currency (lower is better)
          }
        ];
        
        setMarketData(formattedData);
        
        // Update last updated timestamp with IST (Indian Standard Time)
        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istHours = now.getUTCHours() + 5;
        const istMinutes = now.getUTCMinutes() + 30;
        const adjustedHours = (istHours + Math.floor(istMinutes / 60)) % 24;
        const adjustedMinutes = istMinutes % 60;
        
        setLastUpdated(`Today, ${adjustedHours}:${adjustedMinutes.toString().padStart(2, '0')} ${adjustedHours >= 12 ? 'PM' : 'AM'} IST`);
      } catch (error) {
        console.error("Error fetching Indian market data:", error);
        // Fallback to sample Indian market data if API fails
        setMarketData([
          { index: "SENSEX", value: "77,234.12", change: "+0.78%", trending: "up" },
          { index: "NIFTY 50", value: "23,457.68", change: "+0.65%", trending: "up" },
          { index: "BSE SmallCap", value: "48,926.35", change: "-0.31%", trending: "down" },
          { index: "INR/USD", value: "₹82.45", change: "-0.12%", trending: "up" },
        ]);
      } finally {
        setIsLoadingMarket(false);
      }
    };

    fetchMarketData();
    
    // Set up polling to refresh data (e.g., every 5 minutes)
    const intervalId = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  const handleAddExpense = async () => {
    if (!expense.title || !expense.amount || !expense.category) return;
  
    try {
      const response = await fetch("http://localhost:8000/api/expense/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Ensures cookies are sent with the request
        body: JSON.stringify(expense),
      });
      
  
      if (response.ok) {
        const data = await response.json();
        console.log("Expense Added:", data);
  
        // Close modal and reset form
        setIsModalOpen(false);
        setExpense({ title: "", amount: "", category: "" });
      } else {
        console.error("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };
  
  // Left sidebar navigation items
  const leftNavItems = [
    { icon: <Home size={20} />, label: "Home", action: () => navigate("/") },
    { icon: <BarChart3 size={20} />, label: "Dashboard", action: () => navigate("/dashboard") },
    { icon: <FileText size={20} />, label: "Reports", action: () => navigate("/reports") },
    { icon: <Bot size={20} />, label: "AI Insights", action: () => navigate("/ai-insights") },
    { icon: <CreditCard size={20} />, label: "Expenses", action: () => navigate("/expense") },
  ];

  // Right sidebar items
  const rightNavItems = [
    { icon: <TrendingUp size={20} />, label: "Investments", action: () => navigate("/investment") },
    { icon: <Calendar size={20} />, label: "Budget Calendar", action: () => navigate("/budget") },
    { icon: <Settings size={20} />, label: "Settings", action: () => navigate("/profile") },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Main layout with sidebars */}
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className={`w-16 md:w-64 p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"} border-r shadow-sm flex flex-col`}>
  <div className="hidden md:flex flex-col items-center mb-4">
    {/* Title with $ as S */}
    <h2 className={`font-bold text sm:text flex items-center gap-0 whitespace-nowrap ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
      <span className="flex items-center">
        <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-500'}`} strokeWidth={2.5} />
      </span>
      <span className="tracking-tight">mart Money Management</span>
    </h2>

    {/* Access text centered with arrow */}
    <div className="flex flex-col items-center">
      <p className="text-sm text-gray-500">Access here</p>
      <ArrowDown className="text-gray-500 w-4 h-4 mt-1" />
    </div>
  </div>

  <Separator className="mb-4" /> 
          
          <nav className="space-y-2 flex-1">
            {leftNavItems.map((item, index) => (
              <TooltipProvider key={index} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={item.action}
                      className={`w-full flex items-center p-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 ${
                        isDarkMode ? "hover:bg-gray-800" : ""
                      } transition-colors`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="md:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
          <div className="mt-auto">
          <Button
  onClick={async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/users/logout",
        {},
        { withCredentials: true }
      );
      
      if (response.status === 200) {
        window.location.href = '/';
        console.log("Logged out successfully");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }    
  }}
  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
>
  <LogOut size={18} />
  <span className="hidden md:inline">Logout</span>
</Button>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className={`relative p-10 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} shadow-sm overflow-hidden transition-colors duration-300`}>
      {/* Background Elements - Adjusted for better dark/light mode visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-indigo-500/30 to-cyan-400/30 dark:from-blue-900/40 dark:via-indigo-800/40 dark:to-cyan-700/40 blur-2xl"></div>
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-blue-400 dark:bg-blue-600 opacity-30 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-cyan-300 dark:bg-cyan-500 opacity-30 blur-3xl rounded-full animate-pulse"></div>
             {/* Left Rupee Icon */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden md:block">
        <div className={`text-4xl font-bold ${isDarkMode ? "text-blue-400/40" : "text-blue-500/30"}`}>
          ₹
        </div>
        <div className={`text-6xl font-bold mt-4 ${isDarkMode ? "text-cyan-400/40" : "text-cyan-500/30"}`}>
          ₹
        </div>
        <div className={`text-3xl font-bold mt-4 ${isDarkMode ? "text-indigo-400/40" : "text-indigo-500/30"}`}>
          ₹
        </div>
      </div>

      {/* Right Rupee Icon */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <div className={`text-3xl font-bold ${isDarkMode ? "text-indigo-400/40" : "text-indigo-500/30"}`}>
          ₹
        </div>
        <div className={`text-6xl font-bold mt-4 ${isDarkMode ? "text-blue-400/40" : "text-blue-500/30"}`}>
          ₹
        </div>
        <div className={`text-4xl font-bold mt-4 ${isDarkMode ? "text-cyan-400/40" : "text-cyan-500/30"}`}>
          ₹
        </div>
      </div>
      {/* Content - Adjusted text colors for better contrast in both modes */}
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent tracking-wide drop-shadow-md">
          SpendWise
        </h1>
        <p className={`text-lg mt-3 font-medium tracking-wide ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Your intelligent financial companion
        </p>
      </div>
    </header>


          {/* Dashboard Content */}
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
                            
              {/* Market Trends and Financial News Section */}
              <div className="mt-8 mb-8">
                <Tabs defaultValue="market" className="w-full">
                  <div className="flex justify-center items-center mb-4">
                  <TabsList className="p-1">
          <TabsTrigger value="market" className="px-6 py-3 text-lg font-medium">Market Trends</TabsTrigger>
          <TabsTrigger value="news" className="px-6 py-3 text-lg font-medium">Financial News</TabsTrigger>
        </TabsList>
                  </div>
                  
                  <TabsContent value="market" className="mt-0">
                    <Card className={`${isDarkMode ? "bg-gray-900 border-gray-800" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Market Trends</CardTitle>
                          <p className="text-xs text-gray-500">
                            {isLoadingMarket ? "Updating..." : `Last updated: ${lastUpdated}`}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingMarket ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {marketData.map((item, index) => (
                              <div key={index} className="text-center p-4 rounded-lg border">
                                <p className="text-sm text-gray-500">{item.index}</p>
                                <p className="text-xl font-bold">{item.value}</p>
                                <p className={`text-sm ${item.trending === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                  {item.trending === 'up' ? '↑' : '↓'} {item.change}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 ml-auto"
                          onClick={() => window.open("https://finance.yahoo.com", "_blank")}
                        >
                          <ExternalLink size={16} className="mr-1" /> More Market Data
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="news" className="mt-0">
                    <Card className={`${isDarkMode ? "bg-gray-900 border-gray-800" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Financial News</CardTitle>
                          <Button variant="outline" size="sm" className={`text-xs ${isDarkMode ? "bg-blue-700" : ""}`}>
                            <Zap size={14} className="mr-1" /> Personalize
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingNews ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {financialNews.map((news, index) => (
                              <div 
                                key={index} 
                                className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} hover:bg-opacity-80 transition cursor-pointer`}
                                onClick={() => window.open(news.url, "_blank")}
                              >
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{news.title}</h3>
                                  <ExternalLink size={16} className="text-gray-400" />
                                </div>
                                <div className="flex mt-2 text-xs text-gray-500">
                                  <span>{news.source}</span>
                                  <span className="mx-2">•</span>
                                  <span>{news.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 ml-auto"
                          onClick={() => window.open("https://www.bloomberg.com", "_blank")}
                        >
                          View All News
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Quick actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button 
                  onClick={() => setIsModalOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6"
                >
                  <Plus className="mr-2" size={20} /> Add New Expense
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-200 hover:bg-blue-50 text-blue-600 px-6 py-6"
                  onClick={() => navigate("/dashboard")}
                >
                  <PieChart className="mr-2" size={20} /> View Monthly Summary
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={`w-16 md:w-64 p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"} border-l shadow-sm flex flex-col`}>
          <div className="hidden md:block mb-8">
            <h2 className="text-xl font-semibold text-gray-700">Quick Access</h2>
          </div>
          
          <Separator className="mb-4" />
          
          <nav className="space-y-2">
            {rightNavItems.map((item, index) => (
              <TooltipProvider key={index} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={item.action}
                      className={`w-full flex items-center p-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 ${
                        isDarkMode ? "hover:bg-gray-800" : ""
                      } transition-colors`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="md:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
          
          <div className="mt-8 hidden md:block">
            <Card className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-blue-50 border-blue-100"}`}>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-500">
                  Set up recurring expenses to automatically track your monthly bills.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Expense Modal - Using shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`p-6 ${isDarkMode ? "bg-gray-900 text-white border-gray-800" : "bg-white text-black"}`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Expense</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                type="text"
                placeholder="What did you spend on?"
                className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
                value={expense.title}
                onChange={(e) => setExpense({ ...expense, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
                value={expense.amount}
                onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={expense.category}
                onValueChange={(value) => setExpense({ ...expense, category: value })}
              >
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddExpense}
              disabled={!expense.title || !expense.amount || !expense.category}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainPage;