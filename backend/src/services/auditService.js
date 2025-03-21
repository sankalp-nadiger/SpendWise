function formatIncomeAnalysis(incomes, incomeByCategory, totalIncome) {
    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(incomeByCategory)
      .sort((a, b) => b[1] - a[1]);
    
    // Calculate percentages for each category
    const categoryBreakdown = sortedCategories.map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / totalIncome) * 100).toFixed(2)
    }));
    
    // Find largest source of income
    const largestSource = sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';
    
    // Get income frequency counts
    const frequencyCount = incomes.reduce((acc, income) => {
      const frequency = income.frequency || 'one-time';
      if (!acc[frequency]) {
        acc[frequency] = 0;
      }
      acc[frequency]++;
      return acc;
    }, {});
    
    return {
      totalIncome,
      categoryBreakdown,
      largestSource,
      incomeStreams: incomes.length,
      frequencyAnalysis: frequencyCount,
      averageIncomePerStream: incomes.length > 0 ? (totalIncome / incomes.length).toFixed(2) : 0
    };
  }
  
  function formatExpenseAnalysis(expenses, expensesByCategory, totalExpenses) {
    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1]);
    
    // Calculate percentages for each category
    const categoryBreakdown = sortedCategories.map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / totalExpenses) * 100).toFixed(2)
    }));
    
    // Calculate monthly average if date information is available
    let monthlyAverage = null;
    if (expenses.length > 0 && expenses[0].date) {
      // Get unique months in the data
      const dates = expenses.map(expense => new Date(expense.date));
      const uniqueMonths = new Set(dates.map(date => `${date.getMonth()}-${date.getFullYear()}`));
      monthlyAverage = totalExpenses / uniqueMonths.size;
    }
    
    // Find discretionary vs. essential spending if categories are tagged
    const discretionarySpending = expenses
      .filter(expense => expense.isDiscretionary)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const essentialSpending = totalExpenses - discretionarySpending;
    
    return {
      totalExpenses,
      categoryBreakdown,
      largestExpenseCategory: sortedCategories.length > 0 ? sortedCategories[0][0] : 'None',
      expenseCount: expenses.length,
      monthlyAverage,
      discretionarySpending,
      essentialSpending,
      discretionaryPercentage: ((discretionarySpending / totalExpenses) * 100).toFixed(2)
    };
  }
  
  function formatBudgetAnalysis(budgetCompliance) {
    // Calculate overall compliance score
    let totalBudget = 0;
    let totalActual = 0;
    
    Object.values(budgetCompliance).forEach(category => {
      totalBudget += category.budgeted;
      totalActual += category.actual;
    });
    
    const overallComplianceRate = (totalActual / totalBudget) * 100;
    
    // Sort categories by compliance rate (worst to best)
    const sortedByCompliance = Object.entries(budgetCompliance)
      .sort((a, b) => b[1].complianceRate - a[1].complianceRate);
    
    // Count categories within budget vs over budget
    const categoriesOverBudget = Object.values(budgetCompliance)
      .filter(category => category.variance < 0).length;
    
    const categoriesWithinBudget = Object.values(budgetCompliance).length - categoriesOverBudget;
    
    return {
      totalBudgeted: totalBudget,
      totalActual,
      overallVariance: totalBudget - totalActual,
      overallComplianceRate: overallComplianceRate.toFixed(2),
      complianceByCategory: budgetCompliance,
      worstPerformingCategories: sortedByCompliance.slice(0, 3).map(([category, data]) => ({
        category,
        complianceRate: data.complianceRate.toFixed(2)
      })),
      categoriesOverBudget,
      categoriesWithinBudget,
      complianceStatus: overallComplianceRate <= 100 ? 'Within overall budget' : 'Over overall budget'
    };
  }
  
  function formatInvestmentAnalysis(investmentPerformance) {
    // Calculate portfolio stats
    let totalInvested = 0;
    let totalInvestmentCount = 0;
    
    Object.values(investmentPerformance).forEach(typeData => {
      totalInvested += typeData.totalInvested;
      totalInvestmentCount += typeData.count;
    });
    
    // Calculate asset allocation percentages
    const assetAllocation = Object.entries(investmentPerformance).map(([type, data]) => ({
      type,
      amount: data.totalInvested,
      percentage: ((data.totalInvested / totalInvested) * 100).toFixed(2),
      count: data.count
    }));
    
    // Sort asset allocation by percentage (descending)
    assetAllocation.sort((a, b) => b.percentage - a.percentage);
    
    // Determine diversification score based on number of investment types
    // Simple scoring: Low (1-2 types), Medium (3-4 types), High (5+ types)
    const investmentTypes = Object.keys(investmentPerformance).length;
    let diversificationScore;
    
    if (investmentTypes <= 2) {
      diversificationScore = 'Low';
    } else if (investmentTypes <= 4) {
      diversificationScore = 'Medium';
    } else {
      diversificationScore = 'High';
    }
    
    return {
      totalInvested,
      totalInvestmentCount,
      averageInvestmentSize: (totalInvested / totalInvestmentCount).toFixed(2),
      assetAllocation,
      investmentTypes,
      diversificationScore,
      largestAssetClass: assetAllocation.length > 0 ? assetAllocation[0].type : 'None'
    };
  }
  
