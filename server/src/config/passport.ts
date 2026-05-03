import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-jwt-12345';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Only register Google strategy if real credentials are provided
if (
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET &&
  GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' &&
  GOOGLE_CLIENT_SECRET !== 'YOUR_GOOGLE_CLIENT_SECRET_HERE'
) {
  // Import prisma lazily to avoid circular dependency
  const { prisma } = require('../index');

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/api/auth/google/callback',
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), undefined);

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || 'Google User',
                password: '',
                role: 'CLIENT',
                approved: true,
              },
            });
          }

          const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
          return done(null, { user, token });
        } catch (err) {
          return done(err, undefined);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy registered');
} else {
  console.log('ℹ️  Google OAuth not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to enable it');
}

export default passport;
