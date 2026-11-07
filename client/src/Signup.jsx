
import { useState } from "react";
import "./Signup.css";

function Signup({ onSignup, onShowLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!onSignup) {
      setError("Signup service is unavailable.");
      return;
    }

    try {
      setLoading(true);

      await onSignup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-glow signup-glow-one"></div>
      <div className="signup-glow signup-glow-two"></div>

      <div className="signup-container">
        <div className="signup-brand">
          <div className="signup-logo">R</div>
          <span>RepoMind <strong>AI</strong></span>
        </div>

        <div className="signup-heading">
          <span className="signup-tag">START YOUR JOURNEY</span>
          <h1>Create your account</h1>
          <p>
            Join RepoMind AI and explore your GitHub repositories smarter.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label>Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label className="signup-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show passwords
          </label>

          {error && (
            <p className="signup-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="signup-footer">
          Already have an account?
          <button type="button" onClick={onShowLogin}>
            Sign in
          </button>
        </div>

        <p className="signup-note">
          By creating an account, you agree to use RepoMind AI responsibly.
        </p>
      </div>
    </div>
  );
}

export default Signup;
