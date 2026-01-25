import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import "./ResendEmailPage.css";

function ResendEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await authAPI.resendVerificationEmail({ email: email.toLowerCase() });

      setSent(true);
      toast.success("Verification email sent! Check your inbox.");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Resend email error:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Failed to send verification email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="resend-email-page">
        <div className="resend-email-container">
          <div className="resend-email-card">
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Email Sent!</h2>
              <p>
                We've sent a verification email to <strong>{email}</strong>
              </p>
              <p className="instructions">
                Please check your inbox and click the verification link to
                confirm your email address.
              </p>
              <p className="redirect-message">
                Redirecting to login in 3 seconds...
              </p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resend-email-page">
      <div className="resend-email-container">
        <div className="resend-email-card">
          <h1>Resend Verification Email</h1>
          <p className="subtitle">
            Enter your email address and we'll send you a new verification link.
          </p>

          <form onSubmit={handleSubmit} className="resend-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already verified? <Link to="/login">Log in here</Link>
            </p>
            <p>
              Need a new account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResendEmailPage;
