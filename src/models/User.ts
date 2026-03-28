import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  studentType: { type: String, enum: ['topper', 'slow_learner', 'one_day_learner'] },
  course: { type: String },
  onboarded: { type: Boolean, default: false },
  roadmap: { type: Array, default: [] },
  challenges: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", UserSchema);
