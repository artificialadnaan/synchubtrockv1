import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { getCredential } from "./credentials";

export function initPassport() {
  passport.serializeUser((user: { id: string }, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.users.findById(id);
    done(null, user ?? null);
  });

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        const user = await storage.users.findByEmail(email);
        if (!user || !user.passwordHash) return done(null, false, { message: "Invalid email or password" });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      }
    )
  );

  const googleClientId = getCredential("google_client_id");
  const googleClientSecret = getCredential("google_client_secret");
  const publicUrl = getCredential("public_url") || process.env.PUBLIC_URL || "http://localhost:5000";

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${publicUrl}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"));
          let user = await storage.users.findByOAuth("google", profile.id);
          if (user) return done(null, user);
          user = await storage.users.findByEmail(email);
          if (user) {
            await storage.users.update(user.id, { oauthProvider: "google", oauthId: profile.id });
            return done(null, user);
          }
          user = await storage.users.create({
            email,
            role: "user",
            oauthProvider: "google",
            oauthId: profile.id,
          });
          return done(null, user);
        }
      )
    );
  }
}
