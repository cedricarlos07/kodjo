import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { StorageFactory } from "./storage-factory";

// Obtenir l'instance de stockage
const storage = StorageFactory.getInstance();
import { User } from "@shared/schema";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

// Create a memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Create a rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

export function setupAuth(app: Express) {
  // Configure session management
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "edutrack-secret-key-" + Math.random().toString(36).substring(2, 15),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true",
        httpOnly: true, // Prevents client-side JS from reading the cookie
        sameSite: "strict", // Prevents the cookie from being sent in cross-site requests
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Initialize passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        // Check if the password is already hashed (starts with $2b$)
        let passwordMatches = false;

        if (user.password.startsWith('$2b$')) {
          // Password is hashed, use bcrypt to compare
          passwordMatches = await bcrypt.compare(password, user.password);
        } else {
          // Password is not hashed yet (legacy), compare directly
          // This is for backward compatibility during migration
          passwordMatches = user.password === password;

          // If password matches, hash it for future use
          if (passwordMatches) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await storage.updateUser(user.id, { password: hashedPassword });
            console.log(`Hashed password for user ${username}`);
          }
        }

        if (!passwordMatches) {
          return done(null, false, { message: "Incorrect password" });
        }

        // Update last login time
        await storage.updateUser(user.id, { lastLogin: new Date() });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Configure Passport serialization and deserialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Handle authentication with rate limiting
  app.post("/api/login",
    loginRateLimiter,
    passport.authenticate("local"),
    (req: Request, res: Response) => {
      // Authentication successful, return user info
      res.json({
        success: true,
        user: req.user
      });
    }
  );
}

// Middleware to authenticate JWT if present
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as User).role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: Admin access required" });
}
