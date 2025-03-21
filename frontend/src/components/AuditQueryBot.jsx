import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { SunIcon, MoonIcon } from 'lucide-react';

const AuditQueryBot = ({ auditData, onUpdateAudit, parameters, userType }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'I am your professional audit assistant. Ask me questions about your audit results or request modifications to the report.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const messagesEndRef = useRef(null);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/audit/query', {
        query,
        auditData,
        parameters,
        userType,
        messages: [...messages, userMessage]
      }, { withCredentials: true });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      
      // If audit data was updated in the response
      if (response.data.updatedAuditData) {
        onUpdateAudit(response.data.updatedAuditData);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Theme-specific classes
  const containerClass = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white';
  const messageAreaClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50';
  const userMessageClass = theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-100';
  const assistantMessageClass = theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200';
  const inputClass = theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'border';
  const buttonClass = theme === 'dark' 
    ? 'bg-blue-700 hover:bg-blue-800 text-white' 
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className={`mt-8 p-6 rounded-lg shadow-md ${containerClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Audit Assistant</h3>
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </button>
      </div>
      
      <div className={`p-4 rounded h-80 overflow-y-auto mb-4 ${messageAreaClass}`}>
        {messages.map((msg, index) => (
          msg.role !== 'system' && (
            <div 
              key={index} 
              className={`my-2 p-3 rounded max-w-3/4 ${
                msg.role === 'user' 
                  ? `${userMessageClass} ml-auto` 
                  : assistantMessageClass
              }`}
            >
              <p>{msg.content}</p>
            </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask questions about your audit or request modifications..."
          className={`flex-1 p-2 rounded-l ${inputClass}`}
          disabled={loading}
        />
        <button
          type="submit"
          className={`font-bold py-2 px-4 rounded-r ${buttonClass}`}
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default AuditQueryBot;