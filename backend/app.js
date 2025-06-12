import express from "express";
import cors from "cors";
import bodyParser from "body-parser"
import cookieParser from "cookie-parser";
const app = express();
import dotenv from "dotenv";
import nodemailer from 'nodemailer';
import bot from "./src/services/telegrambot.service.js";

dotenv.config();
// Middleware
app.use(cors({
    origin: *,
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
import budgetRoutes from "./src/routes/budget.route.js";
import investmentRouter from "./src/routes/investment.route.js";
// import dashboardRouter from "./src/routes/dashboard.route.js";
import orgRouter from "./src/routes/org.route.js"
import reportRouter from "./src/routes/report.route.js"
import recExpenseRouter from "./src/routes/recurring-expense.route.js";
import incomeRouter from "./src/routes/income.route.js";
import auditRouter from "./src/routes/audit.route.js"

app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/recExpense", recExpenseRouter);
app.use("/api/investment", investmentRouter);
// app.use("/api/dashboard", dashboardRouter);
app.use("/api/org", orgRouter);
app.use("/api/audit", auditRouter);
app.use("/api/income", incomeRouter);
app.use("/api/report", reportRouter);
app.use(bodyParser.json());

const verificationCodes = {}; // Temporary storage, use DB in production

// Nodemailer Transporter
export const transporter = nodemailer.createTransport({
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

app.post("/api/organizations/invite", async (req, res) => {
  const { emails, inviteLink } = req.body;

  if (!emails || !inviteLink) {
    return res.status(400).json({ message: "Emails and invite link are required" });
  }

  try {
    const emailList = emails
      .split(/[,;\s\n]+/) // Split emails by comma, semicolon, space, or newline
      .map(email => email.trim())
      .filter(email => email);

    if (emailList.length === 0) {
      return res.status(400).json({ message: "No valid emails provided" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailList,
      subject: "You Are Invited to Join SpendWise",
      text: `Hello, 

You have been invited to join SpendWise. Below is the invite link to join the organization. Kindly do not share it with anyone outside the organization. Kindly use the invite link to sign up and join the organization.

${inviteLink}

If you were not expecting this invite, please ignore this email.

Best,  
SpendWise Team`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Invites sent successfully" });
  } catch (error) {
    console.error("Error sending invites:", error);
    res.status(500).json({ message: "Failed to send invites" });
  }
});

app.post("/send-message", async (req, res) => {
  const { chatId, message } = req.body;

  try {
      await bot.sendMessage(chatId, message);
      res.status(200).json({ success: true, message: "Message sent!" });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
