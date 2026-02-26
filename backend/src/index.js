require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const subjectRoutes = require('./routes/subject.routes');
const uploadRoutes = require('./routes/upload.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const announcementRoutes = require('./routes/announcement.routes');
const userRoutes = require('./routes/user.routes');

require('./config/passport.config');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/resources',     resourceRoutes);
app.use('/api/subjects',      subjectRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users',         userRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'EduSphere API' }));

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[EduSphere] Server running on port ${PORT}`));

module.exports = app;
