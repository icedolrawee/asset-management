const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { createToken, requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const router = express.Router();
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'test-dev07@ru.ac.th').trim().toLowerCase();
const AUTHEN365_URL = process.env.AUTHEN365_URL || 'https://service-regisapps.ru.ac.th/authen365/login';
const SIMULATED_USERS = {
  'ice@gmail.com': {
    displayName: 'ดลรวี มุ้ยแก้ว'
  },
  'gun@gmail.com': {
    displayName: 'กัน จอมพลัง'
  }
};

const USER_TEST_PASSWORD = process.env.USER_TEST_PASSWORD || 'user1234';

router.post('/admin-login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    if (email !== ADMIN_EMAIL) return res.status(403).json({ success: false, message: 'บัญชีนี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบ Admin' });
    const response = await fetch(AUTHEN365_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ username: email, password }), signal: AbortSignal.timeout(15000) });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch { result = null; }
    const explicitlyAuthenticated = result && (result.success === true || result.valid === true || result.authenticated === true || result.status === 'success' || Boolean(result.token || result.access_token));
    if (!response.ok || !explicitlyAuthenticated || result.success === false || result.valid === false || result.authenticated === false || result.error || result.status === 'error') return res.status(401).json({ success: false, message: 'Authen365 ปฏิเสธการเข้าสู่ระบบ หรือส่งผลตอบกลับที่ระบบยังยืนยันไม่ได้' });
    const [rows] = await pool.execute('SELECT id, email, display_name, role, is_active FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
    let user;
    if (rows.length) {
      user = rows[0];
      if (!user.is_active || user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'บัญชี Admin ถูกปิดใช้งานหรือไม่มีสิทธิ์' });
      await pool.execute('UPDATE users SET auth_provider = ?, last_login_at = NOW() WHERE id = ?', ['AUTHEN365', user.id]);
    } else {
      const displayName = String(result.displayName || result.name || result.fullName || ADMIN_EMAIL).slice(0, 255);
      const [insert] = await pool.execute("INSERT INTO users (email, display_name, role, auth_provider, is_active, last_login_at) VALUES (?, ?, 'ADMIN', 'AUTHEN365', 1, NOW())", [ADMIN_EMAIL, displayName]);
      user = { id: insert.insertId, email: ADMIN_EMAIL, display_name: displayName, role: 'ADMIN', is_active: 1 };
    }
    return res.json({ success: true, token: createToken(user), user: { id: user.id, email: user.email, displayName: user.display_name || user.email, role: user.role } });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') return res.status(504).json({ success: false, message: 'เชื่อมต่อ Authen365 ไม่สำเร็จหรือใช้เวลานานเกินไป' });
    next(error);
  }
});

// Development-only User account with a fixed test credential.
router.post('/simulate-user-login', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบ API ที่ร้องขอ'
    });
  }

  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const account = SIMULATED_USERS[email];

    if (
      !account ||
      password.length !== USER_TEST_PASSWORD.length ||
      !crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(USER_TEST_PASSWORD)
      )
    ) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, email, display_name, role, is_active
             FROM users
             WHERE email = ?
             LIMIT 1`,
      [email]
    );

    let user;

    if (rows.length) {
      user = rows[0];

      if (!user.is_active || user.role !== 'USER') {
        return res.status(403).json({
          success: false,
          message: 'บัญชีไม่มีสิทธิ์เข้าใช้งาน'
        });
      }

      const existingDisplayName = String(user.display_name || '').trim();

      const displayName =
        existingDisplayName && existingDisplayName !== 'ผู้ใช้งานจำลอง'
          ? existingDisplayName
          : account.displayName;

      await pool.execute(
        `UPDATE users
                 SET display_name = ?, last_login_at = NOW()
                 WHERE id = ?`,
        [displayName, user.id]
      );

      user.display_name = displayName;

    } else {
      const [insert] = await pool.execute(
        `INSERT INTO users
                 (email, display_name, role, auth_provider, is_active, last_login_at)
                 VALUES (?, ?, 'USER', 'LOCAL', 1, NOW())`,
        [email, account.displayName]
      );

      user = {
        id: insert.insertId,
        email,
        display_name: account.displayName,
        role: 'USER',
        is_active: 1
      };
    }

    return res.json({
      success: true,
      simulated: true,
      token: createToken(user),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name || email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, user: req.user }));

// Admin-only list used by the checkout form to select the actual borrower account.
router.get('/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, display_name AS displayName FROM users WHERE role = 'USER' AND is_active = 1 ORDER BY display_name ASC, email ASC"
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
