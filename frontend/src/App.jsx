import React from "react"
import {BrowserRouter as Router,Routes,Route} from "react-router-dom"
import HomePage from './components/pages/HomePage'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import ReportGenerator from './components/ReportGenerator'
import FeaturesPage from "./components/pages/Features"
import MainPage from "./components/pages/MainPage"
import InvestmentsPage from "./components/pages/Investment"
import ExpensesPage from "./components/pages/Expense"
import BudgetCalendarPage from "./components/pages/BudgetCalender"
import ProfilePage from "./components/pages/Profile"
import Dashboard from "./components/pages/Dashboard"
import IncomePage from "./components/pages/Income"
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/report" element={<ReportGenerator />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/investment" element={<InvestmentsPage />} />
                <Route path="/expense" element={<ExpensesPage />} />
                <Route path="/budget" element={<BudgetCalendarPage/>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/income" element={<IncomePage />} />
            </Routes>
        </Router>
    );
}

export default App