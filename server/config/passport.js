const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User.model");

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Helper to generate unique username
const generateUsername = async (baseName) => {
  let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Ensure min length 3
  if (username.length < 3) {
      username = username + Math.floor(Math.random() * 1000);
  }

  // Check if username exists
  let exists = await User.findOne({ userName: username });
  let counter = 1;
  const originalUsername = username;

  while (exists) {
    username = `${originalUsername}${counter}`;
    exists = await User.findOne({ userName: username });
    counter++;
  }
  return username;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if user exists with googleId
          const existingUser = await User.findOne({ googleId: profile.id });
          if (existingUser) {
            return done(null, existingUser);
          }

          // 2. Check if user exists with email
          const email = profile.emails?.[0]?.value;
          if (email) {
            const userByEmail = await User.findOne({ email: email.toLowerCase() });
            if (userByEmail) {
              // Link account
              userByEmail.googleId = profile.id;
              // Ensure email is verified if it matches Google
              if (!userByEmail.isEmailVerified) {
                  userByEmail.isEmailVerified = true;
              }
              await userByEmail.save();
              return done(null, userByEmail);
            }
          }

          // 3. Create new user
          if (!email) {
             return done(new Error("No email found in Google profile."));
          }

          const baseName = profile.displayName || profile.name?.givenName || "user";
          const userName = await generateUsername(baseName);

          const newUser = new User({
            firstName: profile.name?.givenName || "Google",
            lastName: profile.name?.familyName || "User",
            userName,
            email: email.toLowerCase(),
            googleId: profile.id,
            isEmailVerified: true,
            profilePicture: profile.photos?.[0]?.value || "",
          });

          await newUser.save();
          return done(null, newUser);

        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
    console.warn("Google Client ID/Secret not provided. Google OAuth disabled.");
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
        scope: ["user:email"],
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const existingUser = await User.findOne({ githubId: profile.id });
          if (existingUser) {
            return done(null, existingUser);
          }

          // GitHub emails handling
          let email = null;
          if (profile.emails && profile.emails.length > 0) {
              const primary = profile.emails.find(e => e.primary && e.verified);
              email = primary ? primary.value : profile.emails[0].value;
          }

          if (!email) {
              return done(new Error("No public email found in GitHub profile."));
          }

          const userByEmail = await User.findOne({ email: email.toLowerCase() });
          if (userByEmail) {
            userByEmail.githubId = profile.id;
             if (!userByEmail.isEmailVerified) {
                  userByEmail.isEmailVerified = true;
              }
            await userByEmail.save();
            return done(null, userByEmail);
          }

          const baseName = profile.username || profile.displayName || "user";
          const userName = await generateUsername(baseName);

          const nameParts = (profile.displayName || profile.username || "Github User").split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ") || "User";

          const newUser = new User({
            firstName,
            lastName,
            userName,
            email: email.toLowerCase(),
            githubId: profile.id,
            isEmailVerified: true,
            profilePicture: profile.photos?.[0]?.value || "",
          });

          await newUser.save();
          return done(null, newUser);

        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
    console.warn("GitHub Client ID/Secret not provided. GitHub OAuth disabled.");
}

module.exports = passport;
