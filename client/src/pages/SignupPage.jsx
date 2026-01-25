import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./SignupPage.css";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await signup(userData);
      setSignupSuccess(true);
      toast.success(
        "Account created! Check your email to verify your address."
      );
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Signup failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {signupSuccess ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Account Created!</h2>
            <p>
              We've sent a verification email to{" "}
              <strong>{formData.email}</strong>
            </p>
            <p className="instructions">
              Please check your inbox and click the verification link to confirm
              your email address.
            </p>
            <p className="redirect-message">
              Redirecting to login in 5 seconds...
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
            <Link to="/resend-email" className="btn btn-secondary">
              Resend Email
            </Link>
          </div>
        ) : (
          <>
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="userName">Username</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  required
                  placeholder="johndoe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <p className="auth-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
