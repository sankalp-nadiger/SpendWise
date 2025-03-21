import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  faceDescriptor: { type: [Number] },
  mobileNumber: { type: String, required: true, unique: true },
  profession: { type: String},
  budget: { type: Number, default: 1000 },
  careerStage: { 
    type: String, 
    enum: ["student", "entry", "mid", "senior", "executive", "retired"],
    required: true
  },
  usageType: { 
    type: String, 
    enum: ["personal", "organization"],
    required: true
  },
  telegramChatId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.assignRandomAvatar = async function () {
  const male_avatars = [
    "https://tse2.mm.bing.net/th?id=OIP.Yj7V4oP9Noi8p77a8Oyd5QHaJA&pid=Api&P=0&h=180",
    "https://tse2.mm.bing.net/th?id=OIP.zxQil4x4JMZtZm-7tUNF1QHaH_&pid=Api&P=0&h=180",
    "https://tse3.mm.bing.net/th?id=OIP.CHiM-UEsM0jqElrYHEftiwHaHa&pid=Api&P=0&h=180",
    "https://tse2.mm.bing.net/th?id=OIP.2Be2070ayk9DYoV9xRXFEgHaHa&pid=Api&P=0&h=180"
  ];

  const female_avatars = [
    "https://tse3.mm.bing.net/th?id=OIP.GYuOR-Ox5UCX3-R_Qz49aQHaHa&pid=Api&P=0&h=180",
    "https://tse1.mm.bing.net/th?id=OIP.HJ_CpQ29Bd9OeU98QDMe-gHaHa&pid=Api&P=0&h=180",
    "https://tse3.mm.bing.net/th?id=OIP.KpNNDej-Xh6Njm4Xf-15BQHaHa&pid=Api&P=0&h=180",
    "https://tse1.mm.bing.net/th?id=OIP.opldioYHZSr8ja6_DlApqgHaHa&pid=Api&P=0&h=180"
  ];

  if (!this.avatar) {
    if (this.gender === "M") {
      this.avatar = male_avatars[Math.floor(Math.random() * male_avatars.length)];
    } else if (this.gender === "F") {
      this.avatar = female_avatars[Math.floor(Math.random() * female_avatars.length)];
    }
    await this.save(); // Save the changes to the database
  }
};

// Pre-save hook for password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

      userSchema.methods.isPasswordCorrect = async function (password) {
        return await bcrypt.compare(password, this.password);
      };
      
      userSchema.methods.generateAccessToken = function () {
        return jwt.sign(
          {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
          },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
          },
        );
      };
      userSchema.methods.generateRefreshToken = function () {
        return jwt.sign(
          {
            _id: this._id,
          },
          process.env.REFRESH_TOKEN_SECRET,
          {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
          },
        );
      };

const User = mongoose.model("User", userSchema);
export default User;