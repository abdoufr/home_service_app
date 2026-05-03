import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { db } from './firebase';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-jwt-12345';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET &&
  GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' &&
  GOOGLE_CLIENT_SECRET !== 'YOUR_GOOGLE_CLIENT_SECRET_HERE'
) {
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

          const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
          let user: any;

          if (userSnapshot.empty) {
            const userRef = db.collection('users').doc();
            user = {
              id: userRef.id,
              email,
              name: profile.displayName || 'Google User',
              password: '',
              role: 'CLIENT',
              approved: true,
              createdAt: new Date().toISOString()
            };
            await userRef.set(user);
          } else {
            user = userSnapshot.docs[0].data();
          }

          const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
          return done(null, { user, token });
        } catch (err) {
          return done(err, undefined);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy registered (Firebase)');
}

export default passport;
