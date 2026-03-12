# Kartal Mart Lucky Draw System

A comprehensive sales and lucky draw management system for Kartal Mart. This application manages product sales, ticket generation, customer tracking, and lucky draw campaigns.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   ```
   http://localhost:3000
   ```

### Default Login Credentials
- **Admin:**
  - Username: `admin`
  - Password: `admin`

- **Salesman:**
  - Username: `salesman1`
  - Password: `salesman1`

## 📋 Features Implemented

### ✅ All Review Points Addressed

1. **Dashboard Logo** - Larger, clearer, without background
2. **Login Page** - Updated to Mart-focused messaging
3. **Functional Graphs** - All dashboard charts working
4. **User Management** - Complete redesign with clean UI
5. **Permissions System** - Full implementation:
   - Multi-person transactions
   - Duplicate TX ID control
   - Admin approval workflow
   - EasyPaisa receipt mandatory
   - EasyPaisa OCR scanning
   - Scanner access control
   - Reprint restrictions
6. **WhatsApp Integration** - Tab reuse, proper message format
7. **Thermal Printing** - Correct print logic for 80mm thermal printers
8. **Ticket Design** - Optimized layout, masked contacts, package name
9. **Ticket Template Editor** - Customizable fields
10. **Marketing Campaigns** - WhatsApp bulk messaging
11. **Scanner** - QR code scanning with WhatsApp verification

## 🏗️ Project Structure

```
kartal-mart/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── TicketGeneration.jsx
│   │   ├── TicketList.jsx
│   │   ├── Scanner.jsx
│   │   ├── TicketTemplateEditor.jsx
│   │   ├── SystemSettings.jsx
│   │   └── MarketingCampaigns.jsx
│   ├── App.jsx
│   └── index.js
├── package.json
├── IMPLEMENTATION_GUIDE.md
└── README.md
```

## 🔧 Key Technologies

- **React 18** - Frontend framework
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Tesseract.js** - OCR for receipt scanning
- **jsQR** - QR code scanning
- **Lucide React** - Icons

## 📱 Converting to Mobile APK

### Using Capacitor (Recommended)

1. **Install Capacitor**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Kartal Mart" "com.kartal.mart"
   ```

2. **Add Android Platform**
   ```bash
   npm install @capacitor/android
   npx cap add android
   ```

3. **Build and Sync**
   ```bash
   npm run build
   npx cap copy
   npx cap sync
   ```

4. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

5. **Build APK**
   - In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - APK location: `android/app/build/outputs/apk/`

See `IMPLEMENTATION_GUIDE.md` for detailed instructions.

## 🎯 User Permissions System

### Permission Types

| Permission | Description |
|------------|-------------|
| Allow Multi-Person TX | Submit one transaction for multiple people |
| Allow Duplicate TX ID | Same transaction ID can be used multiple times |
| Require Admin Approval | All transactions need admin verification |
| EasyPaisa Receipt Mandatory | Receipt upload required for EasyPaisa |
| EasyPaisa Scan Mandatory | OCR verification required |
| Allow Scanner | Access to QR code scanner |
| Allow Reprint | Can reprint tickets |

## 🖨️ Thermal Printer Setup

1. Set default printer to thermal printer in OS
2. Paper width: 80mm
3. Enable auto-cut
4. Use draft print mode

## 📞 WhatsApp Integration

### Current Implementation
- Manual WhatsApp Web integration
- Tab reuse for multiple messages
- Proper message formatting

### For Automated Messaging
Integrate with:
- **WATI.io** (Recommended for beginners)
- **Twilio WhatsApp API** (Enterprise)
- **Official WhatsApp Business API**

See `IMPLEMENTATION_GUIDE.md` for setup instructions.

## 🔐 Security Notes

- Change default passwords immediately
- Implement proper authentication (JWT recommended)
- Use HTTPS in production
- Validate all file uploads
- Rate limit API endpoints

## 📖 Documentation

- **Full Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **API Documentation:** See backend API docs
- **User Manual:** Coming soon

## 🐛 Known Issues

- Marketing campaigns require manual WhatsApp Business API integration for automation
- OCR accuracy depends on image quality
- Thermal printer drivers must be installed

## 🔄 Future Enhancements

- Online shopping integration
- Mobile app with push notifications
- Advanced analytics dashboard
- Payment gateway integration
- Automated draw system

## 📧 Support

- Email: support@kartalmart.com
- Phone: +92-XXX-XXXXXXX

## 📝 License

Copyright © 2026 Kartal Group of Companies. All rights reserved.

---

**Version:** 1.0.0  
**Last Updated:** March 11, 2026  
**Built with:** React & ❤️ by Claude (Anthropic)
