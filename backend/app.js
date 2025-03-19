import express from "express";
import cors from "cors";
import bodyParser from "body-parser"
import cookieParser from "cookie-parser";
const app = express();
import dotenv from "dotenv";
import nodemailer from 'nodemailer';

dotenv.config();
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
import orgRouter from "./src/routes/org.route.js"

app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/investment", investmentRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/org", orgRouter);
app.use(bodyParser.json());

const verificationCodes = {}; // Temporary storage, use DB in production

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true, // Try setting this to true
});

// Function to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

app.post("/api/organizations/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const verificationCode = generateCode();
    verificationCodes[email] = verificationCode;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SpendWise Verification Code",
      text: `Welcome. Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
});


app.post("/api/organizations/validate-code", (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] === code) {
    delete verificationCodes[email];
    res.json({ message: "Verification successful" });
  } else {
    res.status(400).json({ message: "Invalid or expired code" });
  }
});


export default app;