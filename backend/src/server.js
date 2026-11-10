require('dotenv').config();
const app = require('./app');

const port = Number(process.env.PORT || 4000);

const server = app.listen(port, () => {
  console.log(`Asset Management API listening on http://localhost:${port}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
