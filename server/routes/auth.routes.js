const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { attachUser, isAdminRole } = require("../middleware/role.middleware");

const { sendVerificationEmail, sendWelcomeEmail, sendArtistApplicationEmail, sendPasswordResetEmail } = require("../utils/email");
const { uploadProfile, processAndUploadProfilePicture } = require("../utils/r2");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

const saltRounds = 12;

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Important: For Netlify (Frontend) + Render (Backend), we need 'none' to allow cross-site cookies
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// POST /auth/signup - Create a new user
router.post(
  "/signup",
  authLimiter,
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("userName").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password")
      .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/)
      .withMessage(
        "Password must have at least 8 characters and contain at least one number, one lowercase, one uppercase letter and one special character."
      ),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { firstName, lastName, userName, email, password, intent } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { userName: userName.toLowerCase() }],
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({ error: "Email already registered." });
        }
        return res.status(400).json({ error: "Username already taken." });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, saltRounds);

      // Create user instance
      const newUser = new User({
        firstName,
        lastName,
        userName: userName.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        // If intent is to apply as artist, set role to artist and status to incomplete
        role: intent === 'apply_artist' ? 'artist' : 'user',
        artistStatus: intent === 'apply_artist' ? 'incomplete' : 'none',
      });

      // Generate email verification token using the new user's _id
      const emailVerificationToken = jwt.sign({ userId: newUser._id }, process.env.TOKEN_SECRET, {
        expiresIn: "24h",
      });

      // Assign token to user
      newUser.emailVerificationToken = emailVerificationToken;
      newUser.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save user to database
      await newUser.save();

      // Send verification email
      let verificationLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email/${emailVerificationToken}`;
      
      // Append redirect intent if provided (e.g. for artist application)
      if (intent === 'apply_artist') {
          verificationLink += '?next=/apply-artist';
      }

      // Send verification email asynchronously (fire and forget)
      // This prevents the signup process from hanging if the email service is slow/down
      sendVerificationEmail(newUser.email, newUser.firstName, verificationLink, newUser._id)
        .catch(emailError => {
          console.error("Failed to send verification email:", emailError);
          // Email failure shouldn't block signup success
        });

      // Remove password from response
      const userResponse = {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
        artistStatus: newUser.artistStatus,
        isEmailVerified: newUser.isEmailVerified,
      };

      res.status(201).json({
        data: userResponse,
        message: "Registration successful. Please check your email to verify your address.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/login - Login user
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          error: "Please verify your email address before logging in.",
          requiresEmailVerification: true,
          userId: user._id,
        });
      }

      // Check password
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Create JWT payload
      const payload = {
        _id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        artistStatus: user.artistStatus,
      };

      // Sign token
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      });

      // Set HTTP-only cookie
      res.cookie("authToken", authToken, getCookieOptions());

      // Return user data (without password)
      const userResponse = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        artistStatus: user.artistStatus,
        artistInfo: user.role === "artist" ? user.artistInfo : undefined,
        isEmailVerified: user.isEmailVerified,
        storage: user.storage,
      };

      res.status(200).json({ 
        data: userResponse,
        csrfToken: req.cookies["csrf_token"]
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/logout - Logout user
router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  res.status(200).json({ message: "Logged out successfully." });
});

// GET /auth/verify - Verify JWT and return user data
router.get("/verify", isAuthenticated, attachUser, (req, res) => {
  const userResponse = {
    _id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    userName: req.user.userName,
    email: req.user.email,
    profilePicture: req.user.profilePicture,
    role: req.user.role,
    artistStatus: req.user.artistStatus,
    artistInfo: req.user.role === "artist" ? req.user.artistInfo : undefined,
    isEmailVerified: req.user.isEmailVerified,
    favorites: req.user.favorites || [],
    storage: req.user.storage,
  };

  res.status(200).json({ 
    data: userResponse,
    csrfToken: req.cookies["csrf_token"] 
  });
});

// GET /auth/csrf-token - Get current CSRF token
router.get("/csrf-token", (req, res) => {
  res.status(200).json({ csrfToken: req.cookies["csrf_token"] });
});

// POST /auth/verify-email - Verify email with token
router.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required." });
    }

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token." });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName, user._id);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(200).json({
      message: "Email verified successfully! You can now log in.",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/resend-verification-email - Resend verification email
router.post("/resend-verification-email", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified." });
    }

    // Generate new verification token
    const emailVerificationToken = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "24h",
    });

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email/${emailVerificationToken}`;

    try {
      await sendVerificationEmail(user.email, user.firstName, verificationLink);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res
        .status(500)
        .json({ error: "Failed to send verification email. Please try again." });
    }

    res.status(200).json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/forgot-password - Request password reset
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetLink);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return res.status(500).json({ error: "Failed to send email." });
    }

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/reset-password - Reset password with token
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Missing credentials." });
    }

    // Validate password complexity
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/.test(password)) {
        return res.status(400).json({ error: "Password does not meet complexity requirements." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid token." });
    }

    const salt = await bcryptjs.genSalt(12);
    const hashedPassword = await bcryptjs.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/apply-artist - Submit artist registration
router.post(
  "/apply-artist",
  isAuthenticated,
  attachUser,
  uploadProfile.single("profilePicture"),
  processAndUploadProfilePicture,
  async (req, res, next) => {
  try {
    // Parse JSON fields from FormData
    const address = req.body.address ? JSON.parse(req.body.address) : {};
    const socialMedia = req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {};
    
    const { companyName, tagline, description, type, taxId, vatNumber, siret } = req.body;

    // Check if user is already an artist or has pending application
    if (req.user.artistStatus !== "none" && req.user.artistStatus !== "incomplete") {
      return res.status(400).json({
        error: `You already have an artist application with status: ${req.user.artistStatus}`,
      });
    }

    // Validate required fields for artist application
    if (!companyName) {
      return res.status(400).json({ error: "Company/Artist name is required." });
    }

    // Update user with artist info and set status to pending
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: "artist",
        artistStatus: "pending",
        profilePicture: req.uploadedFile ? req.uploadedFile.url : req.user.profilePicture,
        artistInfo: {
          companyName,
          tagline: tagline || "",
          description: description || "",
          type: type || "individual",
          taxId: taxId || "",
          vatNumber: vatNumber || "",
          siret: siret || "",
          address: address || {},
          socialMedia: socialMedia || {},
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    // Send application received email
    try {
      await sendArtistApplicationEmail(updatedUser.email, updatedUser.firstName, updatedUser._id);
    } catch (emailError) {
      console.error("Failed to send artist application email:", emailError);
    }

    // INTERNAL MESSAGING: Find ONLY superAdmin to notify
    try {
        // Find only superAdmin (not regular admins)
        const superAdmin = await User.findOne({ role: "superAdmin" });
        
        if (superAdmin) {
             // Direct link to user modal
             const reviewLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/user/${req.user._id}`;
             const adminMsgContent = `New Artist Application submitted by ${req.user.firstName} ${req.user.lastName} (${companyName}).\nType: ${type}\nTagline: ${tagline || "N/A"}\n\nReview application: ${reviewLink}`;
             const autoReplyContent = `Hello ${req.user.firstName}, we have received your artist application. We will review it shortly and get back to you soon!`;
             
             // Create/Find conversation with superAdmin
             const conversation = await Conversation.findOrCreateConversation([req.user._id, superAdmin._id]);
             
             // 1. Notification Message (System style from User -> SuperAdmin)
             const adminMsg = await Message.create({
                 conversation: conversation._id,
                 sender: req.user._id,
                 content: adminMsgContent,
                 type: "system" 
             });
             await conversation.updateLastMessage(adminMsg);
             await conversation.incrementUnread(superAdmin._id);
             
             // 2. Auto-reply (SuperAdmin -> User)
             const autoReply = await Message.create({
                  conversation: conversation._id,
                  sender: superAdmin._id,
                  content: autoReplyContent,
                  type: "text"
             });
             await conversation.updateLastMessage(autoReply);
             await conversation.incrementUnread(req.user._id);
        }
    } catch (msgError) {
        console.error("Failed to create application messages:", msgError);
        // Don't block response
    }

    res.status(200).json({
      message: "Artist application submitted successfully. Awaiting verification.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /auth/update-artist-info - Update artist profile info (for artists)
router.patch("/update-artist-info", isAuthenticated, attachUser, async (req, res, next) => {
  try {
    // Allow artists, admins, and superAdmins
    if (req.user.role !== "artist" && !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: "Only artists and admins can update this info." });
    }

    const user = await User.findById(req.user._id);

    // Initialize artistInfo if it doesn't exist
    if (!user.artistInfo) {
      user.artistInfo = {};
    }

    // Update simple fields
    const simpleFields = ["companyName", "tagline", "description", "type", "taxId", "vatNumber"];
    for (const field of simpleFields) {
      if (req.body[field] !== undefined) {
        user.artistInfo[field] = req.body[field];
      }
    }

    // Update nested objects
    if (req.body.businessHours) {
      user.artistInfo.businessHours = req.body.businessHours;
    }
    if (req.body.socialMedia) {
      user.artistInfo.socialMedia = {
        ...user.artistInfo.socialMedia,
        ...req.body.socialMedia,
      };
    }
    if (req.body.policies) {
      user.artistInfo.policies = {
        ...user.artistInfo.policies,
        ...req.body.policies,
      };
    }

    // Handle address with geocoding
    if (req.body.address) {
      const addr = req.body.address;

      // Initialize address if it doesn't exist
      if (!user.artistInfo.address) {
        user.artistInfo.address = {};
      }

      // Update address fields
      if (addr.street !== undefined) user.artistInfo.address.street = addr.street;
      if (addr.streetNum !== undefined) user.artistInfo.address.streetNum = addr.streetNum;
      if (addr.zipCode !== undefined) user.artistInfo.address.zipCode = addr.zipCode;
      if (addr.city !== undefined) user.artistInfo.address.city = addr.city;
      if (addr.country !== undefined) user.artistInfo.address.country = addr.country;

      // If coordinates are explicitly provided (from map click), use them
      if (addr.location?.coordinates?.length === 2) {
        user.artistInfo.address.location = {
          type: "Point",
          coordinates: addr.location.coordinates,
        };
      } else if (addr.city || addr.country) {
        // Auto-geocode if address fields provided but no coordinates
        try {
          const { geocodeAddress, toGeoJSONPoint } = require("../utils/geolocation");
          const coords = await geocodeAddress({
            street: user.artistInfo.address.street,
            streetNum: user.artistInfo.address.streetNum,
            zipCode: user.artistInfo.address.zipCode,
            city: user.artistInfo.address.city,
            country: user.artistInfo.address.country,
          });

          if (coords) {
            user.artistInfo.address.location = toGeoJSONPoint(coords.lat, coords.lng);
          }
        } catch (geoError) {
          console.error("Geocoding failed:", geoError.message);
          // Continue without coordinates if geocoding fails
        }
      }
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ data: userResponse });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
