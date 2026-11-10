const crypto = require('crypto');

function sign(value) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'development-only-change-this-secret').update(value).digest('base64url');
}
function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: String(user.id), email: user.email, role: user.role, name: user.display_name || user.email, iat: now, exp: now + 8 * 60 * 60 })).toString('base64url');
  const input = header + '.' + payload;
  return input + '.' + sign(input);
}
function requireAuth(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  const parts = match[1].split('.');
  if (parts.length !== 3) return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  const input = parts[0] + '.' + parts[1];
  const expected = sign(input);
  const a = Buffer.from(parts[2]); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return res.status(401).json({ success: false, message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    req.user = { id: Number(payload.sub), email: payload.email, role: payload.role, display_name: payload.name };
    next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'เฉพาะ Admin เท่านั้นที่สามารถดำเนินการนี้ได้' });
  next();
}
module.exports = { createToken, requireAuth, requireAdmin };
