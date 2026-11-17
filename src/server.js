require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters. Set it in .env.');
  await connectDB();
  app.listen(PORT, () => console.log(`Industry Portal running at http://localhost:${PORT}`));
}
start().catch((error) => { console.error('Startup failed:', error.message); process.exit(1); });
