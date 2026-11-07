# 🚀 RepoMind AI

### AI-Powered GitHub Repository Analyzer

RepoMind AI is a full-stack web application that helps developers understand GitHub repositories through AI-powered analysis, technology stack detection, code review, and README generation.

It provides an interactive workspace where developers can explore repository structures, understand project technologies, and generate useful development insights.

## ✨ Features

- **GitHub Repository Analysis:** Analyze public GitHub repositories and explore their metadata and file structures.
- **Repository Insights:** Understand repository organization and identify important files.
- **Technology Stack Detection:** Detect programming languages and technologies used in projects.
- **AI-Powered Analysis:** Generate project explanations and development insights using Google Gemini AI.
- **AI Code Review:** Review selected source files and identify potential code issues and improvements.
- **README Generator:** Generate structured Markdown README documentation.
- **User Authentication:** Secure signup and login using JWT authentication.
- **Repository History:** Save, view, and manage previously analyzed repositories.
- **User-Specific History:** Keep repository history separate for individual accounts.
- **Dark and Light Theme:** Switch between dark and light dashboard themes.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Axios
- React Markdown

**Backend**
- Node.js
- Express.js
- REST APIs
- JSON Web Token (JWT)
- bcryptjs

**Database**
- MongoDB
- Mongoose

**AI and Integrations**
- Google Gemini API
- GitHub REST API

## 📁 Project Structure

```text
RepoMind-AI/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── CodeReview.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── middleware/
│   ├── models/
│   ├── .gitignore
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```


## 🔐 Authentication

RepoMind AI uses JWT-based authentication to manage user sessions.

- User registration and login
- Password hashing using bcryptjs
- Protected repository history routes
- User-specific repository data

## 🤖 AI Integration

Google Gemini API is integrated to provide AI-powered repository explanations and code review capabilities.

AI responses depend on API availability and usage quotas.

## 🔮 Future Enhancements

- Improved AI code review capabilities
- More detailed repository metrics
- Additional AI-powered development tools
- Deployment and cloud database integration

⭐ If you find RepoMind AI interesting, consider giving this repository a star!
