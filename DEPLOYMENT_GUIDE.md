# Kartal Mart - Complete Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Converting to Mobile APK](#converting-to-mobile-apk)
6. [Railway Deployment](#railway-deployment)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software
- Node.js 16+ and npm
- MySQL 8.0+ or MariaDB
- Git
- Android Studio (for APK building)
- Java JDK 11+ (for Capacitor)

### Required Accounts
- Railway account (or any cloud hosting)
- WhatsApp Business API account (optional, for automated messages)
- Domain name (optional)

---

## 2. Database Setup

### Step 1: Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE kartal_mart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kartal_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON kartal_mart.* TO 'kartal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Import Schema
```bash
mysql -u kartal_user -p kartal_mart < database-schema.sql
```

### Step 3: Verify Installation
```bash
mysql -u kartal_user -p kartal_mart -e "SHOW TABLES;"
```

You should see all tables listed.

---

## 3. Backend Setup

### Step 1: Initialize Project
```bash
mkdir kartal-mart-backend
cd kartal-mart-backend
npm init -y
```

### Step 2: Install Dependencies
```bash
npm install express mysql2 cors dotenv bcrypt jsonwebtoken
npm install multer tesseract.js sharp
npm install express-session express-rate-limit helmet
npm install --save-dev nodemon
```

### Step 3: Create `.env` File
```env
# Database
DB_HOST=localhost
DB_USER=kartal_user
DB_PASSWORD=secure_password_here
DB_NAME=kartal_mart

# Server
PORT=5000
NODE_ENV=development

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_generated_secret_here

# WhatsApp API (optional - for automated bulk messaging)
WHATSAPP_API_KEY=your_api_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Step 4: Create Server Structure
```
backend/
├── server.js
├── .env
├── package.json
├── api/
│   ├── auth.js
│   ├── users.js
│   ├── tickets.js
│   ├── dashboard.js
│   ├── scan-receipt.js (use the file we created)
│   └── marketing.js
├── middleware/
│   ├── auth.js
│   ├── permissions.js
│   └── errorHandler.js
├── config/
│   └── database.js
└── uploads/
    └── receipts/
```

### Step 5: Basic Server Setup (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
const db = require('./config/database');
app.set('db', db);

// Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/users', require('./api/users'));
app.use('/api/tickets', require('./api/tickets'));
app.use('/api/dashboard', require('./api/dashboard'));
app.use('/api', require('./api/scan-receipt'));
app.use('/api/marketing', require('./api/marketing'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 6: Start Backend
```bash
npm run dev  # If using nodemon
# or
node server.js
```

---

## 4. Frontend Setup

### Step 1: Create React App
```bash
npx create-react-app kartal-mart-frontend
cd kartal-mart-frontend
```

### Step 2: Install Dependencies
```bash
npm install react-router-dom axios
npm install recharts lucide-react
npm install react-qr-scanner qrcode.react
npm install papaparse sheetjs
```

### Step 3: Add Components
Copy all the component files we created:
- `UserPermissions.jsx` and `.css`
- `ReceiptScanner.jsx` and `.css`
- `TicketTemplateEditor.jsx` and `.css`
- `ThermalPrinter.js`
- `WhatsAppIntegration.js`

### Step 4: Update Login Page Branding

**src/pages/Login.jsx:**
```jsx
<div className="login-page">
  <div className="login-card">
    <img src="/logo-transparent.png" alt="Kartal Mart" className="logo" />
    <h1>Kartal Mart</h1>
    <p className="tagline">Your Complete Retail Solution</p>
    <p className="description">
      Browse products, manage packages, and serve customers efficiently. 
      Purchase packages and generate instant tickets for our exclusive lucky draw program.
    </p>
    
    {/* Login form here */}
  </div>
</div>
```

### Step 5: Update Dashboard Logo

**src/components/Dashboard/Dashboard.jsx:**
```jsx
<div className="dashboard-header">
  <img 
    src="/logo-transparent.png" 
    alt="Kartal Mart Logo" 
    className="dashboard-logo"
    style={{
      width: '180px',
      height: 'auto',
      objectFit: 'contain',
      background: 'transparent'
    }}
  />
  {/* Rest of header */}
</div>
```

### Step 6: Start Frontend
```bash
npm start
```

---

## 5. Converting to Mobile APK

### Method 1: Using Capacitor (Recommended)

#### Step 1: Install Capacitor
```bash
cd kartal-mart-frontend
npm install @capacitor/core @capacitor/cli
npx cap init
```

When prompted:
- App name: `Kartal Mart`
- App ID: `com.kartalmart.app`
- Directory: `build`

#### Step 2: Add Android Platform
```bash
npm install @capacitor/android
npx cap add android
```

#### Step 3: Install Required Plugins
```bash
npm install @capacitor/camera @capacitor/filesystem @capacitor/network
```

#### Step 4: Configure Capacitor

**capacitor.config.json:**
```json
{
  "appId": "com.kartalmart.app",
  "appName": "Kartal Mart",
  "webDir": "build",
  "bundledWebRuntime": false,
  "server": {
    "url": "https://web-production-52042.up.railway.app",
    "cleartext": true
  },
  "plugins": {
    "Camera": {
      "permissions": ["camera", "photos"]
    },
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#667eea",
      "showSpinner": true,
      "androidSpinnerStyle": "small",
      "spinnerColor": "#ffffff"
    }
  },
  "android": {
    "allowMixedContent": true
  }
}
```

#### Step 5: Update AndroidManifest.xml

**android/app/src/main/AndroidManifest.xml:**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Kartal Mart"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <!-- Activities -->
    </application>
</manifest>
```

