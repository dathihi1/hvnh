const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("./prisma");
const { USER_STATUS } = require("../utils/constants");
const { sendWelcomeEmail } = require("../utils/mailer");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Không lấy được email từ Google"), null);

        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId: profile.id }, { email }] },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              userName: profile.displayName || email.split("@")[0],
              email,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value || null,
              university: "Chưa cập nhật",
              status: USER_STATUS.ACTIVE,
            },
          });

          const studentRole = await prisma.role.findUnique({ where: { code: "student" } });
          if (studentRole) {
            await prisma.userRole.create({
              data: { userId: user.userId, roleId: studentRole.roleId },
            });
          }

          sendWelcomeEmail({ to: email, name: user.userName }).catch(() => {});
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { userId: user.userId },
            data: { googleId: profile.id },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
