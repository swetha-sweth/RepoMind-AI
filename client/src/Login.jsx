
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onShowSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!onLogin) {
      setError("Login service is unavailable.");
      return;
    }

    try {
      setLoading(true);

      await onLogin({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <nav className="login-navbar">
        <div className="login-brand">
          <div className="brand-icon">R</div>
          <span>RepoMind <strong>AI</strong></span>
        </div>

        <button
          className="back-home"
          onClick={() => window.location.href = "/"}
        >
          Back to Home
        </button>
      </nav>

      <main className="login-main">
        <section className="login-intro">
          <span className="intro-tag">
            YOUR AI-POWERED DEVELOPER COMPANION
          </span>

          <h1>
            Understand your code.
            <br />
            <span>Build smarter.</span>
          </h1>

          <p>
            Explore GitHub repositories, discover technologies,
            and unlock meaningful insights with RepoMind AI.
          </p>

          <div className="login-feature-list">
            <div><span>✦</span> AI-powered repository insights</div>
            <div><span>⌘</span> Smart code understanding</div>
            <div><span>↗</span> Build better projects</div>
          </div>

          <div className="login-code-card">
            <div className="code-card-top">
              <span></span><span></span><span></span>
              <small>repomind.config</small>
            </div>

            <pre>
              <span className="code-purple">const</span> developer = {"{"}
              {"\n"}  <span className="code-blue">build</span>: <span className="code-green">"something great"</span>,
              {"\n"}  <span className="code-blue">analyze</span>: <span className="code-green">"with AI"</span>
              {"\n"}{"}"};
            </pre>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-heading">
            <div className="login-card-logo">R</div>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>

            <div className="login-input-wrap">
              <span>✉</span>

              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="password-label-row">
              <label htmlFor="login-password">Password</label>

              <button
                type="button"
                className="forgot-link"
                onClick={() =>
                  setError("Password reset will be available soon.")
                }
              >
                Forgot password?
              </button>
            </div>

            <div className="login-input-wrap">
              <span>♙</span>

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-divider">
            <span>NEW TO REPOMIND AI?</span>
          </div>

          <p className="signup-prompt">
            Don't have an account?
            <button type="button" onClick={onShowSignup}>
              Create account
            </button>
          </p>

          <div className="login-security">
            <span>◇</span> Your workspace. Your projects. Your insights.
          </div>
        </section>
      </main>

      <footer className="login-footer">
        © 2026 RepoMind AI · Built for developers
      </footer>
    </div>
  );
}

export default Login;
