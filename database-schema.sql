-- ============================================================================
-- Kartal Mart Lucky Draw System - Complete Database Schema
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'salesman') NOT NULL DEFAULT 'salesman',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (active)
);

-- ============================================================================
-- 2. USER PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  allow_multi_person_tx BOOLEAN DEFAULT FALSE,
  allow_duplicate_tx_ids BOOLEAN DEFAULT FALSE,
  require_admin_approval BOOLEAN DEFAULT TRUE,
  easypaisa_receipt_mandatory BOOLEAN DEFAULT TRUE,
  easypaisa_scan_mandatory BOOLEAN DEFAULT TRUE,
  scanner_enabled BOOLEAN DEFAULT FALSE,
  allow_reprint BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permissions (user_id)
);

-- ============================================================================
-- 3. PACKAGES TABLE (Products in Mart context)
-- ============================================================================
CREATE TABLE packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active)
);

-- ============================================================================
-- 4. TICKETS TABLE
-- ============================================================================
CREATE TABLE tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  package_id INT,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  payment_method ENUM('cash', 'easypaisa', 'bank_transfer') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'verified', 'active', 'rejected', 'used') DEFAULT 'pending',
  print_count INT DEFAULT 0,
  created_by INT NOT NULL,
  verified_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ticket_number (ticket_number),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_status (status),
  INDEX idx_phone (phone),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- 5. RECEIPT SCANS TABLE
-- ============================================================================
CREATE TABLE receipt_scans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT,
  transaction_id VARCHAR(100) NOT NULL,
  receipt_path VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_ticket_id (ticket_id)
);

-- ============================================================================
-- 6. TICKET TEMPLATE SETTINGS TABLE
-- ============================================================================
CREATE TABLE ticket_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_name VARCHAR(100) DEFAULT 'Default',
  show_date BOOLEAN DEFAULT TRUE,
  show_contact_number BOOLEAN DEFAULT TRUE,
  show_website BOOLEAN DEFAULT TRUE,
  show_package_name BOOLEAN DEFAULT TRUE,
  contact_number VARCHAR(20),
  website_url VARCHAR(100),
  logo_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. MARKETING CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE marketing_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  target_audience ENUM('all_customers', 'active_tickets', 'verified_tickets', 'custom') NOT NULL,
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  status ENUM('draft', 'sending', 'completed', 'failed') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
);

-- ============================================================================
-- 8. CAMPAIGN LOGS TABLE
-- ============================================================================
CREATE TABLE campaign_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status ENUM('sent', 'failed') NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- 9. ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- 10. SYSTEM SETTINGS TABLE
-- ============================================================================
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Default Admin User (Password: Admin@123 - Change this immediately!)
INSERT INTO users (name, email, password, role) VALUES 
('Administrator', 'admin@kartalmart.com', '$2b$10$rBV2KQK5gF5lPFxqGp.iGulnEYFYYf9Uj/VLN8K5S9mRg3.F3j6Hi', 'admin');

-- Default User Permissions for Admin
INSERT INTO user_permissions (user_id, allow_multi_person_tx, allow_duplicate_tx_ids, require_admin_approval, 
                              easypaisa_receipt_mandatory, easypaisa_scan_mandatory, scanner_enabled, allow_reprint) 
VALUES (1, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE);

-- Default Ticket Template
INSERT INTO ticket_templates (template_name, show_date, show_contact_number, show_website, show_package_name, 
                              contact_number, website_url, logo_size, is_active) 
VALUES ('Default Template', TRUE, TRUE, TRUE, TRUE, '+92 300 1234567', 'www.kartalmart.com', 'medium', TRUE);

