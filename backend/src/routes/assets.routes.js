const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'assets');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(new Error('รองรับไฟล์ภาพ JPG, PNG, WEBP หรือ GIF เท่านั้น'));
    }
    callback(null, true);
  },
});

router.get('/checkouts', requireAuth, async (req, res, next) => {
  try {
    const userScope = req.user.role === 'ADMIN' ? '' : ' AND c.borrower_user_id = ?';
    const params = req.user.role === 'ADMIN' ? [] : [req.user.id];
    const [rows] = await pool.execute(
      'SELECT c.id, c.asset_id AS assetId, c.borrower_user_id AS borrowerUserId, b.display_name AS borrowerName, b.email AS borrowerEmail, c.asset_number AS assetNumber, c.location, c.room, c.checked_out_at AS checkedOutAt, a.item_name AS itemName, a.serial_number AS serialNumber, a.image_path AS imagePath, a.status AS status, a.department AS departmentName, a.budget_year AS budgetYear FROM asset_checkouts c INNER JOIN assets a ON a.id = c.asset_id LEFT JOIN users b ON b.id = c.borrower_user_id WHERE c.returned_at IS NULL' + userScope + ' ORDER BY c.checked_out_at DESC, c.id DESC',
      params,
    );
    return res.json({ success: true, data: rows });
  } catch (error) { next(error); }
});

