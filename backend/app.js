import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Adjust the frontend URL as needed
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import userRouter from './src/routes/user.route.js';

app.use("/api/users", userRouter);
export default app;