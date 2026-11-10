const express = require('express');
const { checkDatabase } = require('../config/db');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ success: true, service: 'asset-management-api', status: 'ok' });
});

router.get('/db', async (_req, res, next) => {
  try {
    const result = await checkDatabase();
    res.json({
      success: true,
      message: 'Database connection successful',
      database: result.databaseName,
      connection: result.connected,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
