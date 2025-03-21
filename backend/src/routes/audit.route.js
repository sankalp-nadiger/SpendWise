import express from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js';
import { generateAuditReport } from '../services/auditService.js';

// Models import
import Expense from '../models/expense.model.js';
import Income from '../models/income.model.js';
import Budget from '../models/budget.model.js';
import Investment from '../models/investment.model.js';
import User from '../models/user.model.js';
import OrganizationUser from '../models/orgUser.model.js';

const router = express.Router();

const metadata = {
  individual: {
    incomeCategories: ["Salary", "Freelance", "Investment", "Business", "Gift", "Refund", "Sale", "Rental", "Other"],
    expenseCategories: ["Food", "Transport", "Shopping", "Entertainment", "Bills", 'Health', "Other"]
  },
  organization: {
    incomeCategories: ["Salary", "Freelance", "Investment", "Business", "Gift", "Refund", "Sale", "Rental", "Other"],
    expenseCategories: ["Office Supplies", "IT Equipment", "Software", "Travel", "Meetings", "Marketing", "Training", "Utilities", "Rent", "Misc"],
    departments: ["Finance", "Marketing", "HR", "Operations", "IT", "Sales", "Legal"],
    branches: ["Headquarters", "North Region", "South Region", "East Region", "West Region", "International"]
  }
};

  router.get('/metadata', (req, res) => {
    const { userType } = req.query;
    if (!userType || (userType !== 'individual' && userType !== 'organization')) {
      return res.status(400).json({ error: 'Invalid or missing userType parameter' });
    }
    
    // Return metadata based on user type
    res.json(metadata[userType]);
  });

router.post('/generate', verifyJWT, async (req, res) => {
  try {
    const { parameters, purpose, userType } = req.body;
    const { dateRange, selectedCategories, includeBudgets, includeInvestments, selectedDepartments, selectedBranches } = parameters;
    
    // Determine if we're querying for personal or organization data
    const isPersonal = userType === 'individual';
const userId = req.user._id;

const updatedUserType = isPersonal ? "personal" : userType;

    const user = await User.findById(userId);
    if (user.usageType !== updatedUserType) {
      return res.status(403).json({ error: 'Unauthorized access to this audit type' });
    }

    const dateFilter = {
      date: { 
        $gte: new Date(dateRange.startDate), 
        $lte: new Date(dateRange.endDate) 
      }
    };
    
    let incomeQuery, expenseQuery, budgetQuery, investmentQuery;
    
    if (isPersonal) {
      // Personal user queries
      incomeQuery = { 
        ...dateFilter,
        user: userId,
        category: { $in: selectedCategories }
      };
      
      expenseQuery = { 
        ...dateFilter,
        user: userId,
        category: { $in: selectedCategories }
      };
      
      budgetQuery = {
        user: userId,
        category: { $in: selectedCategories }
      };
      
      investmentQuery = {
        user: userId
      };
    } else {
      // Organization user queries
      // Get the organization ID the user belongs to
      const orgUser = await OrganizationUser.findOne({ user: userId });
      if (!orgUser) {
        return res.status(404).json({ error: 'Organization user not found' });
      }
      
      const organizationId = orgUser.organization;
      
      // Apply department and branch filters for org data
      const departmentFilter = selectedDepartments && selectedDepartments.length > 0 
        ? { department: { $in: selectedDepartments } } 
        : {};
        
      const branchFilter = selectedBranches && selectedBranches.length > 0
        ? { branch: { $in: selectedBranches } }
        : {};
      
      incomeQuery = { 
        ...dateFilter,
        organization: organizationId,
        category: { $in: selectedCategories }
      };
      
      expenseQuery = { 
        ...dateFilter,
        organization: organizationId,
        category: { $in: selectedCategories },
        ...departmentFilter,
        ...branchFilter
      };
      
      budgetQuery = {
        organization: organizationId,
        category: { $in: selectedCategories }
      };
      
      investmentQuery = {
        user: userId
      };
    }
    
    // Fetch data
    const incomes = await Income.find(incomeQuery).sort({ date: 1 });
    const expenses = await Expense.find(expenseQuery).sort({ date: 1 });
    
    let budgets = [];
    if (includeBudgets) {
      budgets = await Budget.find(budgetQuery);
    }
    
    let investments = [];
    if (includeInvestments) {
      investments = await Investment.find(investmentQuery);
    }
    
    // Analyze data and generate audit report
    const auditReport = generateAuditReport({
      incomes,
      expenses,
      budgets,
      investments,
      parameters,
      purpose,
      isPersonal
    });
    
    res.json(auditReport);
  } catch (error) {
    console.error('Audit generation error:', error);
    res.status(500).json({ error: 'Failed to generate audit report' });
  }
});

export default router;