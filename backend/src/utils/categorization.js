export const categorizeExpense = (text) => {
    const categories = {
      food: ["restaurant", "coffee", "pizza", "groceries", "burger"],
      transport: ["uber", "bus", "train", "fuel", "taxi"],
      rent: ["house", "apartment", "rent"],
      entertainment: ["movie", "netflix", "game", "concert"],
    };
  
    let amountMatch = text.match(/₹?(\d+)/); // Extract amount
    let amount = amountMatch ? parseInt(amountMatch[1]) : null;
    let category = "Others"; // Default
  
    for (let key in categories) {
      if (categories[key].some((word) => text.includes(word))) {
        category = key;
        break;
      }
    }
  
    return { amount, category };
  };
  