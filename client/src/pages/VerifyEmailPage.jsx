import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import "./VerifyEmailPage.css";

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        setLoading(true);
        const response = await authAPI.verifyEmail({ token });

        setVerified(true);
        setUserData(response.data.data);
        toast.success("Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        console.error("Email verification error:", err);
        const errorMessage =
          err.response?.data?.error ||
          "Failed to verify email. Token may have expired.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card">
          {loading ? (
            <div className="verify-loading">
              <div className="spinner"></div>
              <h2>Verifying your email...</h2>
              <p>Please wait while we verify your email address.</p>
            </div>
          ) : verified ? (
            <div className="verify-success">
              <div className="success-icon">✓</div>
              <h2>Email Verified!</h2>
              <p>
                Thank you, {userData?.firstName}! Your email has been
                successfully verified.
              </p>
              <p className="redirect-message">
                Redirecting to login in 3 seconds...
              </p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          ) : (
            <div className="verify-error">
              <div className="error-icon">✕</div>
              <h2>Verification Failed</h2>
              <p>{error}</p>
              <div className="error-actions">
                <Link to="/resend-email" className="btn btn-primary">
                  Resend Verification Email
                </Link>
                <Link to="/signup" className="btn btn-secondary">
                  Sign Up Again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
