# StudySyncro 🚀

StudySyncro is a comprehensive, real-time collaborative study platform designed to connect students, facilitate group study sessions, manage quizzes, and foster a productive online learning environment. Built with a focus on performance, SEO, and global accessibility (full Arabic/English RTL/LTR support).

![StudySyncro Hero Screenshot](client/public/images/home/active-home-page-light.webp) <!-- Replace with actual hero image path if different -->

---

## 🛠 Tech Stack

### **Frontend**

- **Architecture:** Vanilla JavaScript (ES Modules), HTML5, CSS3. No heavy frontend frameworks to ensure maximum performance and minimal bundle size.
- **Templating:** EJS (Embedded JavaScript) for Server-Side Rendering (SSR) and dynamic SEO metadata.
- **Styling:** Custom CSS with advanced modern features (`dvh` dynamic viewports, CSS Variables), light/dark mode theming, and a robust PostCSS pipeline for minification and vendor prefixing.
- **PWA:** Fully compliant Progressive Web App with Service Workers and manifest for installable mobile/desktop experiences.

### **Backend**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Security:** `helmet` for HTTP headers, `express-rate-limit` for API abuse prevention, `xss` for input sanitization, and `csrf` protection.
- **Authentication:** Firebase Auth combined with secure JWT cookies.
- **Email:** `nodemailer` for transactional emails (verification, reset passwords, notifications).

### **Database & Cloud Services**

- **Database (Primary):** Firebase Cloud Firestore (NoSQL) for structured user, group, and session data.
- **Database (Real-Time):** Firebase Realtime Database (RTDB) for live chat, online presence, and real-time syncing.
- **Hosting:** Vercel (Serverless Functions via `vercel.json`).

---

## ✨ Core Features

- **Real-Time Study Sessions:** Synchronized group sessions with interactive tasks, synchronized timers, and live participant presence.
- **Group Management:** Create private or public study groups, manage join requests, assign roles, and handle member permissions.
- **Interactive Quizzes:** Build, assign, and auto-grade quizzes within study sessions. Track passed quizzes and user scores.
- **Live Chat:** Real-time messaging within groups using Firebase RTDB.
- **Complete i18n & Localization:** Full English (LTR) and Arabic (RTL) support. The UI layout dynamically mirrors itself based on the selected language. Includes an automated pipeline for missing string detection.
- **Push Notifications:** Web Push API integration for cross-device alerts (invites, session starts, role changes).
- **SEO Optimized:** Server-side rendered pages with dynamically injected JSON-LD Structured Data (SoftwareApplication, Organization, WebSite) and canonical/hreflang tags.
- **Security First:** Strict Firestore security rules, backend transaction validation (preventing read-after-write violations), and rate-limited auth routes.

---

## 📂 Project Structure

```text
D:\PFE\
├── client/                     # Frontend Static Assets & Scripts
│   └── public/
│       ├── app/                # Main dashboard app assets (CSS/JS for active sessions, groups, etc.)
│       ├── images/             # Static images, SVGs, and PWA icons
│       ├── main_assets/        # Landing page and global assets
│       ├── login/              # Login/Register specific assets
│       ├── reset-password/     # Password recovery assets
│       ├── manifest.json       # PWA Manifest
│       └── robots.txt          # SEO Crawl rules
├── server/                     # Backend Express Application
│   ├── app.js                  # Main Express server entry point
│   ├── controllers/            # Route controllers (auth, groups, sessions)
│   ├── middleware/             # Express middlewares (i18n, rate-limit, auth-check)
│   ├── routes/                 # Express API & View routers
│   ├── utils/                  # Helper functions
│   │   ├── cron/               # Scheduled jobs (e.g., session cleaners)
│   │   └── firebase-utils/     # Firestore/RTDB database abstraction layer
│   └── views/                  # EJS Templates (SSR)
├── firebase.json               # Firebase configuration rules
├── vercel.json                 # Vercel deployment & caching rules
└── package.json                # Project dependencies and npm scripts
```

---

## 🚀 Prerequisites & Installation

### 1. System Requirements

- Node.js (v18.x or v20.x recommended)
- npm or yarn
- Firebase Project (with Firestore, RTDB, and Auth enabled)

### 2. Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Abdelhamid-Hour/PFE.git
   cd PFE
   ```

2. **Install dependencies:**

   ```bash
   cd server
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `server` directory and populate it with your Firebase Admin credentials and JWT secrets:

   ```env
   # .env
   PORT=3000
   NODE_ENV=development

   # Firebase Admin SDK configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

   # JWT Config
   JWT_SECRET=your_super_secret_jwt_string
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 📜 Available Scripts

Inside the `server` directory, you can run:

- `npm run dev` — Starts the backend server using `nodemon` for hot-reloading during development.
- `npm start` — Starts the production server using `node ./app.js`.

---

## ☁️ Deployment

This project is configured for seamless deployment on **Vercel** as a Node.js Serverless application.

1. The `vercel.json` file dictates the build routing and heavily optimizes static asset caching (`Cache-Control: public, max-age=31536000, immutable`).
2. All dynamic routes (`/(.*)`) are rewritten to `server/app.js`.
3. To deploy, simply connect your GitHub repository to Vercel and add your environment variables in the Vercel Dashboard. No custom build commands are required as Vercel detects the `@vercel/node` builder automatically.

---

_Architected and developed with ❤️ for the future of collaborative learning._
