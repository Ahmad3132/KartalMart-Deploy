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
    receipt_required INTEGER DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS account_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subcategories TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cash_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT NOT NULL,
    to_user TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    approved_by TEXT,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS account_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    source TEXT NOT NULL DEFAULT 'Manual',
    approved_by TEXT,
    approved_at DATETIME,
    rejection_reason TEXT,
    tx_reference TEXT,
    linked_tx_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS salary_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL UNIQUE,
    monthly_salary REAL NOT NULL DEFAULT 0,
    effective_from DATE,
    created_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
  );

  CREATE TABLE IF NOT EXISTS salary_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    month TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    approved_by TEXT,
    approved_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'Sale',
    customer_name TEXT,
    customer_mobile TEXT,
    customer_address TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    notes TEXT,
    due_date TEXT,
    paid_at DATETIME,
    transaction_id INTEGER,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'login',
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mobile, tag)
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
  { table: 'users', column: 'receipt_required', type: 'INTEGER DEFAULT 0' },
  { table: 'tickets', column: 'generation_id', type: 'TEXT' },
  { table: 'tickets', column: 'generated_by_nick', type: 'TEXT' },
  { table: 'tickets', column: 'total_tickets_in_tx', type: 'INTEGER DEFAULT 1' },
  { table: 'tickets', column: 'person_ticket_index', type: 'INTEGER DEFAULT 1' },
  { table: 'tickets', column: 'last_printed_by_nick', type: 'TEXT' },
  { table: 'tickets', column: 'created_by_user_id', type: 'TEXT' },
  { table: 'tickets', column: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  { table: 'account_transactions', column: 'user_email', type: 'TEXT' },
  { table: 'users', column: 'pdf_download_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'generate_ticket_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'scanner_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'bulk_print_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'users', column: 'reports_enabled', type: 'INTEGER DEFAULT 1' },
  { table: 'transactions', column: 'workflow_step', type: 'INTEGER DEFAULT 0' },
  { table: 'transactions', column: 'step1_user', type: 'TEXT' },
  { table: 'transactions', column: 'step2_user', type: 'TEXT' },
  { table: 'transactions', column: 'step1_completed_at', type: 'DATETIME' },
  { table: 'users', column: 'accounts_enabled', type: 'INTEGER DEFAULT 0' },
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

// Seed default account categories if none exist
const catCount = db.prepare('SELECT count(*) as count FROM account_categories').get() as any;
if (catCount.count === 0) {
  const ins = db.prepare('INSERT INTO account_categories (name, type, subcategories) VALUES (?, ?, ?)');
  ins.run('Ticket Sales',     'Cash In',  JSON.stringify(['Online','Cash','EasyPaisa','Bank Transfer']));
  ins.run('Other Income',     'Cash In',  JSON.stringify(['Refund','Misc']));
  ins.run('Operational Cost', 'Cash Out', JSON.stringify(['Rent','Utilities','Supplies']));
  ins.run('Salaries',         'Cash Out', JSON.stringify(['Staff','Commission']));
  ins.run('Marketing',        'Cash Out', JSON.stringify(['Digital','Print','Events']));
  ins.run('Other Expense',    'Cash Out', JSON.stringify(['Misc','Emergency']));
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
// Always seed new settings keys
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('pdf_watermark_enabled', 'true');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('pdf_color_mode', 'color');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('company_phone', '');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('company_email', '');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('company_website', '');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('pdf_qr_verification_enabled', 'true');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('allow_multiple_active_campaigns', 'false');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('workflow_type', 'flow1');

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
    const user = db.prepare('SELECT email, name, nick_name, role, status, profile_picture, bio, whatsapp_redirect_enabled, whatsapp_integration_enabled, multi_person_logic_enabled, duplicate_tx_enabled, require_all_approvals, whatsapp_redirect_after_scan, custom_role_id, pdf_download_enabled, generate_ticket_enabled, scanner_enabled, bulk_print_enabled, reports_enabled, receipt_required, accounts_enabled, created_at FROM users WHERE email = ?').get(req.user.email);
    res.json(user);
  });

  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.prepare('SELECT email, name, nick_name, role, status, profile_picture, bio, whatsapp_redirect_enabled, whatsapp_integration_enabled, multi_person_logic_enabled, duplicate_tx_enabled, require_all_approvals, whatsapp_redirect_after_scan, custom_role_id, pdf_download_enabled, generate_ticket_enabled, scanner_enabled, bulk_print_enabled, reports_enabled, receipt_required, accounts_enabled, created_at FROM users').all();
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
    const body = req.body;

    // Build dynamic update - only update fields that are present in the request
    const updates: string[] = [];
    const values: any[] = [];

    const boolFields = [
      'whatsapp_redirect_enabled', 'whatsapp_integration_enabled',
      'multi_person_logic_enabled', 'duplicate_tx_enabled',
      'require_all_approvals', 'whatsapp_redirect_after_scan',
      'pdf_download_enabled', 'generate_ticket_enabled',
      'scanner_enabled', 'bulk_print_enabled', 'reports_enabled',
      'receipt_required', 'accounts_enabled',
    ];

    const textFields = ['role', 'status', 'name', 'nick_name'];

    for (const field of textFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    for (const field of boolFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field] ? 1 : 0);
      }
    }

    if (body.custom_role_id !== undefined) {
      updates.push('custom_role_id = ?');
      values.push(body.custom_role_id);
    }

    if (body.password) {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(body.password, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(email);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE email = ?`).run(...values);
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

  app.put('/api/settings', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can modify settings' });
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
  app.post('/api/login', (req: any, res) => {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      // Log failed login
      try { db.prepare('INSERT INTO login_logs (user_email, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, 0)').run(email || 'unknown', 'login', ip, ua); } catch {}
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Log successful login
    try { db.prepare('INSERT INTO login_logs (user_email, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, 1)').run(email, 'login', ip, ua); } catch {}

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

    // Per-user receipt requirement check
    const receiptRequired = userSettings?.receipt_required === 1;
    if (receiptRequired && payment_type === 'ONLINE' && !req.file && !receipt_url) {
      return res.status(400).json({ error: 'A payment receipt (upload or URL) is required for your account.' });
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

          // Auto-create account Cash In record
          try {
            db.prepare(`
              INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, linked_tx_id, user_email)
              VALUES ('Cash In', ?, 'Ticket Sales', ?, ?, date('now'), ?, 'Approved', 'System', ?, datetime('now'), ?, ?)
            `).run(
              pkg.amount,
              payment_type || 'Online',
              `Ticket sale — TX: ${finalTxId} | ${is_multi_person ? 'Multi-person' : (name || 'Customer')}`,
              currentUser.email,
              currentUser.email,
              finalTxId,
              currentUser.email
            );
          } catch (accErr) {
            console.error('Account TX creation failed (non-critical):', accErr);
          }
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

        // Auto-create account transaction (Cash In from ticket sale)
        try {
          db.prepare(`
            INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, linked_tx_id, user_email)
            VALUES ('Cash In', ?, 'Ticket Sales', ?, ?, date('now'), ?, 'Approved', 'System', ?, datetime('now'), ?, ?)
          `).run(
            tx.amount,
            tx.payment_type || 'Online',
            `KARTAL MART ticket sale — TX: ${tx.tx_id} | ${tx.is_multi_person ? 'Multi-person' : (tx.name || 'Customer')}`,
            tx.user_email,
            currentUser.email,
            tx.tx_id,
            tx.user_email
          );
        } catch (accErr) {
          console.error('Account TX creation failed (non-critical):', accErr);
        }

        // Notify the user who created the transaction
        try {
          createNotification(tx.user_email, 'Transaction Approved', `Your transaction ${tx.tx_id} has been approved and tickets generated.`, 'success', '/user/tickets');
        } catch {}
      })();

      res.json({ success: true });
    } catch (err: any) {
      console.error('Approval error:', err);
      res.status(500).json({ error: 'Failed to approve transaction: ' + err.message });
    }
  });

  // REJECT Transaction
  app.put('/api/transactions/:id/reject', authenticateToken, (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can reject transactions' });
    }

    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (tx.status === 'Generated') {
      return res.status(400).json({ error: 'Cannot reject a transaction that already has tickets generated' });
    }

    try {
      db.prepare("UPDATE transactions SET status = 'Rejected' WHERE id = ?").run(id);
      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
        'Reject Transaction',
        `Transaction ${tx.tx_id} rejected. Reason: ${reason || 'No reason provided'}`,
        currentUser.email
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reject: ' + err.message });
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

  // ════════════════════════════════════════════
  // DUAL WORKFLOW (Flow 2) ENDPOINTS
  // ════════════════════════════════════════════

  // Flow 2 Step 1: Admin/authorized user creates entry
  app.post('/api/transactions/flow2/step1', authenticateToken, upload.single('receipt'), (req: any, res: any) => {
    try {
      const u = req.user;
      if (u.role !== 'Admin') return res.status(403).json({ error: 'Only Admin can create Flow 2 entries' });
      const { name, mobile, address, package_id, payment_type, tx_id, receipt_url, campaign_id } = req.body;
      if (!name || !mobile || !package_id) return res.status(400).json({ error: 'Name, mobile, and package are required' });

      const pkg = db.prepare('SELECT * FROM packages WHERE id=?').get(package_id) as any;
      if (!pkg) return res.status(400).json({ error: 'Package not found' });

      const campId = campaign_id || (db.prepare("SELECT id FROM campaigns WHERE status='Active' LIMIT 1").get() as any)?.id;
      if (!campId) return res.status(400).json({ error: 'No active campaign' });

      // Auto-generate cash TX ID if cash payment and no ID provided
      let finalTxId = tx_id;
      if (payment_type === 'CASH' && !finalTxId) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const seq = ((db.prepare("SELECT COUNT(*) as c FROM transactions WHERE cash_reference_id LIKE ?").get(`CASH-${today}%`) as any)?.c || 0) + 1;
        finalTxId = `CASH-${today}-${String(seq).padStart(4, '0')}`;
      }
      if (!finalTxId) finalTxId = `TX-${Date.now()}`;

      const receiptFilename = req.file ? req.file.filename : null;

      const r = db.prepare(`
        INSERT INTO transactions (tx_id, user_email, campaign_id, package_id, amount, ticket_count, status, payment_type, cash_reference_id, receipt_url, receipt_filename, name, mobile, address, workflow_step, step1_user, step1_completed_at, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, 'Flow2-Pending', ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), ?)
      `).run(
        finalTxId, u.email, campId, pkg.id, pkg.amount, pkg.ticket_count,
        payment_type || 'CASH', payment_type === 'CASH' ? finalTxId : null,
        receipt_url || null, receiptFilename, name, mobile, address || '',
        u.email, u.email
      );

      db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?,?,?)').run(
        'Flow2 Step1', `Created entry TX: ${finalTxId} for ${name}`, u.email
      );

      res.json({ id: r.lastInsertRowid, tx_id: finalTxId, status: 'Flow2-Pending' });
    } catch (e: any) {
      console.error('Flow2 Step1 error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Flow 2: Get pending step 2 entries
  app.get('/api/transactions/flow2/pending-step2', authenticateToken, (req: any, res: any) => {
    try {
      const rows = db.prepare("SELECT id, tx_id, package_id, amount, ticket_count, payment_type, workflow_step, step1_user, step1_completed_at, date FROM transactions WHERE status='Flow2-Pending' AND workflow_step=1 ORDER BY date DESC").all();
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Flow 2 Step 2: Operator completes (no access to payment/contact)
  app.put('/api/transactions/flow2/:id/step2', authenticateToken, (req: any, res: any) => {
    try {
      const u = req.user;
      const tx = db.prepare('SELECT * FROM transactions WHERE id=?').get(req.params.id) as any;
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
      if (tx.status !== 'Flow2-Pending') return res.status(400).json({ error: 'Not in Flow2-Pending state' });

      // Generate tickets
      const generationId = `GEN-${Date.now()}`;
      const nick = (db.prepare('SELECT nick_name FROM users WHERE email=?').get(u.email) as any)?.nick_name || u.email;

      db.transaction(() => {
        db.prepare("UPDATE transactions SET status='Generated', workflow_step=2, step2_user=? WHERE id=?").run(u.email, tx.id);

        // Generate tickets
        const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(tx.campaign_id) as any;
        if (campaign) {
          for (let i = 0; i < tx.ticket_count; i++) {
            const counter = ((db.prepare('SELECT counter FROM campaigns WHERE id=?').get(tx.campaign_id) as any)?.counter || 0) + 1;
            db.prepare('UPDATE campaigns SET counter=? WHERE id=?').run(counter, tx.campaign_id);
            const ticketId = `${campaign.name.substring(0, 3).toUpperCase()}-${String(counter).padStart(6, '0')}`;
            db.prepare(`
              INSERT INTO tickets (ticket_id, generation_id, campaign_id, user_email, generated_by, generated_by_nick, tx_id, name, mobile, address, total_tickets_in_tx, person_ticket_index, created_by_user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(ticketId, generationId, tx.campaign_id, tx.user_email, u.email, nick, tx.tx_id, tx.name, tx.mobile, tx.address || '', tx.ticket_count, i + 1, u.email);
          }
        }

        // Auto-create account transaction
        try {
          db.prepare(`
            INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, linked_tx_id, user_email)
            VALUES ('Cash In', ?, 'Ticket Sales', ?, ?, date('now'), ?, 'Approved', 'System', ?, datetime('now'), ?, ?)
          `).run(tx.amount, tx.payment_type || 'Cash', `KARTAL MART ticket sale — TX: ${tx.tx_id} | ${tx.name}`, tx.user_email, u.email, tx.tx_id, tx.user_email);
        } catch (accErr) { console.error('Flow2 account TX error:', accErr); }

        db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?,?,?)').run(
          'Flow2 Step2', `Completed entry TX: ${tx.tx_id}, tickets generated`, u.email
        );
      })();

      res.json({ success: true, tx_id: tx.tx_id });
    } catch (e: any) {
      console.error('Flow2 Step2 error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ════════════════════════════════════════════
  // ACCOUNTS MODULE
  // ════════════════════════════════════════════

  // GET categories
  app.get('/api/accounts/categories', authenticateToken, (req, res) => {
    const cats = db.prepare('SELECT * FROM account_categories ORDER BY type, name').all() as any[];
    res.json(cats.map(c => ({ ...c, subcategories: JSON.parse(c.subcategories || '[]') })));
  });

  // POST category
  app.post('/api/accounts/categories', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const { name, type, subcategories = [] } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    try {
      const r = db.prepare('INSERT INTO account_categories (name, type, subcategories) VALUES (?, ?, ?)').run(name, type, JSON.stringify(subcategories));
      res.json({ id: r.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to create category' });
    }
  });

  // PUT category
  app.put('/api/accounts/categories/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const { name, type, subcategories = [] } = req.body;
    db.prepare('UPDATE account_categories SET name=?, type=?, subcategories=? WHERE id=?').run(name, type, JSON.stringify(subcategories), req.params.id);
    res.json({ success: true });
  });

  // DELETE category
  app.delete('/api/accounts/categories/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    db.prepare('DELETE FROM account_categories WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // GET transactions
  app.get('/api/accounts/transactions', authenticateToken, (req: any, res: any) => {
    const u = req.user;
    let rows: any[];
    if (u.role === 'Admin' || u.role === 'Accountant') {
      rows = db.prepare('SELECT * FROM account_transactions ORDER BY date DESC, created_at DESC').all() as any[];
    } else {
      // Business partner — only approved
      rows = db.prepare("SELECT * FROM account_transactions WHERE status='Approved' ORDER BY date DESC").all() as any[];
    }
    res.json(rows);
  });

  // POST transaction
  app.post('/api/accounts/transactions', authenticateToken, (req: any, res: any) => {
    const u = req.user;
    if (u.role !== 'Admin' && u.role !== 'Accountant') return res.status(403).json({ error: 'No permission' });
    const { type, amount, category, subcategory, description, date, tx_reference } = req.body;
    if (!type || !amount || !category || !description || !date) return res.status(400).json({ error: 'Missing required fields' });
    // Admin auto-approves, Accountant stays Pending
    const status = u.role === 'Admin' ? 'Approved' : 'Pending';
    const approved_by = u.role === 'Admin' ? u.email : null;
    const r = db.prepare(`
      INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, tx_reference, user_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Manual', ?, ?, ?)`
    ).run(type, amount, category, subcategory||null, description, date, u.email, status, approved_by, tx_reference||null, u.email);
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run(
      'Account Transaction', `${type} PKR ${amount} [${category}] - ${description}`, u.email
    );
    res.json({ id: r.lastInsertRowid, status });
  });

  // PUT (edit) transaction
  app.put('/api/accounts/transactions/:id', authenticateToken, (req: any, res: any) => {
    const u = req.user;
    if (u.role !== 'Admin' && u.role !== 'Accountant') return res.status(403).json({ error: 'No permission' });
    const tx = db.prepare('SELECT * FROM account_transactions WHERE id=?').get(req.params.id) as any;
    if (!tx) return res.status(404).json({ error: 'Not found' });
    if (tx.status === 'Approved') return res.status(400).json({ error: 'Cannot edit an approved transaction' });
    const { type, amount, category, subcategory, description, date, tx_reference } = req.body;
    db.prepare(`UPDATE account_transactions SET type=?, amount=?, category=?, subcategory=?, description=?, date=?, tx_reference=? WHERE id=?`)
      .run(type, amount, category, subcategory||null, description, date, tx_reference||null, req.params.id);
    res.json({ success: true });
  });

  // DELETE transaction
  app.delete('/api/accounts/transactions/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const tx = db.prepare('SELECT * FROM account_transactions WHERE id=?').get(req.params.id) as any;
    if (tx?.status === 'Approved') return res.status(400).json({ error: 'Cannot delete approved transaction' });
    db.prepare('DELETE FROM account_transactions WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // APPROVE transaction
  app.put('/api/accounts/transactions/:id/approve', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    db.prepare("UPDATE account_transactions SET status='Approved', approved_by=?, approved_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(req.user.email, req.params.id);
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run('Approve Account TX', `Transaction ${req.params.id} approved`, req.user.email);
    res.json({ success: true });
  });

  // REJECT transaction
  app.put('/api/accounts/transactions/:id/reject', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const { reason } = req.body;
    db.prepare("UPDATE account_transactions SET status='Rejected', rejection_reason=? WHERE id=?").run(reason||null, req.params.id);
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?, ?, ?)').run('Reject Account TX', `Transaction ${req.params.id} rejected: ${reason}`, req.user.email);
    res.json({ success: true });
  });

  // ════════════════════════════════════════════
  // CASH IN HAND & TRANSFERS
  // ════════════════════════════════════════════

  // GET cash-in-hand per user
  app.get('/api/accounts/cash-in-hand', authenticateToken, (req: any, res: any) => {
    try {
      const calcUserCash = (email: string, name: string, nick_name: string, role: string) => {
        // All approved Cash In (includes ticket sales, transfer-in, capital investment)
        const cashIn = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM account_transactions WHERE user_email=? AND type='Cash In' AND status='Approved'").get(email) as any)?.total || 0;
        // All approved Cash Out (includes expenses, transfer-out)
        const cashOut = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM account_transactions WHERE user_email=? AND type='Cash Out' AND status='Approved'").get(email) as any)?.total || 0;
        // Transfer totals are for DISPLAY ONLY (already included in cashIn/cashOut via account_transactions)
        const transfersOut = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM cash_transfers WHERE from_user=? AND status='Approved'").get(email) as any)?.total || 0;
        const transfersIn = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM cash_transfers WHERE to_user=? AND status='Approved'").get(email) as any)?.total || 0;
        const pendingOut = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM cash_transfers WHERE from_user=? AND status='Pending'").get(email) as any)?.total || 0;
        // Balance = cashIn - cashOut ONLY (transfers already reflected in account_transactions, NOT double-counted)
        return { email, name, nick_name, role, cash_in: cashIn, cash_out: cashOut, transfers_out: transfersOut, transfers_in: transfersIn, pending_transfers: pendingOut, balance: cashIn - cashOut };
      };
      // Non-admin users see only their own cash-in-hand
      if (req.user.role !== 'Admin' && req.user.role !== 'Accountant') {
        const u = req.user;
        return res.json([calcUserCash(u.email, u.name || '', u.nick_name || '', u.role)]);
      }
      // Admin/Accountant see all users
      const users = db.prepare("SELECT email, name, nick_name, role FROM users WHERE status='Active'").all() as any[];
      const result = users.map((u: any) => calcUserCash(u.email, u.name || '', u.nick_name || '', u.role))
        .filter((u: any) => u.cash_in > 0 || u.cash_out > 0 || u.transfers_out > 0 || u.transfers_in > 0 || u.balance !== 0);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET transfers
  app.get('/api/accounts/transfers', authenticateToken, (req: any, res: any) => {
    const u = req.user;
    let rows: any[];
    if (u.role === 'Admin' || u.role === 'Accountant') {
      rows = db.prepare('SELECT * FROM cash_transfers ORDER BY created_at DESC').all() as any[];
    } else {
      rows = db.prepare('SELECT * FROM cash_transfers WHERE from_user=? OR to_user=? ORDER BY created_at DESC').all(u.email, u.email) as any[];
    }
    res.json(rows);
  });

  // POST transfer
  app.post('/api/accounts/transfers', authenticateToken, (req: any, res: any) => {
    const u = req.user;
    const { to_user, amount, description } = req.body;
    if (!to_user || !amount || amount <= 0) return res.status(400).json({ error: 'to_user and positive amount required' });
    const from_user = u.email;
    if (from_user === to_user) return res.status(400).json({ error: 'Cannot transfer to yourself' });
    // Duplicate prevention: block same from+to+amount within 60 seconds
    const dup = db.prepare("SELECT id FROM cash_transfers WHERE from_user=? AND to_user=? AND amount=? AND created_at >= datetime('now', '-60 seconds') AND status != 'Rejected'").get(from_user, to_user, amount) as any;
    if (dup) return res.status(409).json({ error: 'Duplicate transfer detected. Please wait before submitting again.' });
    // Admin transfers auto-approve
    const status = u.role === 'Admin' ? 'Approved' : 'Pending';
    const approved_by = u.role === 'Admin' ? u.email : null;
    const approved_at = u.role === 'Admin' ? new Date().toISOString() : null;
    const r = db.prepare(`INSERT INTO cash_transfers (from_user, to_user, amount, description, status, approved_by, approved_at) VALUES (?,?,?,?,?,?,?)`)
      .run(from_user, to_user, amount, description || null, status, approved_by, approved_at);
    // If auto-approved, create linked account transactions
    if (status === 'Approved') {
      db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, user_email) VALUES ('Cash Out',?,'Cash Transfer','Transfer Out',?,date('now'),?,'Approved','System',?,datetime('now'),?)`)
        .run(amount, `Cash transfer to ${to_user}`, from_user, u.email, from_user);
      db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, user_email) VALUES ('Cash In',?,'Cash Transfer','Transfer In',?,date('now'),?,'Approved','System',?,datetime('now'),?)`)
        .run(amount, `Cash transfer from ${from_user}`, from_user, u.email, to_user);
    }
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?,?,?)').run('Cash Transfer', `PKR ${amount} from ${from_user} to ${to_user} [${status}]`, u.email);
    // Notifications
    try {
      if (status === 'Pending') { notifyAdmins('Cash Transfer Request', `${from_user} requested PKR ${amount} transfer to ${to_user}`, 'warning', '/admin/accounts'); }
      createNotification(to_user, 'Cash Received', `PKR ${amount} transferred from ${from_user}`, 'success', '');
    } catch {}
    res.json({ id: r.lastInsertRowid, status });
  });

  // APPROVE transfer
  app.put('/api/accounts/transfers/:id/approve', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const transfer = db.prepare('SELECT * FROM cash_transfers WHERE id=?').get(req.params.id) as any;
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    if (transfer.status !== 'Pending') return res.status(400).json({ error: 'Already processed' });
    db.transaction(() => {
      db.prepare("UPDATE cash_transfers SET status='Approved', approved_by=?, approved_at=datetime('now') WHERE id=?").run(req.user.email, req.params.id);
      db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, user_email) VALUES ('Cash Out',?,'Cash Transfer','Transfer Out',?,date('now'),?,'Approved','System',?,datetime('now'),?)`)
        .run(transfer.amount, `Cash transfer to ${transfer.to_user}`, transfer.from_user, req.user.email, transfer.from_user);
      db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, approved_by, approved_at, user_email) VALUES ('Cash In',?,'Cash Transfer','Transfer In',?,date('now'),?,'Approved','System',?,datetime('now'),?)`)
        .run(transfer.amount, `Cash transfer from ${transfer.from_user}`, transfer.from_user, req.user.email, transfer.to_user);
    })();
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?,?,?)').run('Approve Transfer', `Transfer ${req.params.id} approved`, req.user.email);
    res.json({ success: true });
  });

  // REJECT transfer
  app.put('/api/accounts/transfers/:id/reject', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });
    const { reason } = req.body;
    db.prepare("UPDATE cash_transfers SET status='Rejected', rejection_reason=? WHERE id=?").run(reason || null, req.params.id);
    db.prepare('INSERT INTO audit_logs (action, details, user_email) VALUES (?,?,?)').run('Reject Transfer', `Transfer ${req.params.id} rejected: ${reason}`, req.user.email);
    res.json({ success: true });
  });

  // ════════════════════════════════════════════
  // TICKET LOOKUP (authenticated, full details)
  // ════════════════════════════════════════════
  app.get('/api/tickets/lookup/:ticketId', authenticateToken, (req: any, res: any) => {
    const ticket = db.prepare('SELECT ticket_id, name, mobile, address, tx_id, date, generated_by_nick, printed_count, user_email FROM tickets WHERE ticket_id = ?').get(req.params.ticketId) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    // Non-admin users see masked mobile
    if (req.user.role !== 'Admin') {
      ticket.mobile = ticket.mobile ? ticket.mobile.slice(0, -3) + '***' : '';
    }
    res.json(ticket);
  });

  // ════════════════════════════════════════════
  // PER-USER FINANCIAL REPORT
  // ════════════════════════════════════════════
  app.get('/api/accounts/user-report/:email', authenticateToken, (req: any, res: any) => {
    const requestedEmail = req.params.email;
    // Permission: Admin can view any user, others can only view themselves
    if (req.user.role !== 'Admin' && req.user.email !== requestedEmail) {
      return res.status(403).json({ error: 'No permission' });
    }
    try {
      // Ticket sales totals
      const ticketSales = db.prepare("SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM transactions WHERE user_email=? AND status='Generated'").get(requestedEmail) as any;
      // Cash In/Out by category
      const cashByCategory = db.prepare("SELECT type, category, COALESCE(SUM(amount),0) as total FROM account_transactions WHERE user_email=? AND status='Approved' GROUP BY type, category").all(requestedEmail) as any[];
      // Transfer history
      const transfers = db.prepare("SELECT * FROM cash_transfers WHERE from_user=? OR to_user=? ORDER BY created_at DESC LIMIT 50").all(requestedEmail, requestedEmail) as any[];
      // Current balance (transfers already in account_transactions, no double-count)
      const cashIn = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM account_transactions WHERE user_email=? AND type='Cash In' AND status='Approved'").get(requestedEmail) as any)?.total || 0;
      const cashOut = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM account_transactions WHERE user_email=? AND type='Cash Out' AND status='Approved'").get(requestedEmail) as any)?.total || 0;
      const transfersOut = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM cash_transfers WHERE from_user=? AND status='Approved'").get(requestedEmail) as any)?.total || 0;
      const transfersIn = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM cash_transfers WHERE to_user=? AND status='Approved'").get(requestedEmail) as any)?.total || 0;
      const balance = cashIn - cashOut; // No double-counting: transfers already in account_transactions
      res.json({ ticketSales, cashByCategory, transfers, balance, cashIn, cashOut, transfersOut, transfersIn });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════════════════════════════════════════════
  // PUBLIC TICKET VERIFICATION
  // ════════════════════════════════════════════
  app.get('/api/tickets/public-verify/:ticketId', (req, res) => {
    const ticket = db.prepare('SELECT ticket_id, name, mobile, tx_id, date, generated_by_nick FROM tickets WHERE ticket_id = ?').get(req.params.ticketId) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found', valid: false });
    res.json({ valid: true, ticket: { ...ticket, mobile: ticket.mobile ? ticket.mobile.slice(0, -3) + '***' : '' } });
  });

  // ════════════════════════════════════════════
  // SALARY / ADVANCE / LOAN MODULE
  // ════════════════════════════════════════════

  // GET salary configs
  app.get('/api/salary/config', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role === 'Admin' || req.user.role === 'Accountant') {
        const configs = db.prepare(`
          SELECT sc.*, u.name, u.nick_name, u.role FROM salary_config sc
          LEFT JOIN users u ON sc.user_email = u.email
          ORDER BY u.name
        `).all();
        res.json(configs);
      } else {
        const config = db.prepare('SELECT * FROM salary_config WHERE user_email = ?').get(req.user.email);
        res.json(config ? [config] : []);
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PUT salary config for a user (Admin only)
  app.put('/api/salary/config/:email', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const { email } = req.params;
    const { monthly_salary, effective_from } = req.body;
    try {
      const existing = db.prepare('SELECT id FROM salary_config WHERE user_email = ?').get(email);
      if (existing) {
        db.prepare('UPDATE salary_config SET monthly_salary = ?, effective_from = ?, created_by = ?, updated_at = datetime(\'now\') WHERE user_email = ?')
          .run(monthly_salary || 0, effective_from || null, req.user.email, email);
      } else {
        db.prepare('INSERT INTO salary_config (user_email, monthly_salary, effective_from, created_by) VALUES (?, ?, ?, ?)')
          .run(email, monthly_salary || 0, effective_from || null, req.user.email);
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET salary transactions
  app.get('/api/salary/transactions', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role === 'Admin' || req.user.role === 'Accountant') {
        const rows = db.prepare(`
          SELECT st.*, u.name, u.nick_name FROM salary_transactions st
          LEFT JOIN users u ON st.user_email = u.email
          ORDER BY st.created_at DESC
        `).all();
        res.json(rows);
      } else {
        const rows = db.prepare('SELECT * FROM salary_transactions WHERE user_email = ? ORDER BY created_at DESC').all(req.user.email);
        res.json(rows);
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST salary transaction (Admin/Accountant)
  app.post('/api/salary/transactions', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Accountant') return res.status(403).json({ error: 'Not authorized' });
    const { user_email, type, amount, month, description } = req.body;
    if (!user_email || !type || !amount) return res.status(400).json({ error: 'user_email, type, and amount are required' });
    const validTypes = ['Salary', 'Advance', 'Loan', 'Loan Repayment'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type. Must be: ' + validTypes.join(', ') });

    // Duplicate check: same user, type, month within 60s
    if (type === 'Salary' && month) {
      const dup = db.prepare("SELECT id FROM salary_transactions WHERE user_email=? AND type='Salary' AND month=? AND status != 'Rejected'").get(user_email, month);
      if (dup) return res.status(409).json({ error: `Salary for ${month} already exists for this user` });
    }

    try {
      const status = req.user.role === 'Admin' ? 'Approved' : 'Pending';
      const result = db.prepare('INSERT INTO salary_transactions (user_email, type, amount, month, description, status, approved_by, approved_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(user_email, type, amount, month || null, description || '', status,
             status === 'Approved' ? req.user.email : null,
             status === 'Approved' ? new Date().toISOString() : null,
             req.user.email);

      // Auto-create account transaction for Admin-approved salary/advance
      if (status === 'Approved') {
        const cat = type === 'Loan Repayment' ? 'Cash In' : 'Cash Out';
        const acctType = type === 'Loan Repayment' ? 'Cash In' : 'Cash Out';
        db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, user_email) VALUES (?, ?, ?, ?, ?, date('now'), ?, 'Approved', 'System', ?)`)
          .run(acctType, amount, type === 'Loan Repayment' ? 'Other Income' : 'Salaries', type, `${type}: ${description || user_email}${month ? ' (' + month + ')' : ''}`, req.user.email, req.user.email);
      }
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Approve salary transaction (Admin only)
  app.put('/api/salary/transactions/:id/approve', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const tx = db.prepare('SELECT * FROM salary_transactions WHERE id = ?').get(req.params.id) as any;
    if (!tx) return res.status(404).json({ error: 'Not found' });
    if (tx.status !== 'Pending') return res.status(400).json({ error: 'Only pending transactions can be approved' });

    db.prepare("UPDATE salary_transactions SET status = 'Approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?")
      .run(req.user.email, req.params.id);

    // Create corresponding account transaction
    const acctType = tx.type === 'Loan Repayment' ? 'Cash In' : 'Cash Out';
    db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, user_email) VALUES (?, ?, ?, ?, ?, date('now'), ?, 'Approved', 'System', ?)`)
      .run(acctType, tx.amount, tx.type === 'Loan Repayment' ? 'Other Income' : 'Salaries', tx.type, `${tx.type}: ${tx.description || tx.user_email}${tx.month ? ' (' + tx.month + ')' : ''}`, req.user.email, req.user.email);

    res.json({ success: true });
  });

  // Reject salary transaction (Admin only)
  app.put('/api/salary/transactions/:id/reject', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    db.prepare("UPDATE salary_transactions SET status = 'Rejected' WHERE id = ? AND status = 'Pending'").run(req.params.id);
    res.json({ success: true });
  });

  // GET salary summary for a user
  app.get('/api/salary/summary/:email', authenticateToken, (req: any, res: any) => {
    const email = req.params.email;
    if (req.user.role !== 'Admin' && req.user.role !== 'Accountant' && req.user.email !== email) {
      return res.status(403).json({ error: 'No permission' });
    }
    try {
      const config = db.prepare('SELECT * FROM salary_config WHERE user_email = ?').get(email) as any;
      const totalSalary = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM salary_transactions WHERE user_email=? AND type='Salary' AND status='Approved'").get(email) as any)?.total || 0;
      const totalAdvance = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM salary_transactions WHERE user_email=? AND type='Advance' AND status='Approved'").get(email) as any)?.total || 0;
      const totalLoan = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM salary_transactions WHERE user_email=? AND type='Loan' AND status='Approved'").get(email) as any)?.total || 0;
      const totalRepayment = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM salary_transactions WHERE user_email=? AND type='Loan Repayment' AND status='Approved'").get(email) as any)?.total || 0;
      const recentTx = db.prepare("SELECT * FROM salary_transactions WHERE user_email=? ORDER BY created_at DESC LIMIT 20").all(email);
      res.json({
        monthly_salary: config?.monthly_salary || 0,
        effective_from: config?.effective_from,
        total_salary_paid: totalSalary,
        total_advance: totalAdvance,
        total_loan: totalLoan,
        total_repayment: totalRepayment,
        loan_balance: totalLoan - totalRepayment,
        recent_transactions: recentTx,
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Process monthly salary for all users (Admin only)
  app.post('/api/salary/process-monthly', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const { month } = req.body; // 'YYYY-MM'
    if (!month) return res.status(400).json({ error: 'month is required (YYYY-MM)' });
    try {
      const configs = db.prepare('SELECT * FROM salary_config WHERE monthly_salary > 0').all() as any[];
      let processed = 0, skipped = 0;
      for (const cfg of configs) {
        // Check if already paid for this month
        const existing = db.prepare("SELECT id FROM salary_transactions WHERE user_email=? AND type='Salary' AND month=? AND status != 'Rejected'").get(cfg.user_email, month);
        if (existing) { skipped++; continue; }
        db.prepare('INSERT INTO salary_transactions (user_email, type, amount, month, description, status, approved_by, approved_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(cfg.user_email, 'Salary', cfg.monthly_salary, month, `Monthly salary for ${month}`, 'Approved', req.user.email, new Date().toISOString(), req.user.email);
        // Create Cash Out account transaction
        db.prepare(`INSERT INTO account_transactions (type, amount, category, subcategory, description, date, created_by, status, source, user_email) VALUES ('Cash Out', ?, 'Salaries', 'Salary', ?, date('now'), ?, 'Approved', 'System', ?)`)
          .run(cfg.monthly_salary, `Monthly salary for ${month}: ${cfg.user_email}`, req.user.email, req.user.email);
        processed++;
      }
      res.json({ success: true, processed, skipped, total: configs.length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════════════════════════════════════════════
  // INVOICE SYSTEM
  // ════════════════════════════════════════════

  // Generate next invoice number
  function getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const last = db.prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1").get(`INV-${year}-%`) as any;
    let seq = 1;
    if (last?.invoice_number) {
      const parts = last.invoice_number.split('-');
      seq = parseInt(parts[2] || '0', 10) + 1;
    }
    return `INV-${year}-${String(seq).padStart(4, '0')}`;
  }

  // GET all invoices
  app.get('/api/invoices', authenticateToken, (req: any, res: any) => {
    try {
      const { status, search, page = '1' } = req.query;
      const limit = 20;
      const offset = (parseInt(page as string) - 1) * limit;
      let where = '1=1';
      const params: any[] = [];
      if (req.user.role !== 'Admin' && req.user.role !== 'Accountant') {
        where += ' AND created_by = ?';
        params.push(req.user.email);
      }
      if (status) { where += ' AND status = ?'; params.push(status); }
      if (search) {
        where += ' AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      const total = (db.prepare(`SELECT count(*) as c FROM invoices WHERE ${where}`).get(...params) as any)?.c || 0;
      const invoices = db.prepare(`SELECT * FROM invoices WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
      res.json({ invoices, total, page: parseInt(page as string), totalPages: Math.ceil(total / limit) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET single invoice
  app.get('/api/invoices/:id', authenticateToken, (req: any, res: any) => {
    try {
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
      if (!inv) return res.status(404).json({ error: 'Invoice not found' });
      res.json(inv);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // CREATE invoice
  app.post('/api/invoices', authenticateToken, (req: any, res: any) => {
    try {
      const { type, customer_name, customer_mobile, customer_address, items, subtotal, discount, tax, total, notes, due_date, transaction_id } = req.body;
      if (!items || !Array.isArray(JSON.parse(typeof items === 'string' ? items : JSON.stringify(items)))) {
        return res.status(400).json({ error: 'Items are required' });
      }
      const invoice_number = getNextInvoiceNumber();
      const itemsStr = typeof items === 'string' ? items : JSON.stringify(items);
      const result = db.prepare(`INSERT INTO invoices (invoice_number, type, customer_name, customer_mobile, customer_address, items, subtotal, discount, tax, total, notes, due_date, transaction_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(invoice_number, type || 'Sale', customer_name || '', customer_mobile || '', customer_address || '', itemsStr, subtotal || 0, discount || 0, tax || 0, total || 0, notes || '', due_date || '', transaction_id || null, req.user.email);
      res.json({ id: result.lastInsertRowid, invoice_number });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // UPDATE invoice
  app.put('/api/invoices/:id', authenticateToken, (req: any, res: any) => {
    try {
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
      if (!inv) return res.status(404).json({ error: 'Invoice not found' });
      if (inv.status === 'Paid') return res.status(400).json({ error: 'Cannot edit a paid invoice' });
      const { type, customer_name, customer_mobile, customer_address, items, subtotal, discount, tax, total, notes, due_date, status } = req.body;
      const itemsStr = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : inv.items;
      db.prepare(`UPDATE invoices SET type=?, customer_name=?, customer_mobile=?, customer_address=?, items=?, subtotal=?, discount=?, tax=?, total=?, notes=?, due_date=?, status=?, updated_at=datetime('now') WHERE id=?`)
        .run(type || inv.type, customer_name ?? inv.customer_name, customer_mobile ?? inv.customer_mobile, customer_address ?? inv.customer_address, itemsStr, subtotal ?? inv.subtotal, discount ?? inv.discount, tax ?? inv.tax, total ?? inv.total, notes ?? inv.notes, due_date ?? inv.due_date, status || inv.status, req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Mark invoice as Paid
  app.put('/api/invoices/:id/pay', authenticateToken, (req: any, res: any) => {
    try {
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
      if (!inv) return res.status(404).json({ error: 'Invoice not found' });
      db.prepare("UPDATE invoices SET status='Paid', paid_at=datetime('now'), updated_at=datetime('now') WHERE id=?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // DELETE invoice (only Draft)
  app.delete('/api/invoices/:id', authenticateToken, (req: any, res: any) => {
    try {
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
      if (!inv) return res.status(404).json({ error: 'Invoice not found' });
      if (inv.status !== 'Draft') return res.status(400).json({ error: 'Only draft invoices can be deleted' });
      db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════════════════════════════════════════════
  // NOTIFICATION SYSTEM
  // ════════════════════════════════════════════

  // Helper to create notifications
  function createNotification(userEmail: string, title: string, message: string, type: string = 'info', link: string = '') {
    db.prepare('INSERT INTO notifications (user_email, title, message, type, link) VALUES (?, ?, ?, ?, ?)').run(userEmail, title, message, type, link);
  }
  function notifyAdmins(title: string, message: string, type: string = 'info', link: string = '') {
    const admins = db.prepare("SELECT email FROM users WHERE role='Admin' AND status='Active'").all() as any[];
    admins.forEach((a: any) => createNotification(a.email, title, message, type, link));
  }

  // GET notifications for current user
  app.get('/api/notifications', authenticateToken, (req: any, res: any) => {
    try {
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 50').all(req.user.email);
      const unread = (db.prepare('SELECT count(*) as c FROM notifications WHERE user_email = ? AND is_read = 0').get(req.user.email) as any)?.c || 0;
      res.json({ notifications, unread });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Mark notification as read
  app.put('/api/notifications/:id/read', authenticateToken, (req: any, res: any) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_email = ?').run(req.params.id, req.user.email);
    res.json({ success: true });
  });

  // Mark all as read
  app.put('/api/notifications/read-all', authenticateToken, (req: any, res: any) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_email = ?').run(req.user.email);
    res.json({ success: true });
  });

  // ════════════════════════════════════════════
  // LOGIN LOGGING & AUDIT
  // ════════════════════════════════════════════

  // GET login logs (Admin only)
  app.get('/api/audit/login-logs', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const { email, page = '1' } = req.query;
      const limit = 50;
      const offset = (parseInt(page as string) - 1) * limit;
      let where = '1=1';
      const params: any[] = [];
      if (email) { where += ' AND user_email = ?'; params.push(email); }
      const logs = db.prepare(`SELECT * FROM login_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
      const total = (db.prepare(`SELECT count(*) as c FROM login_logs WHERE ${where}`).get(...params) as any)?.c || 0;
      res.json({ logs, total });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════════════════════════════════════════════
  // CUSTOMER LOYALTY / TAGS
  // ════════════════════════════════════════════

  // GET customer history (purchases across campaigns)
  app.get('/api/customers/:mobile/history', authenticateToken, (req: any, res: any) => {
    try {
      const mobile = req.params.mobile;
      const tickets = db.prepare(`
        SELECT t.*, tk.ticket_id, tk.date as ticket_date, c.name as campaign_name
        FROM tickets tk
        LEFT JOIN transactions t ON tk.tx_id = t.tx_id
        LEFT JOIN campaigns c ON t.campaign_id = c.id
        WHERE tk.mobile LIKE ?
        ORDER BY tk.date DESC
      `).all(`%${mobile.replace(/\D/g, '').slice(-10)}%`);

      const totalSpent = tickets.reduce((s: number, t: any) => s + (t.amount || 0), 0);
      const campaignCount = new Set(tickets.map((t: any) => t.campaign_name).filter(Boolean)).size;

      // Tags
      const tags = db.prepare('SELECT * FROM customer_tags WHERE mobile = ?').all(mobile);

      res.json({ tickets, totalSpent, totalTickets: tickets.length, campaignCount, tags, isRepeat: tickets.length > 1 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Add customer tag
  app.post('/api/customers/:mobile/tags', authenticateToken, (req: any, res: any) => {
    try {
      const { tag } = req.body;
      if (!tag) return res.status(400).json({ error: 'Tag required' });
      db.prepare('INSERT OR IGNORE INTO customer_tags (mobile, tag, created_by) VALUES (?, ?, ?)').run(req.params.mobile, tag, req.user.email);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Remove customer tag
  app.delete('/api/customers/:mobile/tags/:tag', authenticateToken, (req: any, res: any) => {
    try {
      db.prepare('DELETE FROM customer_tags WHERE mobile = ? AND tag = ?').run(req.params.mobile, req.params.tag);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET repeat/VIP customers
  app.get('/api/customers/loyalty/summary', authenticateToken, (req: any, res: any) => {
    try {
      const customers = db.prepare(`
        SELECT mobile, name, count(*) as ticket_count, sum(t.amount) as total_spent,
               max(tk.date) as last_purchase, min(tk.date) as first_purchase
        FROM tickets tk
        LEFT JOIN transactions t ON tk.tx_id = t.tx_id
        GROUP BY mobile
        HAVING ticket_count > 0
        ORDER BY ticket_count DESC
        LIMIT 100
      `).all();

      // Add tags
      const result = (customers as any[]).map((c: any) => {
        const tags = db.prepare('SELECT tag FROM customer_tags WHERE mobile = ?').all(c.mobile).map((t: any) => t.tag);
        return { ...c, tags, isVIP: tags.includes('VIP'), isRepeat: c.ticket_count > 1 };
      });

      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // API 404 handler - MUST be after all API routes but before Vite/SPA fallback
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
