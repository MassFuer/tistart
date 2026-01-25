import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpg";
import { FaShoppingCart, FaUser, FaSignOutAlt, FaHeart, FaClipboardList, FaCog, FaPalette, FaUsers, FaTachometerAlt, FaCrown } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, isVerifiedArtist, isAdmin, isSuperAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Hide navbar on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
      setIsMenuOpen(false);
      setIsProfileOpen(false);
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="navbar"
    >
      <div className="navbar-header">
        <div className="navbar-brand">
          <NavLink to="/" onClick={closeMenu}>
            <img src={logo} alt="Nemesis Logo" className="navbar-logo" />
          </NavLink>
          <NavLink to="/" onClick={closeMenu}>
            Nemesis
          </NavLink>
        </div>

        <div className="navbar-mobile-controls">
          {isAuthenticated && (
            <NavLink to="/cart" className="cart-icon-link" onClick={closeMenu}>
              <FaShoppingCart />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </NavLink>
          )}
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button
            className={`hamburger ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>

      <div className={`navbar-links ${isMenuOpen ? "active" : ""}`}>
        <NavLink to="/gallery" onClick={closeMenu}>
          Gallery
        </NavLink>
        <NavLink to="/events" onClick={closeMenu}>
          Events
        </NavLink>

        {isAuthenticated ? (
          <div className="navbar-user">
            {/* Cart Icon - Desktop */}
            <NavLink to="/cart" className="cart-icon-link desktop-only" onClick={closeMenu}>
              <FaShoppingCart />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </NavLink>

            {/* Profile Dropdown */}
            <div className="profile-dropdown" ref={profileRef}>
              <button className="profile-trigger" onClick={toggleProfile}>
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.firstName} className="navbar-avatar" />
                ) : (
                  <FaUser className="profile-icon" />
                )}
                <span className="profile-name">{user?.firstName}</span>
                <span className={`dropdown-arrow ${isProfileOpen ? "open" : ""}`}>▼</span>
              </button>

              {isProfileOpen && (
                <div className="profile-menu">
                  <NavLink to="/profile" onClick={closeMenu} className="menu-item">
                    <FaCog /> Profile
                  </NavLink>
                  <NavLink to="/my-orders" onClick={closeMenu} className="menu-item">
                    <FaClipboardList /> Orders
                  </NavLink>
                  <NavLink to="/favorites" onClick={closeMenu} className="menu-item">
                    <FaHeart /> Favorites
                  </NavLink>

                  {(isVerifiedArtist || isAdmin) && (
                    <>
                      <div className="menu-divider"></div>
                      <NavLink to="/dashboard" onClick={closeMenu} className="menu-item">
                        <FaTachometerAlt /> Dashboard
                      </NavLink>
                      <NavLink to="/my-artworks" onClick={closeMenu} className="menu-item">
                        <FaPalette /> {isAdmin ? "All Artworks" : "My Artworks"}
                      </NavLink>
                    </>
                  )}

                  {isAdmin && (
                    <NavLink to="/admin" onClick={closeMenu} className="menu-item">
                      <FaUsers /> Admin
                    </NavLink>
                  )}

                  {isSuperAdmin && (
                    <NavLink to="/superadmin" onClick={closeMenu} className="menu-item superadmin-item">
                      <FaCrown /> SuperAdmin
                    </NavLink>
                  )}

                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="menu-item logout-item">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle - Desktop */}
            <button
              onClick={toggleDarkMode}
              className="theme-toggle desktop-only"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        ) : (
          <div className="navbar-auth">
            <NavLink to="/login" onClick={closeMenu}>
              Login
            </NavLink>
            <NavLink to="/signup" className="btn-signup" onClick={closeMenu}>
              Sign Up
            </NavLink>
            <button
              onClick={toggleDarkMode}
              className="theme-toggle desktop-only"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;