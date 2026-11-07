
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Repository = require("./models/Repository");
const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// GEMINI AI SETUP
// ==========================================

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// ==========================================
// GITHUB API HELPER
// ==========================================

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
  },
});

// ==========================================
// JWT TOKEN HELPER
// ==========================================

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the server .env file.");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ==========================================
// BACKEND HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to RepoMind AI Backend!",
    status: "Server is running successfully",
  });
});

// ==========================================
// USER AUTHENTICATION APIs
// ==========================================

// USER SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid input data.",
      });
    }

    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        message: "Name cannot be empty.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration is missing.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Generate JWT
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    res.status(500).json({
      message: "Unable to create account. Please try again.",
    });
  }
});

// USER LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid input data.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration is missing.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user and include password
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate JWT
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      message: "Unable to login. Please try again.",
    });
  }
});

// ==========================================
// GITHUB REPOSITORY APIs
// ==========================================

// Repository details
app.get("/api/github/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;

    const response = await github.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
    );

    const data = response.data;

    res.json({
      success: true,
      repository: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        openIssues: data.open_issues_count,
        defaultBranch: data.default_branch,
        url: data.html_url,
      },
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.status === 404
          ? "Repository not found."
          : "Unable to fetch repository details.",
    });
  }
});

// Fetch repository files and folders
app.get("/api/github/:owner/:repo/contents", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const branch = req.query.branch;

    const repoResponse = await github.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
    );

    const defaultBranch = branch || repoResponse.data.default_branch;

    const contentsResponse = await github.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(defaultBranch)}`,
      {
        params: {
          recursive: "1",
        },
      }
    );

    const files = contentsResponse.data.tree || [];

    const fileList = files.map((file) => ({
      path: file.path,
      type: file.type === "tree" ? "folder" : "file",
      size: file.size || 0,
    }));

    const extensions = {};

    files
      .filter((file) => file.type === "blob")
      .forEach((file) => {
        const parts = file.path.split(".");

        if (parts.length > 1) {
          const extension = parts.pop().toLowerCase();
          extensions[extension] = (extensions[extension] || 0) + 1;
        }
      });

    const technologies = {
      js: "JavaScript",
      jsx: "React JSX",
      ts: "TypeScript",
      tsx: "React TypeScript",
      py: "Python",
      java: "Java",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      md: "Markdown",
      php: "PHP",
      go: "Go",
      rs: "Rust",
      cpp: "C++",
      c: "C",
      sql: "SQL",
    };

    const detectedTechnologies = Object.keys(extensions)
      .filter((extension) => technologies[extension])
      .map((extension) => ({
        name: technologies[extension],
        extension,
        fileCount: extensions[extension],
      }));

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      branch: defaultBranch,
      totalFiles: files.filter((file) => file.type === "blob").length,
      totalFolders: files.filter((file) => file.type === "tree").length,
      files: fileList,
      technologies: detectedTechnologies,
      truncated: contentsResponse.data.truncated || false,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.status === 404
          ? "Repository or branch not found."
          : "Unable to fetch repository contents.",
      error: error.message,
    });
  }
});

// Fetch individual source code file from GitHub
app.get("/api/github/:owner/:repo/file", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path, branch } = req.query;

    if (!path || typeof path !== "string") {
      return res.status(400).json({
        success: false,
        message: "File path is required.",
      });
    }

    const filePath = path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const response = await github.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`,
      {
        params: branch ? { ref: branch } : {},
      }
    );

    const file = response.data;

    if (Array.isArray(file) || file.type !== "file") {
      return res.status(400).json({
        success: false,
        message: "The selected path is not a file.",
      });
    }

    if (!file.content) {
      return res.status(400).json({
        success: false,
        message: "File content is unavailable.",
      });
    }

    const sourceCode = Buffer.from(file.content, "base64").toString("utf8");

    res.json({
      success: true,
      file: {
        name: file.name,
        path: file.path,
        size: file.size,
        content: sourceCode,
      },
    });
  } catch (error) {
    console.error("GitHub File Fetch Error:", error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: "Unable to fetch source code file.",
      error: error.message,
    });
  }
});

// ==========================================
// GEMINI AI REPOSITORY ANALYSIS API
// ==========================================

app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid prompt is required.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing. Check your server .env file.",
      });
    }

    console.log("Sending request to Gemini AI...");

    const result = await genAI.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const analysis = result.text;

    if (!analysis) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log("Gemini analysis completed successfully!");

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error);

    const status = error.status || error.statusCode || 500;

    res.status(status === 429 || status === 503 ? status : 500).json({
      success: false,
      message:
        status === 429
          ? "Gemini API quota or rate limit reached. Please try again later."
          : status === 503
          ? "Gemini AI is temporarily unavailable. Please try again."
          : "AI analysis failed.",
      error: error.message,
    });
  }
});

// ==========================================
// USER-SPECIFIC REPOSITORY HISTORY APIs
// ==========================================

// Save repository to logged-in user's history
app.post("/api/history", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      fullName,
      url,
      description,
      language,
      stars,
      forks,
    } = req.body;

    if (!name || !fullName || !url) {
      return res.status(400).json({
        message: "Repository name, full name, and URL are required.",
      });
    }

    const userId = req.user.userId;

    // Check whether this user already saved this repository
    const existingRepository = await Repository.findOne({
      url,
      userId,
    });

    if (existingRepository) {
      return res.status(200).json({
        message: "Repository already exists in your history.",
        repository: existingRepository,
      });
    }

    const newRepository = await Repository.create({
      userId,
      name,
      fullName,
      url,
      description,
      language,
      stars,
      forks,
    });

    res.status(201).json({
      message: "Repository saved successfully!",
      repository: newRepository,
    });
  } catch (error) {
    console.error("Save History Error:", error.message);

    res.status(500).json({
      message: "Unable to save repository history.",
    });
  }
});

// Get only the logged-in user's repositories
app.get("/api/history", authMiddleware, async (req, res) => {
  try {
    const repositories = await Repository.find({
      userId: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(repositories);
  } catch (error) {
    console.error("Get History Error:", error.message);

    res.status(500).json({
      message: "Unable to fetch repository history.",
    });
  }
});

// Delete only the logged-in user's repository
app.delete("/api/history/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid repository ID.",
      });
    }

    const repository = await Repository.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!repository) {
      return res.status(404).json({
        message: "Repository not found in your history.",
      });
    }

    res.status(200).json({
      message: "Repository deleted successfully!",
    });
  } catch (error) {
    console.error("Delete History Error:", error.message);

    res.status(500).json({
      message: "Unable to delete repository.",
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`RepoMind AI server running on port ${PORT}`);
});
