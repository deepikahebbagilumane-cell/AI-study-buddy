import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./src/models/User.ts";

dotenv.config();

const app = express();
const DEFAULT_PORT = 3000;

app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      
      if (MONGODB_URI.includes("cluster.mongodb.net")) {
        console.error("⚠️  ISSUE: 'cluster.mongodb.net' is a placeholder. You must use your actual cluster address (e.g., 'cluster0.ab12c.mongodb.net').");
      }
      
      if (err.message.includes("IP isn't whitelisted") || err.message.includes("Could not connect to any servers")) {
        console.error("👉 FIX: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0)");
      }
    });
} else {
  console.warn("⚠️ MONGODB_URI is missing in .env. Using local storage mode.");
}

// In-memory storage fallback if MongoDB is not connected
let users: any[] = [];
let chats: any[] = [];

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email: rawEmail, password } = req.body;
    const email = rawEmail.toLowerCase();
    
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === 'deepikahebbagilumane@gmail.com';
      
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: isAdmin ? 'admin' : 'user'
      });

      await user.save();
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
      res.status(201).json({ user, token });
    } else {
      // Fallback to in-memory
      const existingUser = users.find(u => u.email === email);
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === 'deepikahebbagilumane@gmail.com';
      const user = {
        _id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: hashedPassword,
        role: isAdmin ? 'admin' : 'user',
        onboarded: false,
        roadmap: [],
        challenges: [],
        createdAt: new Date().toISOString()
      };
      users.push(user);
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
      res.status(201).json({ user, token });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail.toLowerCase();

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email });
    } else {
      user = users.find(u => u.email === email);
    }

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id || user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/update-onboarding", async (req, res) => {
  try {
    const { userId, studentType, course } = req.body;
    
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(userId, { studentType, course, onboarded: true }, { new: true });
      res.json({ user });
    } else {
      const userIndex = users.findIndex(u => u._id === userId);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      
      users[userIndex] = { ...users[userIndex], studentType, course, onboarded: true };
      res.json({ user: users[userIndex] });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    
    let admin;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
        admin = await User.findById(decoded.userId);
      } else {
        admin = users.find(u => u._id === decoded.userId);
      }
    } else {
      admin = users.find(u => u._id === decoded.userId);
    }
    
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    let allUsers;
    if (mongoose.connection.readyState === 1) {
      allUsers = await User.find().select("-password");
      // Include demo users if they exist
      if (users.length > 0) {
        const demoUsers = users.map(({ password, ...u }) => u);
        allUsers = [...allUsers, ...demoUsers];
      }
    } else {
      allUsers = users.map(({ password, ...u }) => u);
    }
    res.json({ users: allUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/roadmap", async (req, res) => {
  try {
    const { userId, roadmap } = req.body;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findByIdAndUpdate(userId, { roadmap }, { new: true });
      res.json({ user });
    } else {
      const userIndex = users.findIndex(u => u._id === userId);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      users[userIndex].roadmap = roadmap;
      res.json({ user: users[userIndex] });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/challenges", async (req, res) => {
  try {
    const { userId, challenges: newChallenges } = req.body;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findByIdAndUpdate(userId, { challenges: newChallenges }, { new: true });
      res.json({ user });
    } else {
      const userIndex = users.findIndex(u => u._id === userId);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      users[userIndex].challenges = newChallenges;
      res.json({ user: users[userIndex] });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import Chat from "./src/models/Chat.ts";

// Chat routes
app.get("/api/chat/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      const history = await Chat.find({ userId }).sort({ timestamp: 1 });
      res.json(history);
    } else {
      const history = chats.filter(c => c.userId === userId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      res.json(history);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history" });
  }
});

app.post("/api/chat/save", async (req, res) => {
  try {
    const { userId, role, text } = req.body;
    if (mongoose.connection.readyState === 1) {
      const newMessage = new Chat({ userId, role, text });
      await newMessage.save();
      res.status(201).json(newMessage);
    } else {
      const newMessage = {
        _id: Math.random().toString(36).substr(2, 9),
        userId,
        role,
        text,
        timestamp: new Date().toISOString()
      };
      chats.push(newMessage);
      res.status(201).json(newMessage);
    }
  } catch (error) {
    res.status(500).json({ message: "Error saving message" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    mode: mongoose.connection.readyState === 1 ? "database" : "demo",
    env: process.env.NODE_ENV || "development"
  });
});

// Catch-all for API routes to ensure they return JSON
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 0, // Pick a random free port for HMR to avoid conflicts
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const startListening = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`\nâœ… Server running on http://localhost:${port}`);
      console.log(`âœ… If you see "EADDRINUSE", try closing other terminals or restarting VS Code.\n`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`âš ï¸  Port ${port} is in use, trying ${port + 1}...`);
        startListening(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  startListening(port);
}

startServer();