#### Step 6: Build Web Assets
```bash
npm run build
```

#### Step 7: Sync with Android
```bash
npx cap sync android
```

#### Step 8: Open in Android Studio
```bash
npx cap open android
```

#### Step 9: Build APK in Android Studio
1. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
2. Wait for build to complete
3. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Step 10: Build Release APK (for production)
```bash
cd android
./gradlew assembleRelease
```

Release APK location: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Method 2: Using Cordova (Alternative)

```bash
npm install -g cordova
cordova create kartal-mart-mobile com.kartalmart.app KartalMart
cd kartal-mart-mobile

# Copy build files to www/
cp -r ../kartal-mart-frontend/build/* www/

cordova platform add android
cordova requirements
cordova build android

# APK location: platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: Using PWA + TWA (Simplest)

#### Step 1: Create PWA Manifest

**public/manifest.json:**
```json
{
  "name": "Kartal Mart",
  "short_name": "Kartal",
  "description": "Retail Management & Lucky Draw System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### Step 2: Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

#### Step 3: Initialize TWA
```bash
bubblewrap init --manifest https://your-app.com/manifest.json
```

#### Step 4: Build APK
```bash
bubblewrap build
```

APK location: `app-release-signed.apk`

---

## 6. Railway Deployment

### Step 1: Create Railway Account
Go to [railway.app](https://railway.app) and sign up.

### Step 2: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 3: Initialize Railway Project
```bash
cd kartal-mart-backend
railway init
```

### Step 4: Add MySQL Database
In Railway dashboard:
1. Click "New" → "Database" → "MySQL"
2. Note the connection details

### Step 5: Set Environment Variables
In Railway dashboard → Variables:
```
DB_HOST=<railway-mysql-host>
DB_USER=<railway-mysql-user>
DB_PASSWORD=<railway-mysql-password>
DB_NAME=kartal_mart
JWT_SECRET=<your-secret>
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Step 6: Deploy Backend
```bash
railway up
```

### Step 7: Deploy Frontend
```bash
cd kartal-mart-frontend

# Build for production
REACT_APP_API_URL=https://your-backend.railway.app npm run build

# Deploy using Railway or Vercel/Netlify
railway init
railway up
```

### Alternative: Deploy Frontend to Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 7. Configuration

### Scanner Page Fix
Ensure route is properly configured:

**App.js:**
```javascript
import ScannerPage from './pages/ScannerPage';

<Route path="/scanner" element={<ScannerPage />} />
```

### WhatsApp Configuration
Update WhatsAppIntegration.js with your phone number format.

### Thermal Printer Configuration
Ensure printer is set to 58mm width in ThermalPrinter.js.

---

## 8. Testing

### Test Checklist

#### Backend
- [ ] Database connection working
- [ ] User authentication working
- [ ] Ticket creation working
- [ ] Receipt OCR working
- [ ] Permission checks working

#### Frontend
- [ ] Login page shows new branding
- [ ] Dashboard graphs are functional
- [ ] User management loads properly
- [ ] Permissions modal works
- [ ] Receipt scanner functions
- [ ] Thermal print works
- [ ] WhatsApp integration works

#### Mobile APK
- [ ] App installs successfully
- [ ] Camera permissions granted
- [ ] Scanner works
- [ ] Network requests succeed
- [ ] WhatsApp integration works from mobile

---

## 9. Troubleshooting

### Issue: Scanner Page is Blank

**Solution:**
1. Check browser console for errors
2. Verify camera permissions
3. Install required package:
```bash
npm install react-qr-reader
```

### Issue: Thermal Printer Not Working

**Solution:**
1. Check printer is 58mm thermal printer
2. Verify printer driver installed
3. Test with different browsers
4. Check print preview settings

### Issue: WhatsApp Opens Multiple Tabs

**Solution:**
Already fixed in WhatsAppIntegration.js using tab reuse logic.

### Issue: Receipt OCR Not Working

**Solution:**
1. Ensure Tesseract.js is installed
2. Check image quality (must be clear)
3. Verify regex patterns match your receipt format

### Issue: APK Won't Install

**Solution:**
1. Enable "Install from Unknown Sources" on Android
2. For release build, sign the APK:
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.keystore app-release-unsigned.apk alias_name
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

### Issue: Database Connection Failed

**Solution:**
1. Check .env file has correct credentials
2. Verify MySQL is running: `sudo systemctl status mysql`
3. Check firewall allows connection on port 3306

---

## 10. Maintenance

### Daily Tasks
- Monitor error logs
- Check ticket generation rate
- Verify receipt scans

### Weekly Tasks
- Backup database
- Review user permissions
- Check system performance

### Monthly Tasks
- Clean up old receipts (>90 days)
- Archive old activity logs
- Update dependencies

### Database Backup
```bash
# Automated daily backup
0 2 * * * mysqldump -u kartal_user -p'password' kartal_mart > /backups/kartal_$(date +\%Y\%m\%d).sql

# Keep 30 days of backups
find /backups -name "kartal_*.sql" -mtime +30 -delete
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Sanitize all inputs
- [ ] Validate file uploads
- [ ] Use prepared statements
- [ ] Encrypt sensitive data
- [ ] Regular security updates
- [ ] Monitor access logs

---

## Support

For issues or questions:
- Email: support@kartalmart.com
- Phone: +92 300 1234567

---

**Last Updated:** March 11, 2026
**Version:** 1.0.0
