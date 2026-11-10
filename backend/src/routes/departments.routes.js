const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT MIN(id) AS id, department AS name, 1 AS isActive FROM assets WHERE department IS NOT NULL AND TRIM(department) <> '' GROUP BY department ORDER BY department"
    );
    res.json({ success: true, data: rows.map(row => ({ ...row, code: row.name })) });
  } catch (error) { next(error); }
});

router.get('/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT u.id, u.email, COALESCE(NULLIF(u.display_name, ''), u.email) AS displayName, GROUP_CONCAT(udp.department_id ORDER BY udp.department_id) AS departmentIds FROM users u LEFT JOIN user_department_permissions udp ON udp.user_id = u.id WHERE u.is_active = 1 GROUP BY u.id, u.email, u.display_name ORDER BY displayName"
    );
    res.json({ success: true, data: rows.map(row => ({ ...row, departmentIds: row.departmentIds ? row.departmentIds.split(',').map(Number) : [] })) });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const code = String(req.body.code || '').trim();
  const name = String(req.body.name || '').trim();
  if (!code || !name || code.length > 50 || name.length > 255) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสฝ่ายและชื่อฝ่ายให้ถูกต้อง' });
  }
  try {
    const [result] = await pool.execute('INSERT INTO departments (code, name) VALUES (?, ?)', [code, name]);
    res.status(201).json({ success: true, message: 'เพิ่มฝ่ายสำเร็จ', data: { id: result.insertId, code, name, isActive: 1 } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'รหัสฝ่ายหรือชื่อฝ่ายนี้มีอยู่แล้ว' });
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const code = String(req.body.code || '').trim();
  const name = String(req.body.name || '').trim();
  const isActive = req.body.isActive === false || req.body.isActive === 0 ? 0 : 1;
  if (!Number.isInteger(id) || id < 1 || !code || !name || code.length > 50 || name.length > 255) {
    return res.status(400).json({ success: false, message: 'ข้อมูลฝ่ายไม่ถูกต้อง' });
  }
  try {
    const [result] = await pool.execute('UPDATE departments SET code = ?, name = ?, is_active = ? WHERE id = ?', [code, name, isActive, id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบฝ่ายที่ต้องการแก้ไข' });
    res.json({ success: true, message: 'แก้ไขข้อมูลฝ่ายสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'รหัสฝ่ายหรือชื่อฝ่ายนี้มีอยู่แล้ว' });
    next(error);
  }
});

router.put('/users/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const userId = Number(req.params.id);
  const ids = Array.isArray(req.body.departmentIds) ? [...new Set(req.body.departmentIds.map(Number))] : null;
  if (!Number.isInteger(userId) || userId < 1 || !ids || ids.some(id => !Number.isInteger(id) || id < 1)) {
    return res.status(400).json({ success: false, message: 'ข้อมูลฝ่ายของผู้ใช้งานไม่ถูกต้อง' });
  }
  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let started = false;
  try {
    await connection.beginTransaction(); started = true;
    const [users] = await connection.execute('SELECT id FROM users WHERE id = ? AND role = \'USER\' AND is_active = 1 FOR UPDATE', [userId]);
    if (!users.length) {
      await connection.rollback(); started = false;
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งาน' });
    }
    if (ids.length) {
      const [departments] = await connection.execute('SELECT id FROM departments WHERE is_active = 1 AND id IN (' + ids.map(() => '?').join(',') + ')', ids);
      if (departments.length !== ids.length) {
        await connection.rollback(); started = false;
        return res.status(400).json({ success: false, message: 'มีฝ่ายที่ไม่พบหรือถูกปิดใช้งาน' });
      }
    }
    await connection.execute('DELETE FROM user_department_permissions WHERE user_id = ?', [userId]);
    for (const departmentId of ids) {
      await connection.execute('INSERT INTO user_department_permissions (user_id, department_id) VALUES (?, ?)', [userId, departmentId]);
    }
    await connection.commit(); started = false;
    res.json({ success: true, message: 'กำหนดฝ่ายให้ผู้ใช้งานสำเร็จ', data: { userId, departmentIds: ids } });
  } catch (error) {
    if (started) await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

module.exports = router;
