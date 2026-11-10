const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });
let tableReady;

function ensureProfileTable() {
  if (!tableReady) {
    tableReady = (async () => {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          position VARCHAR(255) NOT NULL DEFAULT '',
          room VARCHAR(100) NOT NULL DEFAULT '',
          floor VARCHAR(100) NOT NULL DEFAULT '',
          department VARCHAR(255) NOT NULL DEFAULT '',
          avatar_url VARCHAR(500) NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      const [columns] = await pool.execute("SHOW COLUMNS FROM user_profiles LIKE 'avatar_url'");
      if (!columns.length) await pool.execute('ALTER TABLE user_profiles ADD COLUMN avatar_url VARCHAR(500) NULL');
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[file.mimetype];
    callback(null, `user-${req.user.id}-${Date.now()}${extension || '.img'}`);
  },
});
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    callback(null, allowed.includes(file.mimetype));
  },
}).single('avatar');

function defaultsFor(user) {
  if (user.email === 'ice@gmail.com') {
    return { fullName: 'ดลรวี มุ้ยแก้ว', position: 'นักวิชาการคอมพิวเตอร์', room: '301', floor: '3', department: 'ฝ่ายเทคโนโลยีสารสนเทศ' };
  }
  if (user.email === 'gun@gmail.com') {
    return { fullName: 'กัน จอมพลัง', position: 'เจ้าหน้าที่บริหารงานทั่วไป', room: '302', floor: '3', department: 'ฝ่ายบริหารงานทั่วไป' };
  }
  return { fullName: user.display_name || user.email, position: '', room: '', floor: '', department: '' };
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    await ensureProfileTable();
    const [rows] = await pool.execute(
      'SELECT full_name AS fullName, position, room, floor, department, avatar_url AS avatarUrl FROM user_profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );
    if (rows.length) return res.json({ success: true, data: rows[0] });
    const profile = defaultsFor(req.user);
    await pool.execute(
      'INSERT INTO user_profiles (user_id, full_name, position, room, floor, department) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, profile.fullName, profile.position, profile.room, profile.floor, profile.department]
    );
    return res.json({ success: true, data: { ...profile, avatarUrl: null } });
  } catch (error) { next(error); }
});

router.put('/me', requireAuth, async (req, res, next) => {
  const profile = {
    fullName: String(req.body.fullName || '').trim(),
    position: String(req.body.position || '').trim(),
    room: String(req.body.room || '').trim(),
    floor: String(req.body.floor || '').trim(),
    department: String(req.body.department || '').trim(),
  };
  if (!profile.fullName || !profile.position || !profile.room || !profile.floor || !profile.department) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลโปรไฟล์ให้ครบทุกช่อง' });
  }
  if (profile.fullName.length > 255 || profile.position.length > 255 || profile.room.length > 100 || profile.floor.length > 100 || profile.department.length > 255) {
    return res.status(400).json({ success: false, message: 'ข้อมูลบางช่องยาวเกินกว่าที่ระบบรองรับ' });
  }
  try {
    await ensureProfileTable();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO user_profiles
        (user_id, full_name, position, room, floor, department)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        position = VALUES(position),
        room = VALUES(room),
        floor = VALUES(floor),
        department = VALUES(department)`,
        [
          req.user.id,
          profile.fullName,
          profile.position,
          profile.room,
          profile.floor,
          profile.department
        ]
      );

      await connection.execute(
        'UPDATE users SET display_name = ? WHERE id = ?',
        [profile.fullName, req.user.id]
      );

      const [userRows] = await connection.execute(
        'SELECT id, email, display_name FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      );

      if (!userRows.length || userRows[0].display_name !== profile.fullName) {
        throw new Error('ไม่สามารถอัปเดตชื่อในตาราง users ได้');
      }

      const [rows] = await connection.execute(
        'SELECT avatar_url AS avatarUrl FROM user_profiles WHERE user_id = ?',
        [req.user.id]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว',
        data: {
          ...profile,
          avatarUrl: rows[0]?.avatarUrl || null
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    next(error);
  }
});

router.post('/avatar', requireAuth, (req, res, next) => {
  uploadAvatar(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB' : 'ไฟล์ภาพไม่ถูกต้อง' });
      return next(error);
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ JPG, PNG หรือ WEBP' });
    try {
      await ensureProfileTable();
      const [rows] = await pool.execute('SELECT avatar_url AS avatarUrl FROM user_profiles WHERE user_id = ?', [req.user.id]);
      const oldUrl = rows[0]?.avatarUrl;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await pool.execute('UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?', [avatarUrl, req.user.id]);
      if (oldUrl && oldUrl.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(uploadDir, path.basename(oldUrl));
        if (oldPath !== req.file.path) fs.promises.unlink(oldPath).catch(() => { });
      }
      return res.json({ success: true, message: 'เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว', data: { avatarUrl } });
    } catch (dbError) {
      fs.promises.unlink(req.file.path).catch(() => { });
      return next(dbError);
    }
  });
});

module.exports = router;