-- Sample Packages
INSERT INTO packages (name, description, price, active) VALUES 
('Basic Package', 'Entry level package with 1 ticket', 500.00, TRUE),
('Standard Package', 'Standard package with 3 tickets', 1200.00, TRUE),
('Premium Package', 'Premium package with 5 tickets', 2000.00, TRUE),
('VIP Package', 'VIP package with 10 tickets', 3500.00, TRUE);

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
('app_name', 'Kartal Mart', 'string', 'Application name'),
('company_name', 'Kartal Group of Companies', 'string', 'Company name'),
('support_email', 'support@kartalmart.com', 'string', 'Support email address'),
('support_phone', '+92 300 1234567', 'string', 'Support phone number'),
('whatsapp_enabled', 'true', 'boolean', 'Enable WhatsApp integration'),
('max_tickets_per_transaction', '10', 'number', 'Maximum tickets per transaction'),
('auto_verify_cash_payments', 'true', 'boolean', 'Auto-verify cash payments'),
('require_receipt_for_easypaisa', 'true', 'boolean', 'Require receipt upload for EasyPaisa');

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Get user with permissions
-- SELECT u.*, p.* FROM users u 
-- LEFT JOIN user_permissions p ON u.id = p.user_id 
-- WHERE u.id = ?;

-- Get tickets with package and user details
-- SELECT t.*, p.name as package_name, u.name as created_by_name 
-- FROM tickets t 
-- LEFT JOIN packages p ON t.package_id = p.id 
-- LEFT JOIN users u ON t.created_by = u.id 
-- WHERE t.status = 'active';

-- Get dashboard statistics
-- SELECT 
--   COUNT(*) as total_tickets,
--   SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_tickets,
--   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tickets,
--   SUM(amount) as total_revenue,
--   COUNT(DISTINCT created_by) as active_users
-- FROM tickets
-- WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Check for duplicate transaction IDs
-- SELECT transaction_id, COUNT(*) as count 
-- FROM tickets 
-- GROUP BY transaction_id 
-- HAVING count > 1;

-- Get top selling packages
-- SELECT p.name, COUNT(t.id) as ticket_count, SUM(t.amount) as total_revenue
-- FROM packages p
-- LEFT JOIN tickets t ON p.id = t.package_id
-- GROUP BY p.id
-- ORDER BY ticket_count DESC;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Clean up old receipt scans (older than 90 days)
-- DELETE FROM receipt_scans WHERE scanned_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive old activity logs (older than 180 days)
-- DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY);

-- Reset print count (use with caution!)
-- UPDATE tickets SET print_count = 0 WHERE id = ?;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_tickets_status_created ON tickets(status, created_at);
CREATE INDEX idx_tickets_created_by_status ON tickets(created_by, status);
CREATE INDEX idx_activity_user_date ON activity_logs(user_id, created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to log ticket creation
DELIMITER //
CREATE TRIGGER after_ticket_insert
AFTER INSERT ON tickets
FOR EACH ROW
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (NEW.created_by, 'CREATE_TICKET', 'ticket', NEW.id, 
          JSON_OBJECT('ticket_number', NEW.ticket_number, 'amount', NEW.amount));
END;//
DELIMITER ;

-- Trigger to log ticket verification
DELIMITER //
CREATE TRIGGER after_ticket_verify
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
  IF OLD.status != 'verified' AND NEW.status = 'verified' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.verified_by, 'VERIFY_TICKET', 'ticket', NEW.id,
            JSON_OBJECT('ticket_number', NEW.ticket_number));
  END IF;
END;//
DELIMITER ;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for ticket dashboard
CREATE VIEW v_ticket_dashboard AS
SELECT 
  t.id,
  t.ticket_number,
  t.customer_name,
  t.phone,
  t.transaction_id,
  t.amount,
  t.status,
  t.print_count,
  t.created_at,
  p.name as package_name,
  u.name as created_by_name,
  v.name as verified_by_name
FROM tickets t
LEFT JOIN packages p ON t.package_id = p.id
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users v ON t.verified_by = v.id;

-- View for user statistics
CREATE VIEW v_user_statistics AS
SELECT 
  u.id,
  u.name,
  u.role,
  COUNT(t.id) as total_tickets,
  SUM(t.amount) as total_revenue,
  COUNT(CASE WHEN t.status = 'verified' THEN 1 END) as verified_tickets,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tickets
FROM users u
LEFT JOIN tickets t ON u.id = t.created_by
GROUP BY u.id;

-- ============================================================================
-- BACKUP RECOMMENDATION
-- ============================================================================
-- Run daily backup: mysqldump -u root -p kartal_mart > backup_$(date +%Y%m%d).sql
-- Keep backups for 30 days
-- ============================================================================