function generateAuditReport({ incomes, expenses, budgets, investments, parameters, purpose, isPersonal }) {
    // Calculate total income and expenses
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;
    
    // Group expenses by category for analysis
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});
    
    // Group income by source/category
    const incomeByCategory = incomes.reduce((acc, income) => {
      if (!acc[income.category]) {
        acc[income.category] = 0;
      }
      acc[income.category] += income.amount;
      return acc;
    }, {});
    
    // Budget analysis - compare actual spending with budgets
    let budgetCompliance = {};
    if (budgets.length > 0) {
      budgets.forEach(budget => {
        const categoryExpense = expensesByCategory[budget.category] || 0;
        const variance = budget.limit - categoryExpense;
        const complianceRate = (categoryExpense / budget.limit) * 100;
        
        budgetCompliance[budget.category] = {
          budgeted: budget.limit,
          actual: categoryExpense,
          variance,
          complianceRate,
          status: variance >= 0 ? 'Within budget' : 'Over budget'
        };
      });
    }
    
    // Investment analysis
    let investmentPerformance = null;
    if (investments.length > 0) {
      // Group investments by type
      investmentPerformance = investments.reduce((acc, investment) => {
        if (!acc[investment.type]) {
          acc[investment.type] = {
            totalInvested: 0,
            count: 0
          };
        }
        acc[investment.type].totalInvested += investment.amount;
        acc[investment.type].count++;
        return acc;
      }, {});
    }
    
    // Generate findings based on analysis
    const findings = [];
    
    // Basic financial health finding
    if (netCashFlow > 0) {
      findings.push(`Positive cash flow of $${netCashFlow.toFixed(2)} during the audit period.`);
    } else {
      findings.push(`Negative cash flow of $${Math.abs(netCashFlow).toFixed(2)} during the audit period.`);
    }
    
    // Find highest expense categories
    const expenseCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    findings.push(`Top expense categories: ${expenseCategories.map(([category, amount]) => 
      `${category} ($${amount.toFixed(2)})`).join(', ')}`);
    
    // Budget findings
    if (Object.keys(budgetCompliance).length > 0) {
      const overBudgetCategories = Object.entries(budgetCompliance)
        .filter(([_, data]) => data.status === 'Over budget')
        .map(([category, _]) => category);
      
      if (overBudgetCategories.length > 0) {
        findings.push(`Budget exceeded in the following categories: ${overBudgetCategories.join(', ')}`);
      } else {
        findings.push('All categories are within budget limits.');
      }
    }
    
    // Generate recommendations
    const recommendations = [];
    
    // Basic recommendations based on cash flow
    if (netCashFlow < 0) {
      recommendations.push('Review and reduce expenses in top spending categories.');
      recommendations.push('Consider creating a more detailed budget to track spending.');
    }
    const startDate = new Date(parameters.dateRange.startDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
  });
  
  const endDate = new Date(parameters.dateRange.endDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
  });

    return {
      summary: `This financial audit covers the period from ${startDate} to ${endDate}. ${
        isPersonal ? 'Personal' : 'Organizational'} finances show a ${netCashFlow >= 0 ? 'positive' : 'negative'} cash flow of $${
        Math.abs(netCashFlow).toFixed(2)}. ${purpose ? `The audit was conducted for: ${purpose}` : ''}`,
      
      incomeAnalysis: formatIncomeAnalysis(incomes, incomeByCategory, totalIncome),
      expenseAnalysis: formatExpenseAnalysis(expenses, expensesByCategory, totalExpenses),
      budgetAnalysis: budgets.length > 0 ? formatBudgetAnalysis(budgetCompliance) : null,
      investmentAnalysis: investments.length > 0 ? formatInvestmentAnalysis(investmentPerformance) : null,
      
      findings,
      recommendations
    };
  }

  export{ generateAuditReport} ;