router.delete('/checkouts/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'รหัสรายการเบิกไม่ถูกต้อง' });
  try {
    const [result] = await pool.execute('DELETE FROM asset_checkouts WHERE id = ? AND returned_at IS NULL', [id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบรายการเบิกที่ยังใช้งานอยู่' });
    return res.json({ success: true, message: 'ยกเลิกการเบิกครุภัณฑ์เรียบร้อยแล้ว' });
  } catch (error) { next(error); }
});

router.put('/checkouts/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'รหัสรายการเบิกไม่ถูกต้อง' });
  }

  const borrowerUserId = Number(req.body.borrowerUserId);
  const location = String(req.body.location || '').trim();
  const room = String(req.body.room || '').trim();
  if (!Number.isInteger(borrowerUserId) || borrowerUserId < 1 || !location || !room) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกบัญชีผู้ใช้งาน สถานที่ และห้องให้ครบถ้วน' });
  }
  if (location.length > 255 || room.length > 100) {
    return res.status(400).json({ success: false, message: 'ข้อมูลบางช่องยาวเกินกว่าที่ระบบรองรับ' });
  }

  try {
    const [users] = await pool.execute("SELECT id, display_name FROM users WHERE id = ? AND role = 'USER' AND is_active = 1 LIMIT 1", [borrowerUserId]);
    if (!users.length) return res.status(400).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่เลือก หรือบัญชีถูกปิดใช้งาน' });
    const borrowerName = String(users[0].display_name || '').trim();
    if (!borrowerName) return res.status(400).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ยังไม่มีชื่อ-นามสกุลในระบบ' });
    const [result] = await pool.execute(
      'UPDATE asset_checkouts c INNER JOIN assets a ON a.id = c.asset_id SET c.borrower_user_id = ?, c.borrower_name = ?, c.asset_number = a.asset_number, c.location = ?, c.room = ? WHERE c.id = ? AND c.returned_at IS NULL',
      [borrowerUserId, borrowerName, location, room, id],
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT id FROM asset_checkouts WHERE id = ? LIMIT 1', [id]);
      return res.status(rows.length ? 409 : 404).json({
        success: false,
        message: rows.length ? 'รายการเบิกนี้ไม่อยู่ในสถานะที่แก้ไขได้' : 'ไม่พบรายการเบิกที่ต้องการแก้ไข',
      });
    }
    return res.json({ success: true, message: 'แก้ไขรายการเบิกครุภัณฑ์สำเร็จ', data: { id, borrowerUserId, borrowerName, location, room } });
  } catch (error) { next(error); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;
    const conditions = []
    const params = [];
    if (search) {
      conditions.push('(a.item_name LIKE ? OR a.brand LIKE ? OR a.model LIKE ? OR a.serial_number LIKE ? OR a.asset_number LIKE ?)');
      const term = '%' + search + '%';
      params.push(term, term, term, term, term);
    }
    if (['ใช้งาน', 'ชำรุด', 'จำหน่าย'].includes(status)) { conditions.push('a.status = ?'); params.push(status); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM assets a ' + where, params);
    const sql = 'SELECT a.id, a.asset_number AS assetNumber, a.item_name AS itemName, a.brand, a.model, a.serial_number AS serialNumber, a.image_path AS imagePath, a.department AS departmentName, a.budget_year AS budgetYear, a.location, a.room, a.status, a.notes, a.created_at AS createdAt, a.updated_at AS updatedAt, CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS isCheckedOut, CASE WHEN ? = \'ADMIN\' OR c.borrower_user_id = ? THEN b.display_name ELSE NULL END AS borrowerName, c.asset_number AS checkoutAssetNumber, c.location AS checkoutLocation, c.room AS checkoutRoom, c.checked_out_at AS checkedOutAt FROM assets a LEFT JOIN asset_checkouts c ON c.asset_id = a.id AND c.returned_at IS NULL LEFT JOIN users b ON b.id = c.borrower_user_id ' + where + ' ORDER BY a.updated_at DESC, a.id DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.execute(sql, [req.user.role, req.user.id, ...params, pageSize, offset]);
    res.json({ success: true, data: rows, pagination: { page, pageSize, total: countRows[0].total } });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req, res, next) => {
  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let transactionStarted = false;
  try {
    const itemName = String(req.body.itemName || '').trim();
    const serialNumber = String(req.body.serialNumber || '').trim() || null;
    const assetNumber = String(req.body.assetNumber || '').trim() || null;
    const brand = String(req.body.brand || '').trim() || null;
    const model = String(req.body.model || '').trim() || null;
    const location = String(req.body.location || '').trim() || null;
    const room = String(req.body.room || '').trim() || null;
    const notes = String(req.body.notes || '').trim() || null;
    const departmentName = String(req.body.departmentName || '').trim();
    const budgetYearInput = req.body?.budgetYear ?? req.body?.budget_year ?? '';
    const budgetYearText = String(budgetYearInput).trim();
    const budgetYear = budgetYearText ? Number(budgetYearText) : null;

    if (!itemName || !assetNumber) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(400).json({ success: false, message: 'กรุณากรอกรายการครุภัณฑ์และเลขครุภัณฑ์ให้ครบถ้วน' });
    }
    if (itemName.length > 255 || (serialNumber && serialNumber.length > 255) || assetNumber.length > 100) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(400).json({ success: false, message: 'ข้อมูลบางช่องยาวเกินกว่าที่ระบบรองรับ' });
    }

    const [assetSerialRows] = serialNumber ? await connection.execute('SELECT id FROM assets WHERE serial_number = ? LIMIT 1', [serialNumber]) : [[]];
    if (assetSerialRows.length) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(409).json({ success: false, message: 'Serial Number นี้มีอยู่ในระบบหรือเคยถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง' });
    }
    if (assetNumber) {
      const [numberRows] = await connection.execute('SELECT id FROM assets WHERE asset_number = ? LIMIT 1', [assetNumber]);
      if (numberRows.length) {
        if (req.file) fs.unlink(req.file.path, () => { });
        return res.status(409).json({ success: false, message: 'เลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว' });
      }
    }

    if (departmentName.length > 255) throw new Error('ชื่อฝ่ายต้องมีความยาวไม่เกิน 255 ตัวอักษร');
    if (budgetYear !== null && (!Number.isInteger(budgetYear) || budgetYear < 2400 || budgetYear > 3000)) throw new Error('กรุณาระบุงบปีเป็น พ.ศ. ระหว่าง 2400 ถึง 3000');
    await connection.beginTransaction();
    transactionStarted = true;
    const imagePath = req.file ? '/uploads/assets/' + req.file.filename : null;
    const [result] = await connection.execute(
      'INSERT INTO assets (asset_number, item_name, brand, model, serial_number, image_path, department, budget_year, location, room, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [assetNumber, itemName, brand, model, serialNumber, imagePath, departmentName || null, budgetYear, location, room, 'ใช้งาน', notes],
    );
    await connection.execute('INSERT INTO asset_status_history (asset_id, old_status, new_status, note) VALUES (?, NULL, ?, ?)', [result.insertId, 'ใช้งาน', 'สร้างรายการครุภัณฑ์']);
    await connection.commit();
    transactionStarted = false;
    res.status(201).json({ success: true, message: 'เพิ่มครุภัณฑ์สำเร็จ', data: { id: result.insertId, itemName, serialNumber, imagePath, budgetYear } });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (req.file) fs.unlink(req.file.path, () => { });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Serial Number หรือเลขครุภัณฑ์ซ้ำกับข้อมูลที่มีอยู่แล้ว' });
    next(error);
  } finally {
    connection.release();
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'รหัสครุภัณฑ์ไม่ถูกต้อง' });
  }

  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let transactionStarted = false;
  let imagePath = null;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.execute(
      'SELECT image_path AS imagePath FROM assets WHERE id = ? FOR UPDATE',
      [id],
    );
    if (!rows.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการลบ' });
    }
    imagePath = rows[0].imagePath;

    await connection.execute('DELETE FROM asset_checkouts WHERE asset_id = ?', [id]);
    await connection.execute('DELETE FROM asset_status_history WHERE asset_id = ?', [id]);
    await connection.execute('DELETE FROM assets WHERE id = ?', [id]);

    await connection.commit();
    transactionStarted = false;

    if (imagePath) {
      const imageFile = path.resolve(__dirname, '..', '..', imagePath.replace(/^\/+/, ''));
      if (imageFile.startsWith(uploadDir + path.sep) && fs.existsSync(imageFile)) {
        fs.unlink(imageFile, (error) => {
          if (error) console.error('[Asset image cleanup]', error.message);
        });
      }
    }

    return res.json({ success: true, message: 'ลบครุภัณฑ์และข้อมูลที่เกี่ยวข้องอย่างถาวรเรียบร้อยแล้ว' });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const newStatus = String(req.body.status || '').trim();
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'รหัสครุภัณฑ์ไม่ถูกต้อง' });
  if (!['ใช้งาน', 'ชำรุด', 'จำหน่าย'].includes(newStatus)) {
    return res.status(400).json({ success: false, message: 'สถานะครุภัณฑ์ไม่ถูกต้อง' });
  }
  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [rows] = await connection.execute('SELECT status FROM assets WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการแก้ไข' });
    }
    const oldStatus = rows[0].status;
    if (oldStatus === newStatus) {
      await connection.commit();
      transactionStarted = false;
      return res.json({ success: true, message: 'สถานะครุภัณฑ์ไม่มีการเปลี่ยนแปลง', data: { id, status: newStatus } });
    }
    await connection.execute('UPDATE assets SET status = ? WHERE id = ?', [newStatus, id]);
    await connection.execute(
      'INSERT INTO asset_status_history (asset_id, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
      [id, oldStatus, newStatus, req.user?.id || null, 'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์'],
    );
    await connection.commit();
    transactionStarted = false;
    return res.json({ success: true, message: 'เปลี่ยนสถานะครุภัณฑ์สำเร็จ', data: { id, status: newStatus } });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.put('/:id', requireAuth, requireAdmin, upload.single('image'), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    if (req.file) fs.unlink(req.file.path, () => { });
    return res.status(400).json({ success: false, message: 'รหัสครุภัณฑ์ไม่ถูกต้อง' });
  }
  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let transactionStarted = false;
  try {
    const itemName = String(req.body.itemName || '').trim();
    const serialNumber = String(req.body.serialNumber || '').trim() || null;
    const assetNumber = String(req.body.assetNumber || '').trim() || null;
    const brand = String(req.body.brand || '').trim() || null;
    const model = String(req.body.model || '').trim() || null;
    const location = String(req.body.location || '').trim() || null;
    const room = String(req.body.room || '').trim() || null;
    const notes = String(req.body.notes || '').trim() || null;
    const departmentName = String(req.body.departmentName || '').trim();
    const budgetYearInput = req.body?.budgetYear ?? req.body?.budget_year ?? '';
    const budgetYearText = String(budgetYearInput).trim();
    const budgetYear = budgetYearText ? Number(budgetYearText) : null;
    console.log('[ASSET UPDATE budgetYear]', { id, bodyBudgetYear: req.body?.budgetYear, bodyBudgetYearSnake: req.body?.budget_year, parsedBudgetYear: budgetYear });

    if (!itemName || !assetNumber) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(400).json({ success: false, message: 'กรุณากรอกรายการครุภัณฑ์และเลขครุภัณฑ์ให้ครบถ้วน' });
    }
    if (itemName.length > 255 || (serialNumber && serialNumber.length > 255) || assetNumber.length > 100) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(400).json({ success: false, message: 'ข้อมูลบางช่องยาวเกินกว่าที่ระบบรองรับ' });
    }

    const [existingRows] = await connection.execute('SELECT id, serial_number AS serialNumber, image_path AS imagePath FROM assets WHERE id = ? LIMIT 1', [id]);
    if (!existingRows.length) {
      if (req.file) fs.unlink(req.file.path, () => { });
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการแก้ไข' });
    }
    const existing = existingRows[0];
    if (serialNumber && serialNumber !== existing.serialNumber) {
      const [serialRows] = await connection.execute('SELECT id FROM assets WHERE serial_number = ? AND id <> ? LIMIT 1', [serialNumber, id]);
      if (serialRows.length) {
        if (req.file) fs.unlink(req.file.path, () => { });
        return res.status(409).json({ success: false, message: 'Serial Number นี้มีอยู่ในระบบหรือเคยถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง' });
      }
    }
    if (assetNumber) {
      const [numberRows] = await connection.execute('SELECT id FROM assets WHERE asset_number = ? AND id <> ? LIMIT 1', [assetNumber, id]);
      if (numberRows.length) {
        if (req.file) fs.unlink(req.file.path, () => { });
        return res.status(409).json({ success: false, message: 'เลขครุภัณฑ์นี้มีอยู่ในระบบแล้ว' });
      }
    }

    if (departmentName.length > 255) throw new Error('ชื่อฝ่ายต้องมีความยาวไม่เกิน 255 ตัวอักษร');
    if (budgetYear !== null && (!Number.isInteger(budgetYear) || budgetYear < 2400 || budgetYear > 3000)) throw new Error('กรุณาระบุงบปีเป็น พ.ศ. ระหว่าง 2400 ถึง 3000');
    await connection.beginTransaction();
    transactionStarted = true;
    const imagePath = req.file ? '/uploads/assets/' + req.file.filename : existing.imagePath;
    await connection.execute(
      'UPDATE assets SET asset_number = ?, item_name = ?, brand = ?, model = ?, serial_number = ?, image_path = ?, department = ?, budget_year = ?, location = ?, room = ?, notes = ? WHERE id = ?',
      [assetNumber, itemName, brand, model, serialNumber, imagePath, departmentName || null, budgetYear, location, room, notes, id],
    );
    const [[savedAsset]] = await connection.execute('SELECT budget_year AS budgetYear FROM assets WHERE id = ?', [id]);
    console.log('[ASSET UPDATE database result]', { id, requestedBudgetYear: budgetYear, savedBudgetYear: savedAsset?.budgetYear ?? null });
    const savedDepartment = { departmentName: departmentName || null };
    await connection.commit();
    transactionStarted = false;
    if (req.file && existing.imagePath) {
      const oldFile = path.join(__dirname, '..', '..', existing.imagePath.replace(/^\/+/, ''));
      if (oldFile.startsWith(uploadDir) && fs.existsSync(oldFile)) fs.unlink(oldFile, () => { });
    }
    res.json({ success: true, message: 'แก้ไขข้อมูลครุภัณฑ์สำเร็จ', data: { id, itemName, serialNumber, imagePath, departmentName: savedDepartment.departmentName, budgetYear: savedAsset?.budgetYear ?? null } });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (req.file) fs.unlink(req.file.path, () => { });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Serial Number หรือเลขครุภัณฑ์ซ้ำกับข้อมูลที่มีอยู่แล้ว' });
    next(error);
  } finally {
    connection.release();
  }
});


