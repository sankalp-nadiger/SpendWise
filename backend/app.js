import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import userRouter from './src/routes/user.route.js';
import expenseRouter from './src/routes/expense.route.js';
import budgetRoutes from "./src//routes/budget.route.js";
import investmentRouter from "./src/routes/investment.route.js";
import dashboardRouter from "./src/routes/dashboard.route.js";

app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/investment", investmentRouter);
app.use("/api/dashboard", dashboardRouter);
export default app;