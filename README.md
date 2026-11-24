<div align="center">
  
# StudySyncro 🚀

**A comprehensive, real-time collaborative study platform.**  
Connect with students, manage interactive study sessions, host live quizzes, and foster a productive online learning environment—all built with performance, security, and global accessibility in mind.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.x-brightgreen.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-Admin-orange.svg)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![StudySyncro Hero Screenshot](client/public/images/home/active-home-page-light.webp) 

</div>

---

## 🛠 Tech Stack & Architecture

### **Frontend**
- **Architecture:** Vanilla JavaScript (ES Modules), HTML5, and CSS3. Built without heavy frontend frameworks to ensure maximum performance, instant load times, and minimal bundle size.
- **Templating:** EJS (Embedded JavaScript) for Server-Side Rendering (SSR) and dynamic SEO metadata.
- **Styling:** Custom CSS leveraging modern specifications (e.g., `dvh` dynamic viewports, CSS Variables), complete light/dark mode theming, and an automated pipeline for minification.
- **PWA:** Fully compliant Progressive Web App with Service Workers, enabling offline caching and an installable native-like experience on mobile and desktop.

### **Backend**
- **Runtime & Framework:** Node.js powered by Express.js.
- **Authentication:** Firebase Auth unified with secure, HttpOnly JWT cookies to maintain strict session state across SSR and client boundaries.
- **Security Defenses:** 
  - `helmet` for strict HTTP header enforcement.
  - `express-rate-limit` for robust API abuse prevention.
  - `xss` for input sanitization against Cross-Site Scripting.
  - `csrf` implementation to prevent Cross-Site Request Forgery.
- **Email Delivery:** `nodemailer` handles automated transactional workflows (email verification, password resets, role updates).

### **Database & Cloud Services**
- **Primary Data Layer:** Firebase Cloud Firestore (NoSQL) for structured, scalable querying of user profiles, study groups, and historical sessions.
- **Real-Time Layer:** Firebase Realtime Database (RTDB) serving as the backbone for live chat, instant participant presence tracking, and synchronized study timers.
- **Hosting Engine:** Optimized for Vercel (Serverless Functions via `vercel.json`) ensuring elastic scalability.

---

## ✨ Advanced Core Features

- **Live Study Sessions:** Real-time synchronized sessions equipped with interactive tasks, synchronized countdown timers, and active participant tracking.
- **Dynamic Quizzes:** Build, assign, and auto-grade quizzes within a live session. Track passed quizzes and monitor individual user scores.
- **Granular Group Management:** Create private or public study groups, manage incoming join requests, assign administrative roles, and securely handle member permissions.
- **Real-Time Group Chat:** Low-latency live messaging within groups utilizing Firebase RTDB.
- **Seamless i18n Localization:** Native English (LTR) and Arabic (RTL) support. The UI layout dynamically mirrors itself based on the selected language, supported by an automated translation pipeline for detecting missing strings.
- **Web Push Notifications:** Native cross-device Web Push API integration alerting users of session invites, session starts, and role changes—even when the app is closed.
- **SEO & Discoverability:** Advanced SSR injected with JSON-LD Structured Data (SoftwareApplication, Organization, WebSite), canonical links, and hreflang tags to ensure peak search engine visibility.
- **Transaction Safety:** Strict backend transactional validation preventing race conditions (e.g., preventing read-after-write violations) during high-concurrency actions like quiz submissions.

---

## 📂 Project Structure

```text
D:\StudySyncro\
├── client/                     # Frontend Static Assets & Scripts
│   └── public/
│       ├── app/                # Main dashboard app assets (CSS/JS for sessions, groups, etc.)
│       ├── images/             # Static images, SVGs, and PWA icons
│       ├── main_assets/        # Landing page and global styling
│       ├── login/              # Auth flow specific assets
│       ├── reset-password/     # Password recovery assets
│       ├── manifest.json       # PWA Configuration
│       └── robots.txt          # SEO Crawl rules
├── server/                     # Backend Express Application
│   ├── app.js                  # Main Express server entry point
│   ├── controllers/            # Route controllers (Auth, Groups, Sessions)
│   ├── middleware/             # Custom Express middlewares (i18n, rate-limit, auth-check)
│   ├── routes/                 # Express API & View routers
│   ├── utils/                  # Helper functions
│   │   ├── cron/               # Scheduled automated jobs (e.g., inactive session cleaners)
│   │   └── firebase-utils/     # Secure Firestore/RTDB database abstraction layer
│   └── views/                  # EJS Templates (SSR rendering)
├── firebase.json               # Firebase configuration rules
├── vercel.json                 # Vercel deployment & caching directives
└── package.json                # Project dependencies and npm scripts
```

---

## 🚀 Installation & Setup

### 1. System Requirements
- Node.js (v18.x or v20.x recommended)
- npm or yarn
- A Firebase Project (with Firestore, RTDB, and Auth enabled in the Firebase Console)

### 2. Local Setup
Clone the repository and install the backend dependencies:

```bash
git clone https://github.com/Abdelhamid-Hour/StudySyncro.git
cd StudySyncro/server
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory. The application relies on several critical services, so you must configure Firebase, Email, and Push Notification credentials correctly:

```env
# Server Configuration
NODE_ENV=development

# Firebase Client config (Used for client SDK initialization)
FIREBASE_API_KEY=your_firebase_api_key

# Firebase Admin SDK Configuration
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project-id.iam.gserviceaccount.com",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your_service_account"
}'

# SMTP Settings for Nodemailer
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=your_generated_vapid_public_key
VAPID_PRIVATE_KEY=your_generated_vapid_private_key
```

#### Important Setup Notes:
- **Firebase Service Account:** You must generate a new private key from your Firebase Console under `Project Settings > Service Accounts`. Paste the *entire* generated JSON object string into the `FIREBASE_SERVICE_ACCOUNT` variable. The `private_key` property inside this JSON is highly sensitive.
- **Nodemailer (EMAIL_PASS):** If using Gmail, standard passwords will not work. You must enable 2FA on your Google Account and generate an **App Password** to use as your `EMAIL_PASS`.
- **VAPID Keys:** To send Web Push notifications, you must generate your own VAPID keys. Run `npx web-push generate-vapid-keys` in your terminal and place the output into `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

### 4. Start the Development Server
```bash
# From within the server/ directory:
npm run dev
```
The application will launch and be accessible at `http://localhost:3000`.

---

## 📜 Available Scripts

Inside the `server` directory:
- `npm run dev` — Starts the backend server utilizing `nodemon` for automated hot-reloading during development.
- `npm start` — Starts the production-ready server instance.

---

## ☁️ Deployment Architecture

This project is architected for seamless deployment on **Vercel** as a Node.js Serverless application:

1. **Routing Engine:** The `vercel.json` file controls the build routing and heavily optimizes static asset caching headers (`Cache-Control: public, max-age=31536000, immutable`).
2. **Serverless execution:** All dynamic routes (`/(.*)`) are captured and rewritten to `server/app.js`.
3. **Execution Environment:** To deploy, connect your GitHub repository to Vercel and populate your environment variables within the Vercel Dashboard. No custom build scripts are necessary as Vercel detects the `@vercel/node` builder pipeline automatically.

---

<div align="center">
  <i>Architected and developed with ❤️ for the future of collaborative learning.</i>
</div>