router.post('/:id/checkout', requireAuth, requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const borrowerUserId = Number(req.body.borrowerUserId);
  const location = String(req.body.location || '').trim();
  const room = String(req.body.room || '').trim();
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'รหัสครุภัณฑ์ไม่ถูกต้อง' });
  if (!Number.isInteger(borrowerUserId) || borrowerUserId < 1 || !location || !room) return res.status(400).json({ success: false, message: 'กรุณาเลือกบัญชีผู้ใช้งาน สถานที่ และห้องให้ครบถ้วน' });
  const connection = await pool.getConnection().catch(next);
  if (!connection) return;
  let started = false;
  try {
    await connection.beginTransaction();
    started = true;
    const [assets] = await connection.execute('SELECT id, status, asset_number AS assetNumber FROM assets WHERE id = ? FOR UPDATE', [id]);
    if (!assets.length) {
      await connection.rollback(); started = false;
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการเบิก' });
    }
    if (!assets[0].assetNumber) {
      await connection.rollback(); started = false;
      return res.status(400).json({ success: false, message: 'กรุณาเพิ่มเลขครุภัณฑ์ในข้อมูลครุภัณฑ์ก่อนทำรายการเบิก' });
    }
    if (assets[0].status !== 'ใช้งาน') {
      await connection.rollback(); started = false;
      return res.status(409).json({ success: false, message: 'เบิกได้เฉพาะครุภัณฑ์ที่มีสถานะใช้งานเท่านั้น' });
    }
    const [active] = await connection.execute('SELECT id FROM asset_checkouts WHERE asset_id = ? AND returned_at IS NULL LIMIT 1', [id]);
    if (active.length) {
      await connection.rollback(); started = false;
      return res.status(409).json({ success: false, message: 'ครุภัณฑ์รายการนี้ถูกเบิกไปแล้ว' });
    }
    const [users] = await connection.execute("SELECT id, display_name FROM users WHERE id = ? AND role = 'USER' AND is_active = 1 LIMIT 1", [borrowerUserId]);
    if (!users.length) {
      await connection.rollback(); started = false;
      return res.status(400).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่เลือก หรือบัญชีถูกปิดใช้งาน' });
    }
    const borrowerName = String(users[0].display_name || '').trim();
    if (!borrowerName) {
      await connection.rollback(); started = false;
      return res.status(400).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ยังไม่มีชื่อ-นามสกุลในระบบ' });
    }
    const [result] = await connection.execute(
      'INSERT INTO asset_checkouts (asset_id, checked_out_by, borrower_user_id, borrower_name, asset_number, location, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, borrowerUserId, borrowerName, assets[0].assetNumber, location, room],
    );
    await connection.commit(); started = false;
    return res.status(201).json({ success: true, message: 'บันทึกการเบิกครุภัณฑ์สำเร็จ', data: { id: result.insertId, assetId: id, borrowerUserId, borrowerName, assetNumber: assets[0].assetNumber, location, room, checkedOutAt: new Date().toISOString() } });
  } catch (error) {
    if (started) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'ครุภัณฑ์รายการนี้ถูกเบิกไปแล้ว' });
    next(error);
  } finally { connection.release(); }
});

router.get('/:id/checkout-history', requireAuth, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'รหัสครุภัณฑ์ไม่ถูกต้อง' });
  try {
    const userScope = req.user.role === 'ADMIN' ? '' : ' AND c.borrower_user_id = ?';
    const params = req.user.role === 'ADMIN' ? [id] : [id, req.user.id];
    const [rows] = await pool.execute(
      'SELECT c.id, c.borrower_user_id AS borrowerUserId, b.display_name AS borrowerName, c.asset_number AS assetNumber, c.location, c.room, c.checked_out_at AS checkedOutAt, c.returned_at AS returnedAt, u.email AS checkedOutBy FROM asset_checkouts c LEFT JOIN users u ON u.id = c.checked_out_by LEFT JOIN users b ON b.id = c.borrower_user_id WHERE c.asset_id = ?' + userScope + ' ORDER BY c.checked_out_at DESC',
      params,
    );
    return res.json({ success: true, data: rows });
  } catch (error) { next(error); }
});

module.exports = router;
