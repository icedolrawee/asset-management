const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const healthRoutes = require('./routes/health.routes');
const assetsRoutes = require('./routes/assets.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const departmentsRoutes = require('./routes/departments.routes');

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'http://localhost:4000'],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : 'http://localhost:4200' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.get('/', (_req, res) => res.json({ success: true, message: 'Asset Management API' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/assets', assetsRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'ไม่พบ API ที่ร้องขอ' }));
app.use((error, _req, res, _next) => {
  console.error('[API error]', error.message);
  const status = error instanceof require('multer').MulterError ? 400 : 500;
  res.status(status).json({ success: false, message: status === 400 ? 'ไฟล์ภาพไม่ถูกต้องหรือมีขนาดเกิน 5 MB' : process.env.NODE_ENV === 'production' ? 'เกิดข้อผิดพลาดภายในระบบ' : error.message });
});
module.exports = app;
