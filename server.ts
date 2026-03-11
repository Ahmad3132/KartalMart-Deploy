console.log('Starting server.ts...');
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';

console.log('Imports successful');

const JWT_SECRET = process.env.JWT_SECRET || 'lucky-draw-secret-key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
const dbPath = path.resolve(dataDir, 'lucky_draw.db');
const db = new Database(dbPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT,
    nick_name TEXT,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    profile_picture TEXT,
    bio TEXT,
    whatsapp_integration_enabled INTEGER DEFAULT 1,
    multi_person_logic_enabled INTEGER DEFAULT 1,
    duplicate_tx_enabled INTEGER DEFAULT 1,
    require_all_approvals INTEGER DEFAULT 0,
    whatsapp_redirect_after_scan INTEGER DEFAULT 0,
    custom_role_id INTEGER,
    whatsapp_redirect_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    counter INTEGER DEFAULT 0,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    ticket_count INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    campaign_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    ticket_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    is_multi_person INTEGER DEFAULT 0,
    payment_type TEXT DEFAULT 'ONLINE',
    cash_reference_id TEXT,
    receipt_url TEXT,
    receipt_filename TEXT,
    created_by_user_id TEXT,
    name TEXT,
    mobile TEXT,
    address TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    generation_id TEXT NOT NULL,
    campaign_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    generated_by_nick TEXT,
    created_by_user_id TEXT,
    tx_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT NOT NULL,
    total_tickets_in_tx INTEGER DEFAULT 1,
    person_ticket_index INTEGER DEFAULT 1,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    printed_count INTEGER DEFAULT 0,
    last_printed_at DATETIME,
    last_printed_by TEXT,
    last_printed_by_nick TEXT
  );

  CREATE TABLE IF NOT EXISTS pending_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT,
    name TEXT,
    mobile TEXT,
    address TEXT,
    ticket_index INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    user_email TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    permissions TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sms_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    target_criteria TEXT,
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER,
    recipient_mobile TEXT,
    status TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    tx_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    status TEXT NOT NULL
  );
