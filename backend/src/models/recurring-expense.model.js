import mongoose from "mongoose";

const RecurringExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Rent",
        "Phone",
        "Internet",
        "Utilities",
        "Subscriptions",
        "Insurance",
        "Loan",
        "Taxes",
        "Equipment",
        "Maintenance",
        "Services",
        "Payroll",
        "Other",
      ],
    },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
      default: "monthly",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: [
        "upi",
        "credit card",
        "debit card",
        "net banking",
        "cash",
        "auto debit",
        "bank transfer",
        "check",
        "invoice",
      ],
      default: "upi",
    },
    notes: {
      type: String,
      trim: true,
    },
    // userType: {
    //   type: String,
    //   enum: ["personal", "organization"],
    //   default: "personal",
    // },
    active: {
      type: Boolean,
      default: true,
    },
    // For tracking occurrences
    lastProcessed: {
      type: Date,
      default: null,
    },
    nextDueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Calculate the next due date based on frequency and start date
RecurringExpenseSchema.pre("save", function(next) {
  if (!this.isModified("startDate") && !this.isModified("frequency") && this.nextDueDate) {
    return next();
  }
  
  const startDate = new Date(this.startDate);
  
  switch (this.frequency) {
    case "daily":
      this.nextDueDate = startDate;
      break;
    case "weekly":
      this.nextDueDate = startDate;
      break;
    case "monthly":
      this.nextDueDate = startDate;
      break;
    case "quarterly":
      this.nextDueDate = startDate;
      break;
    case "yearly":
      this.nextDueDate = startDate;
      break;
    case "custom":
      this.nextDueDate = startDate;
      break;
    default:
      this.nextDueDate = startDate;
  }
  
  next();
});

const RecurringExpense = mongoose.model("RecurringExpense", RecurringExpenseSchema);

export default RecurringExpense;
