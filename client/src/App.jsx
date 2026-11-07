
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import AnalysisPage from "./pages/AnalysisPage";
import ReadmeGenerator from "./pages/ReadmeGenerator";
import Login from "./Login";
import Signup from "./Signup";

const API_URL = "http://localhost:5000";

const getSavedToken = () => {
  return (
    localStorage.getItem("repomind-token") ||
    sessionStorage.getItem("repomind-token") ||
    ""
  );
};

const getSavedUser = () => {
  try {
    const savedUser =
      localStorage.getItem("repomind-user") ||
      sessionStorage.getItem("repomind-user");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

function App() {
  const [repoUrl, setRepoUrl] = useState("");

  const [authToken, setAuthToken] = useState(getSavedToken);
  const [user, setUser] = useState(getSavedUser);

  const [currentPage, setCurrentPage] = useState(() =>
    getSavedToken() ? "dashboard" : "login"
  );

  const [repository, setRepository] = useState(null);
  const [repositoryContents, setRepositoryContents] = useState(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("repomind-theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("repomind-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "dark" ? "light" : "dark"
    );
  };

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const saveAuthentication = (data, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem("repomind-token");
    otherStorage.removeItem("repomind-user");

    storage.setItem("repomind-token", data.token);
    storage.setItem("repomind-user", JSON.stringify(data.user));

    setAuthToken(data.token);
    setUser(data.user);
    setHistory([]);
    setCurrentPage("dashboard");
  };

  const handleSignup = async (signupData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/signup`,
        signupData
      );

      saveAuthentication(response.data, true);
    } catch (error) {
      console.error("Signup error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    }
  };

  const handleLogin = async (loginData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: loginData.email,
          password: loginData.password,
        }
      );

      saveAuthentication(response.data, loginData.rememberMe);
    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to login. Please check your connection and try again."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("repomind-token");
    localStorage.removeItem("repomind-user");

    sessionStorage.removeItem("repomind-token");
    sessionStorage.removeItem("repomind-user");

    setAuthToken("");
    setUser(null);
    setHistory([]);
    setRepository(null);
    setRepositoryContents(null);
    setRepoUrl("");
    setCurrentPage("login");
  };

  useEffect(() => {
    if (currentPage === "history" && authToken) {
      fetchHistory();
    }
  }, [currentPage, authToken]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await axios.get(
        `${API_URL}/api/history`,
        getAuthHeaders()
      );

      setHistory(response.data);
    } catch (error) {
      console.error("History fetch error:", error);

      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        handleLogout();
      } else {
        alert("Unable to load repository history.");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRepositoryDetails = (input) => {
    try {
      let cleanedUrl = input.trim();

      cleanedUrl = cleanedUrl.replace(/^["']|["']$/g, "");
      cleanedUrl = cleanedUrl.replace(/\.git\/?$/i, "");

      const parsedUrl = new URL(cleanedUrl);

      if (
        parsedUrl.protocol !== "https:" ||
        !["github.com", "www.github.com"].includes(
          parsedUrl.hostname.toLowerCase()
        )
      ) {
        return null;
      }

      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      if (parts.length !== 2) {
        return null;
      }

      const owner = parts[0];
      const repo = parts[1];

      if (!owner || !repo) {
        return null;
      }

      return {
        owner,
        repo,
        normalizedUrl: `https://github.com/${owner}/${repo}`,
      };
    } catch {
      return null;
    }
  };

  const handleAnalyze = async (urlToAnalyze = repoUrl) => {
    if (!authToken) {
      alert("Please login first.");
      setCurrentPage("login");
      return;
    }

    if (!urlToAnalyze.trim()) {
      alert("Please enter a GitHub repository URL.");
      return;
    }

    const details = getRepositoryDetails(urlToAnalyze);

    if (!details) {
      alert(
        "Invalid GitHub URL. Please enter a repository URL like https://github.com/facebook/react"
      );
      return;
    }

    const { owner, repo, normalizedUrl } = details;

    try {
      setLoading(true);
      setRepository(null);
      setRepositoryContents(null);

      console.log("Analyzing repository:", normalizedUrl);

      const [repoResponse, contentsResponse] = await Promise.all([
        axios.get(
          `${API_URL}/api/github/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
        ),
        axios.get(
          `${API_URL}/api/github/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`
        ),
      ]);

      if (!repoResponse.data?.repository) {
        throw new Error(
          "Repository details were not returned by the server."
        );
      }

      const repoData = repoResponse.data.repository;

      setRepository(repoData);
      setRepositoryContents(contentsResponse.data);
      setRepoUrl(normalizedUrl);
      setCurrentPage("analysis");

      try {
        await axios.post(
          `${API_URL}/api/history`,
          {
            name: repoData.name,
            fullName: repoData.fullName || `${owner}/${repo}`,
            url: normalizedUrl,
            description:
              repoData.description || "No description available",
            language: repoData.language || "Unknown",
            stars: repoData.stars || 0,
            forks: repoData.forks || 0,
          },
          getAuthHeaders()
        );

        console.log("Repository saved to history.");
      } catch (historyError) {
        console.error(
          "Could not save repository:",
          historyError.response?.data || historyError.message
        );
      }
    } catch (error) {
      console.error("Repository analysis error:", error);

      const serverMessage = error.response?.data?.message;
      const statusCode = error.response?.status;

      let message = "Unable to analyze repository.";

      if (statusCode === 404) {
        message =
          "Repository not found. Check the owner and repository name.";
      } else if (statusCode === 403) {
        message =
          "GitHub API rate limit reached or access denied. Please try again later.";
      } else if (statusCode === 401) {
        message =
          "GitHub authentication failed. Check your backend configuration.";
      } else if (error.code === "ERR_NETWORK") {
        message =
          "Cannot connect to the backend. Make sure your server is running on port 5000.";
      } else if (serverMessage) {
        message = serverMessage;
      } else if (error.message) {
        message = error.message;
      }

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this repository from history?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/api/history/${id}`,
        getAuthHeaders()
      );

      setHistory((previousHistory) =>
        previousHistory.filter((item) => item._id !== id)
      );
    } catch (error) {
      console.error("Delete history error:", error);
      alert("Unable to delete repository.");
    }
  };

  const handleReanalyze = (url) => {
    setRepoUrl(url);
    handleAnalyze(url);
  };

  if (!authToken && currentPage === "signup") {
    return (
      <Signup
        onSignup={handleSignup}
        onShowLogin={() => setCurrentPage("login")}
      />
    );
  }

  if (!authToken || currentPage === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onShowSignup={() => setCurrentPage("signup")}
      />
    );
  }

  return (
    <div className={`app ${theme}-theme`}>
      <aside className="sidebar">
        <h2>✦ RepoMind AI</h2>

        <nav>
          <button
            className={currentPage === "dashboard" ? "active" : ""}
            onClick={() => setCurrentPage("dashboard")}
          >
            ⌂ Dashboard
          </button>

          <button
            className={currentPage === "analysis" ? "active" : ""}
            onClick={() => setCurrentPage("analysis")}
          >
            ⌕ Analyze Repository
          </button>

          <button
            className={currentPage === "readme" ? "active" : ""}
            onClick={() => setCurrentPage("readme")}
          >
            📄 README Generator
          </button>

          <button
            className={currentPage === "history" ? "active" : ""}
            onClick={() => setCurrentPage("history")}
          >
            ◷ History
          </button>

          <button
            className={currentPage === "settings" ? "active" : ""}
            onClick={() => setCurrentPage("settings")}
          >
            ⚙ Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <p>AI-Powered Developer Tool</p>
          <span>Version 1.0</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Developer Workspace</span>

          <div className="profile-section">
            <span>{user?.name || user?.email || "User"}</span>
            <div className="profile">AI</div>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {currentPage === "dashboard" ? (
          <>
            <section className="hero">
              <span className="tag">✦ YOUR AI CODE ASSISTANT</span>

              <h1>
                Understand Code.
                <br />
                <span>Build Better.</span>
              </h1>

              <p>
                Analyze any public GitHub repository with AI.
                Discover technologies, understand code,
                and find ways to improve.
              </p>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Paste your GitHub repository URL..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAnalyze();
                    }
                  }}
                />

                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "✦ Analyze Repository"}
                </button>
              </div>

              <small>
                Example: https://github.com/facebook/react
              </small>
            </section>

            <section className="features">
              <h2>What can RepoMind AI do?</h2>

              <div className="feature-grid">
                <div className="feature-card">
                  <span>📁</span>
                  <h3>Repository Insights</h3>
                  <p>
                    Understand project structure and important files.
                  </p>
                </div>

                <div className="feature-card">
                  <span>💻</span>
                  <h3>Tech Stack Detection</h3>
                  <p>
                    Discover programming languages and technologies.
                  </p>
                </div>

                <div className="feature-card">
                  <span>🔍</span>
                  <h3>AI Code Review</h3>
                  <p>
                    Identify potential issues and improve code quality.
                  </p>
                </div>

                <div className="feature-card">
                  <span>💡</span>
                  <h3>Smart Suggestions</h3>
                  <p>
                    Get AI-powered recommendations and documentation.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : currentPage === "analysis" ? (
          repository ? (
            <AnalysisPage
              repository={repository}
              repositoryContents={repositoryContents}
            />
          ) : (
            <section className="empty-analysis-state">
              <div className="empty-analysis-icon">⌕</div>

              <span className="tag">✦ REPOSITORY ANALYZER</span>

              <h1>Ready to explore some code?</h1>

              <p>
                You haven't analyzed a repository yet.
                Enter a public GitHub repository URL to discover
                its technologies, project structure and AI insights.
              </p>

              <button
                className="empty-analysis-button"
                onClick={() => setCurrentPage("dashboard")}
              >
                ✦ Start Analyzing
              </button>

              <span className="empty-analysis-hint">
                Your repository insights will appear here.
              </span>
            </section>
          )
        ) : currentPage === "readme" ? (
          <ReadmeGenerator />
        ) : currentPage === "history" ? (
          <section className="history-page">
            <h1>Repository History</h1>
            <p>Your previously analyzed GitHub repositories.</p>

            {historyLoading ? (
              <p>Loading repository history...</p>
            ) : history.length === 0 ? (
              <div className="history-empty">
                <h2>No repositories yet</h2>
                <p>
                  Analyze a GitHub repository to see it saved here.
                </p>

                <button onClick={() => setCurrentPage("dashboard")}>
                  Analyze Repository
                </button>
              </div>
            ) : (
              <div className="history-grid">
                {history.map((item) => (
                  <div className="history-card" key={item._id}>
                    <h3>📁 {item.name}</h3>

                    <p className="history-fullname">{item.fullName}</p>
                    <p>{item.description}</p>

                    <div className="history-details">
                      <span>💻 {item.language}</span>
                      <span>⭐ {item.stars}</span>
                      <span>🍴 {item.forks}</span>
                    </div>

                    <small>
                      Saved: {new Date(item.createdAt).toLocaleDateString()}
                    </small>

                    <div className="history-actions">
                      <button
                        onClick={() => handleReanalyze(item.url)}
                        disabled={loading}
                      >
                        ↻ Re-analyze
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item._id)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : currentPage === "settings" ? (
          <section className="settings-page">
            <h1>Settings</h1>
            <p>Customize your RepoMind AI workspace.</p>

            <div className="settings-card">
              <div className="settings-info">
                <span className="settings-icon">🎨</span>

                <div>
                  <h2>Appearance</h2>
                  <p>
                    Choose how RepoMind AI looks on your device.
                  </p>
                </div>
              </div>

              <div className="theme-control">
                <div>
                  <strong>Theme</strong>
                  <p>
                    Current theme:{" "}
                    {theme === "dark" ? "Dark Mode" : "Light Mode"}
                  </p>
                </div>

                <button
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <footer>Built with React, Node.js and AI</footer>
      </main>
    </div>
  );
}

export default App;