`);

// Migration: Add missing columns if they don't exist (for existing databases)
const migrations = [
  { table: 'users', column: 'name', type: 'TEXT' },
  { table: 'users', column: 'nick_name', type: 'TEXT' },
  { table: 'users', column: 'whatsapp_redirect_enabled', type: 'INTEGER DEFAULT 0' },
  { table: 'transactions', column: 'is_multi_person', type: 'INTEGER DEFAULT 0' },
  { table: 'transactions', column: 'payment_type', type: 'TEXT DEFAULT \'ONLINE\'' },
  { table: 'transactions', column: 'cash_reference_id', type: 'TEXT' },
  { table: 'transactions', column: 'receipt_url', type: 'TEXT' },
  { table: 'transactions', column: 'receipt_filename', type: 'TEXT' },
  { table: 'transactions', column: 'created_by_user_id', type: 'TEXT' },
  { table: 'transactions', column: 'name', type: 'TEXT' },
  { table: 'transactions', column: 'mobile', type: 'TEXT' },
  { table: 'transactions', column: 'address', type: 'TEXT' },
  { table: 'users', column: 'whatsapp_integration_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'multi_person_logic_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'duplicate_tx_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'require_all_approvals', type: 'INTEGER DEFAULT 0' },
  { table: 'users', column: 'whatsapp_redirect_after_scan', type: 'INTEGER DEFAULT 0' },
  { table: 'users', column: 'custom_role_id', type: 'INTEGER' },
  { table: 'users', column: 'profile_picture', type: 'TEXT' },
  { table: 'users', column: 'bio', type: 'TEXT' },
  { table: 'tickets', column: 'generation_id', type: 'TEXT' },
  { table: 'tickets', column: 'generated_by_nick', type: 'TEXT' },
  { table: 'tickets', column: 'total_tickets_in_tx', type: 'INTEGER DEFAULT 1' },
  { table: 'tickets', column: 'person_ticket_index', type: 'INTEGER DEFAULT 1' },
  { table: 'tickets', column: 'last_printed_by_nick', type: 'TEXT' },
  { table: 'tickets', column: 'created_by_user_id', type: 'TEXT' },
  { table: 'tickets', column: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
];

for (const m of migrations) {
  try {
    db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
  } catch (e) {
    // Column likely already exists
  }
}

// Seed initial data
const seedUsers = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (seedUsers.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);
  insertUser.run('admin@example.com', adminPassword, 'Admin', 'Active');
  insertUser.run('user@example.com', userPassword, 'User', 'Active');
  
  // Add user's email from context if provided
  const userEmail = 'Muhammadahmad3132.MA@gmail.com';
  if (userEmail) {
    insertUser.run(userEmail, adminPassword, 'Admin', 'Active');
  }
} else {
  // Ensure the specific user exists even if already seeded
  const userEmail = 'Muhammadahmad3132.MA@gmail.com';
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail);
  if (!existing) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)').run(userEmail, adminPassword, 'Admin', 'Active');
  }
}

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    
    // Check if user is still active
    const dbUser = db.prepare('SELECT status FROM users WHERE email = ?').get(user.email) as any;
    if (!dbUser || dbUser.status !== 'Active') {
      return res.status(403).json({ error: 'Account disabled' });
    }
    
    req.user = user;
    next();
  });
};

// Multer setup for file uploads (Already defined above)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const seedPackages = db.prepare('SELECT count(*) as count FROM packages').get() as { count: number };
if (seedPackages.count === 0) {
  const insertPackage = db.prepare('INSERT INTO packages (name, amount, ticket_count, status) VALUES (?, ?, ?, ?)');
  insertPackage.run('Basic Package', 10, 1, 'Active');
  insertPackage.run('Standard Package', 50, 6, 'Active');
  insertPackage.run('Premium Package', 100, 15, 'Active');
}

const seedSettings = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
if (seedSettings.count === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('require_all_approvals', 'false');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('whatsapp_enabled', 'true');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('multi_person_enabled', 'true');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('duplicate_tx_enabled', 'true');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('sms_enabled', 'false');
} else {
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('require_all_approvals', 'false');
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('duplicate_tx_enabled', 'true');
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('sms_enabled', 'false');
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('multi_person_enabled', 'true');
}

async function startServer() {
  console.log('Initializing startServer...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  console.log('Express JSON middleware added');

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // --- API Routes ---

  // Users management
  app.get('/api/users/me', authenticateToken, (req: any, res: any) => {
    const user = db.prepare('SELECT email, name, nick_name, role, status, profile_picture, bio, whatsapp_redirect_enabled, whatsapp_integration_enabled, multi_person_logic_enabled, duplicate_tx_enabled, require_all_approvals, whatsapp_redirect_after_scan, custom_role_id, created_at FROM users WHERE email = ?').get(req.user.email);
    res.json(user);
  });

  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.prepare('SELECT email, name, nick_name, role, status, profile_picture, bio, whatsapp_redirect_enabled, whatsapp_integration_enabled, multi_person_logic_enabled, duplicate_tx_enabled, require_all_approvals, whatsapp_redirect_after_scan, custom_role_id, created_at FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticateToken, (req, res) => {
    const { 
      email, password, name, nick_name, role, status, 
      whatsapp_redirect_enabled, whatsapp_integration_enabled, 
      multi_person_logic_enabled, duplicate_tx_enabled, 
      require_all_approvals, whatsapp_redirect_after_scan, custom_role_id 
    } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const redirectEnabled = whatsapp_redirect_enabled ? 1 : 0;
      const waInt = whatsapp_integration_enabled ? 1 : 0;
      const mpLogic = multi_person_logic_enabled ? 1 : 0;
      const dupTx = duplicate_tx_enabled ? 1 : 0;
      const reqApp = require_all_approvals ? 1 : 0;
      const waScan = whatsapp_redirect_after_scan ? 1 : 0;

      db.prepare(`
        INSERT INTO users (
          email, password, name, nick_name, role, status, 
          whatsapp_redirect_enabled, whatsapp_integration_enabled, 
          multi_person_logic_enabled, duplicate_tx_enabled, 
          require_all_approvals, whatsapp_redirect_after_scan, custom_role_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        email, hashedPassword, name, nick_name, role, status, 
        redirectEnabled, waInt, mpLogic, dupTx, reqApp, waScan, custom_role_id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/users/:email', authenticateToken, (req, res) => {
    const { email } = req.params;
    const { 
      role, status, password, name, nick_name, 
      whatsapp_redirect_enabled, whatsapp_integration_enabled, 
      multi_person_logic_enabled, duplicate_tx_enabled, 
      require_all_approvals, whatsapp_redirect_after_scan, custom_role_id 
    } = req.body;
    
    const redirectEnabled = whatsapp_redirect_enabled ? 1 : 0;
    const waInt = whatsapp_integration_enabled ? 1 : 0;
    const mpLogic = multi_person_logic_enabled ? 1 : 0;
    const dupTx = duplicate_tx_enabled ? 1 : 0;
    const reqApp = require_all_approvals ? 1 : 0;
    const waScan = whatsapp_redirect_after_scan ? 1 : 0;

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET 
          role = ?, status = ?, password = ?, name = ?, nick_name = ?, 
          whatsapp_redirect_enabled = ?, whatsapp_integration_enabled = ?, 
          multi_person_logic_enabled = ?, duplicate_tx_enabled = ?, 
          require_all_approvals = ?, whatsapp_redirect_after_scan = ?, custom_role_id = ? 
        WHERE email = ?
      `).run(
        role, status, hashedPassword, name, nick_name, 
        redirectEnabled, waInt, mpLogic, dupTx, reqApp, waScan, custom_role_id, email
      );
    } else {
      db.prepare(`
        UPDATE users SET 
          role = ?, status = ?, name = ?, nick_name = ?, 
          whatsapp_redirect_enabled = ?, whatsapp_integration_enabled = ?, 
          multi_person_logic_enabled = ?, duplicate_tx_enabled = ?, 
          require_all_approvals = ?, whatsapp_redirect_after_scan = ?, custom_role_id = ? 
        WHERE email = ?
      `).run(
        role, status, name, nick_name, 
        redirectEnabled, waInt, mpLogic, dupTx, reqApp, waScan, custom_role_id, email
      );
    }
    res.json({ success: true });
  });

  app.delete('/api/users/:email', authenticateToken, (req, res) => {
    const { email } = req.params;
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', authenticateToken, (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const obj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(obj);
  });

  app.put('/api/settings', authenticateToken, (req, res) => {
    const { key, value } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
    res.json({ success: true });
  });

  // Roles
  app.get('/api/roles', authenticateToken, (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    res.json(roles);
  });

  app.post('/api/roles', authenticateToken, (req, res) => {
    const { name, permissions } = req.body;
    try {
      const result = db.prepare('INSERT INTO roles (name, permissions) VALUES (?, ?)').run(name, JSON.stringify(permissions));
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/roles/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    db.prepare('UPDATE roles SET name = ?, permissions = ? WHERE id = ?').run(name, JSON.stringify(permissions), id);
    res.json({ success: true });
  });

  app.delete('/api/roles/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // SMS Marketing
  app.get('/api/sms-campaigns', authenticateToken, (req, res) => {
    const campaigns = db.prepare('SELECT * FROM sms_campaigns ORDER BY created_at DESC').all();
    res.json(campaigns);
  });

  app.post('/api/sms-marketing/send', authenticateToken, (req: any, res: any) => {
    const { name, message, criteria } = req.body;
    const currentUser = req.user;

    try {
      // 1. Create SMS Campaign
      const campaignResult = db.prepare('INSERT INTO sms_campaigns (name, message, target_criteria, status) VALUES (?, ?, ?, ?)')
        .run(name, message, JSON.stringify(criteria), 'Sent');
      const campaignId = campaignResult.lastInsertRowid;

      // 2. Find target customers
      let query = 'SELECT DISTINCT mobile FROM tickets WHERE mobile IS NOT NULL AND mobile != ""';
      const params: any[] = [];

      if (criteria.campaignId) {
        query += ' AND campaign_id = ?';
        params.push(criteria.campaignId);
      }

      const customers = db.prepare(query).all(...params) as any[];

      // 3. Log SMS (Simulated)
      const insertLog = db.prepare('INSERT INTO sms_logs (campaign_id, recipient_mobile, status) VALUES (?, ?, ?)');
      for (const customer of customers) {
        insertLog.run(campaignId, customer.mobile, 'Success');
      }

      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'SMS Marketing', `Bulk SMS "${name}" sent to ${customers.length} customers`, currentUser.email
      );

      res.json({ success: true, sentCount: customers.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', authenticateToken, (req, res) => {
    const logs = db.prepare(`
      SELECT al.*, u.nick_name 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_email = u.email 
      ORDER BY al.timestamp DESC
    `).all();
    res.json(logs);
  });

  // Printing
  app.post('/api/tickets/:id/print', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { user_email, role } = req.body;
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (role !== 'Admin' && ticket.printed_count > 0) {
      return res.status(403).json({ error: 'Ticket already printed. Only Admin can reprint.' });
    }

    const user = db.prepare('SELECT nick_name FROM users WHERE email = ?').get(user_email) as any;
    const nick = user?.nick_name || user_email;

    db.prepare('UPDATE tickets SET printed_count = printed_count + 1, last_printed_at = CURRENT_TIMESTAMP, last_printed_by = ?, last_printed_by_nick = ? WHERE id = ?')
      .run(user_email, nick, id);
    
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Print Ticket',
      `Ticket ID: ${ticket.ticket_id} printed by ${nick} (${user_email})`,
      user_email
    );

    res.json({ success: true });
  });

  // Auth
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      token, 
      email: user.email, 
      role: user.role, 
      name: user.name, 
      nick_name: user.nick_name,
      whatsapp_redirect_enabled: user.whatsapp_redirect_enabled === 1
    });
  });

  // Campaigns
  app.get('/api/campaigns', authenticateToken, (req, res) => {
    const campaigns = db.prepare('SELECT * FROM campaigns').all();
    res.json(campaigns);
  });

  app.get('/api/campaigns/active', authenticateToken, (req, res) => {
    const campaign = db.prepare("SELECT * FROM campaigns WHERE status = 'Active'").get();
    res.json(campaign || null);
  });

  app.post('/api/campaigns', authenticateToken, (req, res) => {
    const { name, start_date, end_date, status } = req.body;
    
    if (status === 'Active') {
      // Deactivate other campaigns
      db.prepare("UPDATE campaigns SET status = 'Closed'").run();
    }
    
    const result = db.prepare('INSERT INTO campaigns (name, start_date, end_date, status) VALUES (?, ?, ?, ?)').run(name, start_date, end_date, status);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/campaigns/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, name, start_date, end_date } = req.body;
    
    if (status === 'Active') {
      db.prepare("UPDATE campaigns SET status = 'Closed'").run();
    }
    
    if (name) {
      db.prepare('UPDATE campaigns SET status = ?, name = ?, start_date = ?, end_date = ? WHERE id = ?').run(status, name, start_date, end_date, id);
    } else {
      db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(status, id);
    }
    res.json({ success: true });
  });

  app.delete('/api/campaigns/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Packages
  app.get('/api/packages', authenticateToken, (req, res) => {
    const packages = db.prepare('SELECT * FROM packages').all();
    res.json(packages);
  });

  app.get('/api/packages/active', authenticateToken, (req, res) => {
    const packages = db.prepare("SELECT * FROM packages WHERE status = 'Active'").all();
    res.json(packages);
  });

  app.post('/api/packages', authenticateToken, (req, res) => {
    const { name, amount, ticket_count, status } = req.body;
    const result = db.prepare('INSERT INTO packages (name, amount, ticket_count, status) VALUES (?, ?, ?, ?)').run(name, amount, ticket_count, status);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/packages/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, name, amount, ticket_count } = req.body;
    if (name) {
      db.prepare('UPDATE packages SET status = ?, name = ?, amount = ?, ticket_count = ? WHERE id = ?').run(status, name, amount, ticket_count, id);
    } else {
      db.prepare('UPDATE packages SET status = ? WHERE id = ?').run(status, id);
    }
    res.json({ success: true });
  });

  app.delete('/api/packages/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM packages WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Transactions & Tickets
  app.post('/api/transactions', authenticateToken, upload.single('receipt'), (req: any, res: any) => {
    const { tx_id, user_email, package_id, is_multi_person: isMultiPersonRaw, participants: participantsRaw, payment_type, receipt_url, name, mobile, address } = req.body;
    const currentUser = req.user;
    const receipt_filename = req.file ? req.file.filename : null;
    
    const is_multi_person = isMultiPersonRaw === 'true' || isMultiPersonRaw === true;

    let participants = participantsRaw;
    if (typeof participants === 'string') {
      try {
        participants = JSON.parse(participants);
      } catch (e) {}
    }

    // Security: Users cannot act on behalf of other users
    if (currentUser.role !== 'Admin' && user_email !== currentUser.email) {
      return res.status(403).json({ error: 'Unauthorized: Cannot create transaction for another user' });
    }
    
    const campaign = db.prepare("SELECT * FROM campaigns WHERE status = 'Active'").get() as any;
    if (!campaign) {
      return res.status(400).json({ error: 'No active campaign found' });
    }

    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(package_id) as any;
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const userSettings = db.prepare('SELECT whatsapp_integration_enabled, multi_person_logic_enabled, duplicate_tx_enabled, require_all_approvals FROM users WHERE email = ?').get(currentUser.email) as any;
    
    const globalSettings = db.prepare('SELECT * FROM settings').all() as any[];
    const globalSettingsObj = globalSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const globalReqApp = globalSettingsObj['require_all_approvals'] === 'true';
    const globalDupTx = globalSettingsObj['duplicate_tx_enabled'] === 'true';
    const globalMultiPerson = globalSettingsObj['multi_person_enabled'] === 'true';

    const waIntEnabled = userSettings?.whatsapp_integration_enabled === 1;
    const mpLogicEnabled = (userSettings?.multi_person_logic_enabled === 1) && globalMultiPerson;
    const dupTxEnabled = (userSettings?.duplicate_tx_enabled === 1) && globalDupTx;
    const reqAppEnabled = (userSettings?.require_all_approvals === 1) || globalReqApp;

    if (is_multi_person && !mpLogicEnabled) {
      return res.status(400).json({ error: 'Multi-person transactions are not allowed for your account.' });
    }

    let finalTxId = tx_id;
    let cashReferenceId = null;
    if (payment_type === 'CASH') {
      cashReferenceId = `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      finalTxId = cashReferenceId;
    }

    // Check for duplicate transaction ID
    const existingTx = db.prepare('SELECT * FROM transactions WHERE tx_id = ?').get(finalTxId) as any;
    
    if (existingTx && !dupTxEnabled) {
      return res.status(400).json({ error: 'Duplicate Transaction ID is not allowed for your account.' });
    }

    // If approval is required OR it's a multi-person transaction, it goes to Pending
    if (reqAppEnabled || is_multi_person) {
      const reason = is_multi_person ? 'Multi-person transaction' : 'User requirement';

      db.prepare(`
        INSERT INTO transactions (tx_id, user_email, campaign_id, package_id, amount, ticket_count, status, is_multi_person, payment_type, receipt_url, receipt_filename, created_by_user_id, name, mobile, address, cash_reference_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(finalTxId, user_email, campaign.id, pkg.id, pkg.amount, pkg.ticket_count, 'Pending', is_multi_person ? 1 : 0, payment_type, receipt_url, receipt_filename, currentUser.email, name, mobile, address, cashReferenceId);
      
      // Store participants if multi-person
      if (is_multi_person && participants) {
        participants.forEach((p: any, idx: number) => {
          db.prepare(`
            INSERT INTO pending_participants (tx_id, name, mobile, address, ticket_index)
            VALUES (?, ?, ?, ?, ?)
          `).run(finalTxId, p.name, p.mobile, p.address, idx + 1);
        });
      }

      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'Transaction Pending', `Transaction ${finalTxId} pending approval (${reason})`, currentUser.email
      );
      
      return res.json({ status: 'Pending', message: 'Transaction submitted. Pending admin approval.' });
    } else {
      // Unique transaction or duplicate allowed without approval
      const status = 'Generated';
      const generationId = `GEN-${Date.now()}`;
      
      try {
        db.transaction(() => {
          db.prepare(`
            INSERT INTO transactions (tx_id, user_email, campaign_id, package_id, amount, ticket_count, status, is_multi_person, payment_type, receipt_url, receipt_filename, created_by_user_id, name, mobile, address, cash_reference_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(finalTxId, user_email, campaign.id, pkg.id, pkg.amount, pkg.ticket_count, status, is_multi_person ? 1 : 0, payment_type, receipt_url, receipt_filename, currentUser.email, name, mobile, address, cashReferenceId);
          
          const user = db.prepare('SELECT nick_name FROM users WHERE email = ?').get(user_email) as any;
          const nick = user?.nick_name || user_email;

          if (is_multi_person && participants && participants.length > 0) {
            participants.forEach((p: any, idx: number) => {
              generateTickets(campaign.id, user_email, finalTxId, 1, p.name, p.mobile, p.address, generationId, currentUser.email, nick, participants.length, idx + 1);
            });
          } else {
            generateTickets(campaign.id, user_email, finalTxId, pkg.ticket_count, name, mobile, address, generationId, currentUser.email, nick, pkg.ticket_count, 1);
          }

          db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
            'Create Transaction', `Transaction ${finalTxId} created and tickets generated`, currentUser.email
          );
        })();
        
        res.json({ success: true, tx_id: finalTxId });
      } catch (err: any) {
        console.error('Transaction creation error:', err);
        res.status(500).json({ error: 'Failed to create transaction and generate tickets: ' + err.message });
      }
    }
  });

  function generateTickets(campaignId: number, userEmail: string, txId: string, count: number, name: string, mobile: string, address: string, generationId: string, generatedBy: string, generatedByNick: string, totalTickets: number, personIndex: number) {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `${yy}${mm}`;

    const insertTicket = db.prepare('INSERT INTO tickets (ticket_id, generation_id, campaign_id, user_email, generated_by, generated_by_nick, created_by_user_id, tx_id, name, mobile, address, total_tickets_in_tx, person_ticket_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const updateCounter = db.prepare('UPDATE campaigns SET counter = ? WHERE id = ?');

    let campaign = db.prepare('SELECT counter FROM campaigns WHERE id = ?').get(campaignId) as any;
    let currentCounter = campaign.counter;

    for (let i = 0; i < count; i++) {
      currentCounter++;
      const ticketId = `${prefix}${String(currentCounter).padStart(4, '0')}`;
      const currentIndex = count > 1 ? i + 1 : personIndex;
      insertTicket.run(ticketId, generationId, campaignId, userEmail, generatedBy, generatedByNick, generatedBy, txId, name, mobile, address, totalTickets, currentIndex);
      
      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'Create Ticket',
        `Ticket ID: ${ticketId}, GenID: ${generationId}, TxID: ${txId}`,
        userEmail
      );
    }
    updateCounter.run(currentCounter, campaignId);
  }

  app.get('/api/transactions/pending', authenticateToken, (req, res) => {
    const txs = db.prepare("SELECT * FROM transactions WHERE status = 'Pending'").all();
    res.json(txs);
  });

  app.get('/api/transactions/user/:email', authenticateToken, (req, res) => {
    const { email } = req.params;
    const txs = db.prepare('SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC').all(email);
    res.json(txs);
  });

  app.put('/api/transactions/:id/approve', authenticateToken, (req: any, res: any) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can approve transactions' });
    }

    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    try {
      db.transaction(() => {
        db.prepare("UPDATE transactions SET status = 'Generated' WHERE id = ?").run(id);
        
        // Generate tickets now
        const generationId = `GEN-${Date.now()}`;
        const user = db.prepare('SELECT nick_name FROM users WHERE email = ?').get(tx.user_email) as any;
        const nick = user?.nick_name || tx.user_email;

        if (tx.is_multi_person) {
          const participants = db.prepare('SELECT * FROM pending_participants WHERE tx_id = ?').all(tx.tx_id) as any[];
          participants.forEach((p, idx) => {
            generateTickets(tx.campaign_id, tx.user_email, tx.tx_id, 1, p.name, p.mobile, p.address, generationId, currentUser.email, nick, participants.length, idx + 1);
          });
        } else {
          generateTickets(tx.campaign_id, tx.user_email, tx.tx_id, tx.ticket_count, tx.name, tx.mobile, tx.address, generationId, currentUser.email, nick, tx.ticket_count, 1);
        }

        db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
          'Approve Transaction', `Transaction ${tx.tx_id} approved and tickets generated`, currentUser.email
        );
      })();
      
      res.json({ success: true });
    } catch (err: any) {
      console.error('Approval error:', err);
      res.status(500).json({ error: 'Failed to approve transaction: ' + err.message });
    }
  });

  app.post('/api/transactions/:id/generate', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, mobile, address, user_email } = req.body;
    
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!tx || tx.status !== 'Approved') {
      return res.status(400).json({ error: 'Transaction not approved or not found' });
    }

    try {
      db.transaction(() => {
        const generationId = `GEN-${Date.now()}`;
        const user = db.prepare('SELECT nick_name FROM users WHERE email = ?').get(user_email || 'Admin') as any;
        const nick = user?.nick_name || user_email || 'Admin';

        generateTickets(tx.campaign_id, tx.user_email, tx.tx_id, tx.ticket_count, name, mobile, address, generationId, user_email || 'Admin', nick, tx.ticket_count, 1);
        db.prepare("UPDATE transactions SET status = 'Generated' WHERE id = ?").run(id);
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error('Generation error:', err);
      res.status(500).json({ error: 'Failed to generate tickets: ' + err.message });
    }
  });

  // Bulk Printing
  app.post('/api/tickets/bulk-print', authenticateToken, (req, res) => {
    const { ticketIds, user_email, role } = req.body;
    
    if (!ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({ error: 'Invalid ticket IDs' });
    }

    const results = [];
    const errors = [];

    for (const id of ticketIds) {
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
      if (!ticket) {
        errors.push(`Ticket ${id} not found`);
        continue;
      }

      if (role !== 'Admin' && ticket.printed_count > 0) {
        errors.push(`Ticket ${ticket.ticket_id} already printed`);
        continue;
      }

      const user = db.prepare('SELECT nick_name FROM users WHERE email = ?').get(user_email) as any;
      const nick = user?.nick_name || user_email;

      db.prepare('UPDATE tickets SET printed_count = printed_count + 1, last_printed_at = CURRENT_TIMESTAMP, last_printed_by = ?, last_printed_by_nick = ? WHERE id = ?')
        .run(user_email, nick, id);
      
      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'Print Ticket (Bulk)',
        `Ticket ID: ${ticket.ticket_id}`,
        user_email
      );
      results.push(ticket);
    }

    res.json({ success: true, printedCount: results.length, errors });
  });

  app.get('/api/tickets/verify/:ticketId', authenticateToken, (req: any, res: any) => {
    const { ticketId } = req.params;
    const ticket = db.prepare(`
      SELECT tk.*, tr.status as tx_status, tr.amount, tr.payment_type
      FROM tickets tk
      LEFT JOIN transactions tr ON tk.tx_id = tr.tx_id
      WHERE tk.ticket_id = ?
    `).get(ticketId) as any;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get user redirect setting
    const user = db.prepare('SELECT whatsapp_redirect_after_scan FROM users WHERE email = ?').get(req.user.email) as any;

    res.json({ 
      ticket, 
      whatsapp_redirect_enabled: user?.whatsapp_redirect_after_scan === 1 
    });
  });

  app.get('/api/tickets', authenticateToken, (req, res) => {
    const { page = 1, limit = 20, status, search, startDate, endDate, campaignId, month } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params: any[] = [];

    if (status) {
      if (status === 'Printed') {
        query += ' AND printed_count > 0';
      } else if (status === 'Unprinted') {
        query += ' AND printed_count = 0';
      } else if (status === 'Reprinted') {
        query += ' AND printed_count > 1';
      }
    }

    if (campaignId) {
      query += ' AND campaign_id = ?';
      params.push(campaignId);
    }

    if (month) {
      // month format: YYYY-MM
      query += " AND strftime('%Y-%m', date) = ?";
      params.push(month);
    }

    if (search) {
      query += ' AND (ticket_id LIKE ? OR name LIKE ? OR tx_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      // Add 23:59:59 to include the entire end day if it's just a date
      const end = endDate.toString().includes(' ') ? endDate : `${endDate} 23:59:59`;
      query += ' AND date <= ?';
      params.push(end);
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const tickets = db.prepare(query).all(...params);
    
    // Get total count for pagination
    let countQuery = 'SELECT count(*) as count FROM tickets WHERE 1=1';
    const countParams: any[] = [];
    if (status) {
      if (status === 'Printed') countQuery += ' AND printed_count > 0';
      else if (status === 'Unprinted') countQuery += ' AND printed_count = 0';
      else if (status === 'Reprinted') countQuery += ' AND printed_count > 1';
    }
    if (campaignId) {
      countQuery += ' AND campaign_id = ?';
      countParams.push(campaignId);
    }
    if (month) {
      countQuery += " AND strftime('%Y-%m', date) = ?";
      countParams.push(month);
    }
    if (search) {
      countQuery += ' AND (ticket_id LIKE ? OR name LIKE ? OR tx_id LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) {
      countQuery += ' AND date >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      const end = endDate.toString().includes(' ') ? endDate : `${endDate} 23:59:59`;
      countQuery += ' AND date <= ?';
      countParams.push(end);
    }
    const totalCount = (db.prepare(countQuery).get(...countParams) as any).count;

    res.json({ tickets, totalCount, totalPages: Math.ceil(totalCount / Number(limit)) });
  });

  app.put('/api/tickets/:id', authenticateToken, (req: any, res: any) => {
    const { id } = req.params;
    const { name, mobile, address } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can edit tickets' });
    }

    const oldTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!oldTicket) return res.status(404).json({ error: 'Ticket not found' });

    const changes = [];
    if (oldTicket.name !== name) changes.push(`Name: ${oldTicket.name} -> ${name}`);
    if (oldTicket.mobile !== mobile) changes.push(`Mobile: ${oldTicket.mobile} -> ${mobile}`);
    if (oldTicket.address !== address) changes.push(`Address: ${oldTicket.address} -> ${address}`);

    db.prepare('UPDATE tickets SET name = ?, mobile = ?, address = ? WHERE id = ?').run(name, mobile, address, id);
    
    if (changes.length > 0) {
      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'Edit Ticket',
        `Ticket ID: ${oldTicket.ticket_id} modified. Changes: ${changes.join(', ')}`,
        currentUser.email
      );
    }

    res.json({ success: true });
  });

  // Communication
  app.post('/api/tickets/:id/share/whatsapp', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { user_email } = req.body;
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Simulate WhatsApp sending
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Share WhatsApp',
      `Ticket ID: ${ticket.ticket_id}, Mobile: ${ticket.mobile}`,
      user_email
    );

    res.json({ success: true, message: 'WhatsApp message sent successfully' });
  });

  app.post('/api/tickets/:id/share/sms', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { user_email } = req.body;
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Simulate SMS sending
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Send SMS',
      `Ticket ID: ${ticket.ticket_id}, Mobile: ${ticket.mobile}`,
      user_email
    );

    res.json({ success: true, message: 'SMS sent successfully' });
  });

  app.post('/api/tickets/:id/share/pdf', authenticateToken, (req: any, res: any) => {
    const { id } = req.params;
    const user_email = req.user.email;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Send PDF',
      `Ticket ID: ${ticket.ticket_id} generated/shared as PDF`,
      user_email
    );

    res.json({ success: true });
  });

  app.post('/api/transactions/:txId/share/pdf', authenticateToken, (req: any, res: any) => {
    const { txId } = req.params;
    const user_email = req.user.email;

    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Send PDF Batch',
      `Transaction ID: ${txId} generated/shared as PDF batch`,
      user_email
    );

    res.json({ success: true });
  });

  app.get('/api/admin/customers', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const { search = '' } = req.query;
    
    const customers = db.prepare(`
      SELECT 
        mobile,
        name,
        address,
        COUNT(DISTINCT tx_id) as total_transactions,
        COUNT(id) as total_tickets,
        SUM(CASE WHEN person_ticket_index = 1 THEN (SELECT amount FROM transactions WHERE tx_id = tickets.tx_id) ELSE 0 END) as total_spent,
        MAX(date) as last_visit
      FROM tickets
      WHERE name LIKE ? OR mobile LIKE ? OR address LIKE ?
      GROUP BY mobile
      ORDER BY last_visit DESC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);

    res.json(customers);
  });

  app.get('/api/admin/customers/:mobile', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const { mobile } = req.params;
    
    const customer = db.prepare(`
      SELECT 
        mobile,
        name,
        address,
        COUNT(DISTINCT tx_id) as total_transactions,
        COUNT(id) as total_tickets,
        SUM(CASE WHEN person_ticket_index = 1 THEN (SELECT amount FROM transactions WHERE tx_id = tickets.tx_id) ELSE 0 END) as total_spent
      FROM tickets
      WHERE mobile = ?
      GROUP BY mobile
    `).get(mobile);

    const history = db.prepare(`
      SELECT 
        tk.*,
        tr.amount,
        tr.status,
        tr.payment_type,
        tr.is_multi_person
      FROM tickets tk
      LEFT JOIN transactions tr ON tk.tx_id = tr.tx_id
      WHERE tk.mobile = ?
      ORDER BY tk.date DESC
    `).all(mobile);

    res.json({ customer, history });
  });

  app.get('/api/tickets/user/:email', authenticateToken, (req, res) => {
    const { email } = req.params;
    const tickets = db.prepare('SELECT * FROM tickets WHERE user_email = ? ORDER BY date DESC').all(email);
    res.json(tickets);
  });

  app.get('/api/tickets/search', authenticateToken, (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    const ticket = db.prepare(`
      SELECT 
        tk.*, 
        tr.amount, 
        tr.status, 
        tr.payment_type, 
        tr.receipt_url,
        tr.is_multi_person
      FROM tickets tk
      LEFT JOIN transactions tr ON tk.tx_id = tr.tx_id
      WHERE tk.ticket_id = ? OR tk.tx_id = ?
    `).get(id, id) as any;

    if (!ticket) return res.status(404).json({ error: 'Ticket or Transaction not found' });
    res.json(ticket);
  });

  app.get('/api/reports/user/:email', authenticateToken, (req, res) => {
    const { email } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT 
        t.tx_id,
        tk.ticket_id,
        t.amount,
        tk.date,
        t.status,
        tk.printed_count,
        t.payment_type
      FROM transactions t
      LEFT JOIN tickets tk ON t.tx_id = tk.tx_id
      WHERE t.user_email = ?
    `;
    const params: any[] = [email];

    if (startDate) {
      query += " AND tk.date >= ?";
      params.push(startDate as string);
    }
    if (endDate) {
      query += " AND tk.date <= ?";
      params.push(endDate as string);
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM transactions t 
      LEFT JOIN tickets tk ON t.tx_id = tk.tx_id 
      WHERE t.user_email = ? 
      ${startDate ? 'AND tk.date >= ?' : ''} 
      ${endDate ? 'AND tk.date <= ?' : ''}
    `;
    const countParams: any[] = [email];
    if (startDate) countParams.push(startDate as string);
    if (endDate) countParams.push(endDate as string);
    
    const totalCount = (db.prepare(countQuery).get(...countParams) as any).count;

    query += " ORDER BY tk.date DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const reports = db.prepare(query).all(...params);
    res.json({ reports, totalCount });
  });

  app.get('/api/reports/user-stats', authenticateToken, (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    const stats = db.prepare(`
      SELECT 
        u.email, 
        u.name, 
        u.nick_name,
        (SELECT count(*) FROM tickets t WHERE t.user_email = u.email AND t.date LIKE ?) as today_count,
        (SELECT count(*) FROM tickets t WHERE t.user_email = u.email AND t.date LIKE ?) as month_count,
        (SELECT sum(amount) FROM transactions tr WHERE tr.user_email = u.email AND tr.status = 'Generated' AND tr.date LIKE ?) as today_revenue,
        (SELECT sum(amount) FROM transactions tr WHERE tr.user_email = u.email AND tr.status = 'Generated' AND tr.date LIKE ?) as month_revenue
      FROM users u
      WHERE u.role = 'User'
      LIMIT ? OFFSET ?
    `).all(todayStr + '%', monthStr + '%', todayStr + '%', monthStr + '%', Number(limit), offset);

    const totalCount = (db.prepare("SELECT count(*) as count FROM users WHERE role = 'User'").get() as any).count;

    res.json({ stats, totalCount, totalPages: Math.ceil(totalCount / Number(limit)) });
  });

  app.put('/api/users/profile', authenticateToken, upload.single('profile_picture'), (req: any, res: any) => {
    const { name, nick_name, bio } = req.body;
    const email = req.user.email;
    const profile_picture = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (profile_picture) {
      db.prepare('UPDATE users SET name = ?, nick_name = ?, bio = ?, profile_picture = ? WHERE email = ?')
        .run(name, nick_name, bio, profile_picture, email);
    } else {
      db.prepare('UPDATE users SET name = ?, nick_name = ?, bio = ? WHERE email = ?')
        .run(name, nick_name, bio, email);
    }
    res.json({ success: true });
  });

  app.get('/api/admin/stats/graphs', authenticateToken, (req, res) => {
    try {
      // Revenue Trend (Last 30 Days)
      const revenue = db.prepare(`
        SELECT date(date) as day, sum(amount) as total
        FROM transactions
        WHERE status = 'Generated' AND date >= date('now', '-30 days')
        GROUP BY day
        ORDER BY day ASC
      `).all();

      // Ticket Sales Trend
      const sales = db.prepare(`
        SELECT date(date) as day, count(*) as count
        FROM tickets
        WHERE date >= date('now', '-30 days')
        GROUP BY day
        ORDER BY day ASC
      `).all();

      // Online vs Offline
      const onlineVsOffline = db.prepare(`
        SELECT payment_type, count(*) as count
        FROM transactions
        WHERE status = 'Generated'
        GROUP BY payment_type
      `).all();

      // Customer Growth
      const growth = db.prepare(`
        SELECT date(created_at) as day, count(*) as count
        FROM users
        WHERE role = 'User' AND created_at >= date('now', '-30 days')
        GROUP BY day
        ORDER BY day ASC
      `).all();

      res.json({ revenue, sales, onlineVsOffline, growth });
    } catch (err: any) {
      console.error('Error fetching graph data:', err);
      res.status(500).json({ error: 'Failed to fetch graph data' });
    }
  });

  // Dashboard Stats
  app.get('/api/stats/admin', authenticateToken, (req, res) => {
    try {
      const activeCampaign = db.prepare("SELECT name FROM campaigns WHERE status = 'Active'").get() as any;
      const todayStr = new Date().toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7);
      
      const ticketsToday = (db.prepare('SELECT count(*) as c FROM tickets WHERE date LIKE ?').get(todayStr + '%') as any)?.c || 0;
      const ticketsMonth = (db.prepare('SELECT count(*) as c FROM tickets WHERE date LIKE ?').get(monthStr + '%') as any)?.c || 0;
      const pendingApprovals = (db.prepare("SELECT count(*) as c FROM transactions WHERE status = 'Pending'").get() as any)?.c || 0;
      const totalRevenue = (db.prepare("SELECT sum(amount) as s FROM transactions WHERE status = 'Generated'").get() as any)?.s || 0;
      const totalUsers = (db.prepare("SELECT count(*) as c FROM users WHERE role = 'User'").get() as any)?.c || 0;

      res.json({
        activeCampaign: activeCampaign ? activeCampaign.name : 'None',
        ticketsToday,
        ticketsMonth,
        pendingApprovals,
        totalRevenue,
        totalUsers
      });
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      res.status(500).json({ error: 'Failed to fetch admin stats', message: err.message });
    }
  });

  app.get('/api/stats/user/:email', authenticateToken, (req, res) => {
    try {
      const { email } = req.params;
      const todayStr = new Date().toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7);
      
      const ticketsToday = (db.prepare('SELECT count(*) as c FROM tickets WHERE user_email = ? AND date LIKE ?').get(email, todayStr + '%') as any)?.c || 0;
      const ticketsMonth = (db.prepare('SELECT count(*) as c FROM tickets WHERE user_email = ? AND date LIKE ?').get(email, monthStr + '%') as any)?.c || 0;
      const pendingTxs = (db.prepare("SELECT count(*) as c FROM transactions WHERE user_email = ? AND status = 'Pending'").get(email) as any)?.c || 0;
      const approvedTxs = (db.prepare("SELECT count(*) as c FROM transactions WHERE user_email = ? AND status = 'Generated'").get(email) as any)?.c || 0;

      res.json({
        ticketsToday,
        ticketsMonth,
        pendingTxs,
        approvedTxs
      });
    } catch (err: any) {
      console.error('Error fetching user stats:', err);
      res.status(500).json({ error: 'Failed to fetch user stats', message: err.message });
    }
  });

  // API 404 handler - MUST be before Vite/SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({ 
      error: 'Internal server error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SUCCESS: Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Failed to start server:', err);
  process.exit(1);
});
