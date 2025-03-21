// utils/categorization.js
export const categorizeTransaction = (text, userType, transactionType) => {
  // Extract the amount from the text
  const amountMatch = text.match(/₹?(\d+)/);
  const amount = amountMatch ? parseInt(amountMatch[1]) : null;
  let category = "";

  if (transactionType === "expense") {
    // Define mappings for expenses
    const personalExpenseMapping = {
      "Food": ["restaurant", "coffee", "pizza", "groceries", "burger", "juice", "party"],
      "Transport": ["uber", "bus", "train", "fuel", "taxi", "petrol", "gas", 'diesel'],
      "Health": ["doctor", "hospital", "pharmacy", "medicine", "health"],
      "Shopping": ["mall", "shopping", "clothes", "electronics"],
      "Entertainment": ["movie", "netflix", "game", "concert"],
      "Bills": ["electricity", "water", "internet", "phone"],
      "Other": []
    };

      category = "Other";
      for (let key in personalExpenseMapping) {
        if (personalExpenseMapping[key].some(word => text.includes(word))) {
          category = key;
          break;
        }
      }
  } else if (transactionType === "income") {
    // Define income categories
    const incomeMapping = {
      "Salary": ["salary", "paycheck", "wage"],
      "Freelance": ["freelance", "gig", "contract"],
      "Investment": ["dividend", "investment", "interest"],
      "Business": ["business", "enterprise", "company"],
      "Gift": ["gift", "present", "bonus"],
      "Refund": ["refund", "returned","cashback"],
      "Sale": ["sale", "sold"],
      "Rental": ["rental", "rent"],
      "Other": []
    };

    category = "Other";
    for (let key in incomeMapping) {
      if (incomeMapping[key].some(word => text.includes(word))) {
        category = key;
        break;
      }
    }
  }

  return { amount, category };
};
