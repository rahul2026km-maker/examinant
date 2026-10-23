# EXAMINANT - Complete Project Documentation
# Examinantt - India's Premium Online Test & Learning Platform

---

## WHAT IS THIS PROJECT?

Examinantt is a full-featured Online Education & Test Preparation Platform built for Indian competitive exam aspirants — JEE, NEET, SSC, UPSI, NDA, CUET, Railways, and more.

The platform serves 3 types of users:
  1. Admin      - Manages the platform (Teachers / Institute owners)
  2. Students   - Take tests and study
  3. Public     - Browse free resources without login

---

## TECH STACK

| Technology         | Purpose                          |
|--------------------|----------------------------------|
| React 19           | Frontend UI framework            |
| TypeScript         | Type-safe JavaScript             |
| Vite               | Fast build tool / Dev server     |
| TailwindCSS v4     | Styling                          |
| Framer Motion      | Animations                       |
| Firebase Firestore | Real-time NoSQL database         |
| Firebase Auth      | Login / Signup                   |
| Firebase Storage   | File storage                     |
| Cloudinary         | Image/Media upload (CDN)         |
| React Router v7    | Page routing / Navigation        |
| Recharts           | Analytics charts and graphs      |
| jsPDF              | PDF generation                   |
| PapaParser         | CSV bulk import                  |
| QRCode.react       | QR Code generation               |
| Node.js (server/)  | Backend server for OTP and email |

---

## PROJECT FOLDER STRUCTURE

examinant/
|-- public/
|   |-- uploads/          <- Local image uploads (development only)
|-- server/
|   |-- index.js          <- Node.js backend (OTP, email) - runs on Port 3001
|-- src/
|   |-- components/       <- Reusable UI components
|   |   |-- admin/        <- Admin-specific components
|   |   |-- landing/      <- Public landing page components
|   |   |-- student/      <- Student panel components
|   |   |-- test/         <- Test attempt components
|   |-- pages/
|   |   |-- admin/        <- Admin panel pages (23 pages)
|   |   |-- student/      <- Student panel pages (18 pages)
|   |   |-- *.tsx         <- Public pages (Landing, Login, Signup, etc.)
|   |-- services/         <- Firebase & API calls (18 service files)
|   |-- types/            <- TypeScript type definitions
|   |-- utils/            <- Helper utilities (cloudinary.ts, etc.)
|   |-- firebase.ts       <- Firebase configuration
|   |-- App.tsx           <- Main app with all routes
|-- .env                  <- Environment variables (never commit this)
|-- vite.config.ts        <- Vite configuration
|-- package.json          <- Project dependencies
|-- EXAMINANT_DOCUMENTATION.md <- This file

---

## HOW TO RUN LOCALLY

### Step 1: Clone the repository
  git clone https://github.com/rahul2026km-maker/examinant.git
  cd examinant

### Step 2: Install dependencies
  npm install

### Step 3: Create a .env file and add these values
  VITE_FIREBASE_API_KEY=your_firebase_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
  VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
  VITE_API_URL=http://localhost:3001
  VITE_JAAS_APP_ID=your_jaas_id

### Step 4: Start the development server
  npm run dev
  => App runs at: http://localhost:5173

### Step 5: Build for production
  npm run build

---

## ADMIN PANEL - Complete Guide

Admin Panel URL: http://localhost:5173/admin-dashboard

---

### 1. DASHBOARD
Path: /admin-dashboard

What you can see:
  - Total registered students
  - Active test series count
  - Total questions in question bank
  - Total chapters in curriculum
  - Recent purchases and payments
  - Revenue analytics graph with growth trend

---

### 2. TEST SERIES MANAGEMENT
Path: /admin-dashboard/test-series

A "Test Series" is a package/bundle of multiple tests (like a course folder).

Actions available:
  - Create New Series:
      * Enter series name (e.g., "JEE Mains 2025 Full Package")
      * Upload a banner/thumbnail image
      * Select exam category (JEE, NEET, SSC, Railways, etc.)
      * Set pricing: Free or Paid (with amount)
      * Write a description and feature highlights
  - Edit   -> Update any existing series details
  - Clone  -> Duplicate a series with all its tests
  - Delete -> Permanently remove a series
  - Tests  -> View and manage tests inside a series

---

### 3. CREATE A DIGITAL TEST
Path: /admin-dashboard/create-test

Step 1 - Basic Info:
  - Enter test name
  - Select which series it belongs to
  - Choose test type: Mock / Practice / Previous Year / Subject Wise / Chapter Wise

Step 2 - Question Configuration:
  - Select subjects (Physics, Chemistry, Mathematics, etc.)
  - Select chapters
  - Set total number of questions
  - Set MCQ percentage and Numerical percentage

Step 3 - Test Settings:
  - Duration in minutes
  - Marks per correct answer (default: +4)
  - Negative marking (default: -1)
  - Enable/disable question shuffling
  - Show/hide solutions after submission

Step 4 - Review and Publish:
  - Preview the complete test
  - Save as Draft or Publish immediately

---

### 4. CREATE AN OMR TEST
Path: /admin-dashboard/create-omr-test

Use this when: You want to add a paper-based OMR style test to the platform.

Step 1 - Basic Info: name, series, type, duration
Step 2 - OMR Template: create sections (e.g., Physics 45 Qs, Chemistry 45 Qs)
Step 3 - Answer Key: mark the correct answer for each question
Step 4 - Review and Publish

---

### 5. QUESTION BANK (Most Important)
Path: /admin-dashboard/question-bank

This is where all questions are stored. Tests pull questions from here automatically.

ADD A SINGLE QUESTION:
  Click "Add New Question" and fill:
    - Question text in English
    - Question text in Hindi (optional)
    - Question type: MCQ or Numerical
    - For MCQ: Options A, B, C, D
    - Correct answer (select option or enter number)
    - Subject, Chapter, Unit, Topic
    - Difficulty: Easy / Medium / Hard
    - Marks and Negative marks
    - Attach image (JPG/PNG) if needed
    - Explanation in English and Hindi (optional)
  Click "Add Question" to save.

BULK CSV IMPORT (Upload thousands of questions at once):
  Click "Bulk Import" and upload a CSV file in this format:

  text, type, options, correctAnswer, subject, chapter, difficulty
  "What is Newton's 1st law?","MCQ","Inertia,Motion,Gravity,Force","0","Physics","Laws of Motion","Easy"
  "Find the value of g at sea level","Numerical","","9.8","Physics","Gravitation","Easy"

FILTER AND SEARCH:
  - Filter by Subject, Chapter, Type, or Difficulty
  - Use the search box to find specific questions

EDIT / DELETE:
  - Click the Edit icon on any question to update it
  - Click Delete to permanently remove a question

---

### 6. STUDENTS MANAGEMENT
Path: /admin-dashboard/students

  - View all registered students
  - See details: name, email, phone, registration date
  - View each student's purchase history
  - Block or unblock a student
  - Search and filter students

---

### 7. PAYMENTS
Path: /admin-dashboard/payments

  - View all transactions
  - See what each student purchased
  - Payment amount and date
  - Revenue analytics

---

### 8. LIVE CLASSES MANAGEMENT
Path: /admin-dashboard/live-classes

  - Schedule a new live class
  - Assign a teacher/educator
  - Set subject and batch
  - Start a live stream using JaaS virtual classroom
  - Add links to recorded sessions

---

### 9. PYQs (Previous Year Questions)
Path: /admin-dashboard/pyqs

  - Upload PYQ papers in PDF format
  - Set exam name, year, and subject
  - Set free or paid access for students

---

### 10. RESOURCES
Path: /admin-dashboard/resources

  - Upload study materials (PDFs, notes, formula sheets)
  - Organize by category
  - Set free or paid access

---

### 11. COURSES
Path: /admin-dashboard/courses

  - Create video-based courses
  - Add chapters and lessons
  - Upload video content
  - Set course pricing

---

### 12. CURRICULUM SETUP (Do This First!)
Before adding questions or tests, set up the curriculum structure:

Order of setup:
  1. /admin-dashboard/exams     -> Add exam categories (JEE, NEET, SSC, etc.)
  2. /admin-dashboard/subjects  -> Add subjects (Physics, Chemistry, Maths, etc.)
  3. /admin-dashboard/chapters  -> Add chapters under each subject
  4. /admin-dashboard/topics    -> Add topics under each chapter

Hierarchy: Exam -> Subject -> Chapter -> Unit -> Topic

---

### 13. INQUIRIES
Path: /admin-dashboard/inquiries

  - Read messages submitted via the Contact form
  - Respond to student queries

---

### 14. SETTINGS
Path: /admin-dashboard/settings

  - Configure platform-level settings

---

## STUDENT PANEL - Complete Guide

Login URL: http://localhost:5173/login

---

### 1. STUDENT DASHBOARD
Path: /student-dashboard
  - Overview of purchased series
  - Recent test attempts
  - Performance summary
  - Quick action buttons

### 2. MARKETPLACE
Path: /student-dashboard/marketplace
  - Browse all available test series
  - Filter by exam category (JEE, NEET, SSC, etc.)
  - Try free demo tests
  - Purchase paid series

### 3. TAKING AN ONLINE TEST
  1. Select a test from your dashboard
  2. Choose mode: Exam Mode or Practice Mode
  3. A timer will start automatically
  4. For MCQ: click the correct option (A/B/C/D)
  5. For Numerical: type the answer value
  6. Bookmark questions to revisit later
  7. Submit when done
  8. View detailed result and analysis

### 4. TAKING AN OMR TEST
  1. Select an OMR test
  2. Download the OMR answer sheet PDF
  3. Print it and fill in answers with a pen
  4. Take a photo or scan the filled sheet
  5. Upload the image to the platform
  6. The system auto-evaluates against the answer key

### 5. ANALYTICS
Path: /student-dashboard/analytics
  - Subject-wise accuracy breakdown
  - Chapter-wise performance
  - Time spent per question analysis
  - All-India rank among test takers
  - Score improvement graph over time

### 6. MY RESOURCES
Path: /student-dashboard/resources
  - Access purchased study materials
  - Download PDFs

### 7. LIVE CLASSES & COURSES
Path: /student-dashboard/courses
  - Join live classes for enrolled batches
  - Watch recorded lectures
  - Track course progress

### 8. COMMUNITY
Path: /student-dashboard/community
  - Post doubts and questions
  - Interact with other students
  - Get answers from teachers

---

## PUBLIC PAGES (Accessible without login)

  /                   -> Home / Landing page
  /test-series        -> Browse all test series
  /test-series/:id    -> Test series detail page and purchase
  /courses            -> Browse all video courses
  /pyqs               -> Previous Year Question papers
  /resources          -> Free study resources
  /login              -> Login page
  /signup             -> Create a new account
  /about              -> About Examinantt
  /contact            -> Contact form
  /privacy-policy     -> Privacy policy
  /terms              -> Terms and conditions
  /refund-policy      -> Refund policy

---

## FIREBASE DATABASE COLLECTIONS

  users/           -> Student and Admin accounts
  testSeries/      -> Test series packages
  tests/           -> Individual tests inside series
  questions/       -> All questions (Question Bank)
  attempts/        -> Student test attempts and scores
  purchases/       -> Payment and purchase records
  courses/         -> Video-based courses
  liveClasses/     -> Live class sessions
  pyqs/            -> Previous year question papers
  resources/       -> Study materials and notes
  batches/         -> Student batches/groups
  exams/           -> Exam category definitions
  subjects/        -> Subject list
  chapters/        -> Chapter list
  topics/          -> Topic list
  inquiries/       -> Contact form messages
  certificates/    -> Student achievement certificates
  community/       -> Community posts and discussions

---

## IMAGE UPLOAD SYSTEM

How images are uploaded (in priority order):

1. CLOUDINARY (Primary - Recommended for production)
   - Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env
   - Image is stored on Cloudinary CDN and accessible from anywhere
   - Fastest and most reliable option

2. LOCAL SERVER (For PDFs and videos only)
   - Files are saved to: public/uploads/
   - Works only on your local development computer
   - Will show a broken image on the live website

3. BASE64 FALLBACK (Last resort)
   - Image is compressed and saved directly in Firestore
   - No cloud account needed
   - Slower for large images

IMPORTANT:
  For the live production site (examinantt.com), you MUST set up Cloudinary.
  Local uploads only work on your own computer.

---

## EMAIL / OTP SYSTEM

  File:    server/index.js
  Port:    3001

  To start the server separately:
    npm run server   (run in a separate terminal)

  What it does:
  - Sends OTP to email for login verification
  - Handles email-based authentication

---

## LOGIN AND AUTH SYSTEM

Three login methods are supported:
  1. Email + Password  -> Standard login
  2. Email OTP         -> One-time password sent to email
  3. Google Sign-In    -> Firebase Google OAuth

How to make a user an Admin:
  1. The user must first register normally
  2. Go to Firebase Console -> Firestore -> users collection
  3. Open that user's document
  4. Add a field: role = "admin"
  5. The user will now see the Admin panel on next login

---

## DEPLOYMENT ON VERCEL

Steps:
  1. Go to vercel.com and create an account
  2. Click "New Project" and select the GitHub repository
  3. Set Framework Preset: Vite
  4. Set Build Command: npm run build
  5. Set Output Directory: dist
  6. Add all Environment Variables (same as your .env file):
       VITE_FIREBASE_API_KEY
       VITE_FIREBASE_AUTH_DOMAIN
       VITE_FIREBASE_PROJECT_ID
       VITE_FIREBASE_STORAGE_BUCKET
       VITE_FIREBASE_MESSAGING_SENDER_ID
       VITE_FIREBASE_APP_ID
       VITE_CLOUDINARY_CLOUD_NAME
       VITE_CLOUDINARY_UPLOAD_PRESET
       VITE_API_URL
       VITE_JAAS_APP_ID
  7. Click Deploy

Note: The backend server (server/index.js) needs to be deployed separately
on a service like Render, Railway, or a VPS for OTP/email to work in production.

---

## COMMON PROBLEMS AND SOLUTIONS

Problem: Banner/thumbnail image not showing on live site
  Solution: Set up Cloudinary. Local file paths don't work on production servers.

Problem: "Something went wrong" error page
  Solution: Press F12 in browser, check Console tab for the exact error message.

Problem: Cannot add questions to question bank
  Solution: Check Firebase Firestore security rules. Make sure write access is allowed.

Problem: Login is not working
  Solution: Check Firebase Authentication console. Ensure Email/Password auth is enabled.

Problem: OTP email is not arriving
  Solution: Make sure server/index.js is running on port 3001.

Problem: Image upload is very slow
  Solution: Set up Cloudinary. Base64 compression is slow for large images.

Problem: Git push is showing permission denied
  Solution: Run "gh auth login" then "gh auth setup-git" then "git push origin main".

Problem: npm run build is failing
  Solution: Run npm install again. Fix any TypeScript errors shown in the output.

---

## GIT WORKFLOW (Daily Development)

Pull latest code before starting work:
  git pull origin main

After making changes:
  git add -A
  git commit -m "Brief description of what changed"
  git push origin main

If GitHub login issue:
  gh auth login
  gh auth setup-git
  git push origin main

---

## RECENT CHANGES LOG

  23-Oct-2026 | Banner fix: thumbnailUrl now correctly passed to TestSeriesCard
  23-Oct-2026 | Speed fix: Removed all artificial delays from admin operations
  23-Oct-2026 | Crash fix: AdminLiveClassesPage null-safe toLowerCase on filter
  23-Oct-2026 | Optimization: Image compression reduced to 800px, quality 0.75
  23-Oct-2026 | UX: Upload progress percentage now shown on Question Bank submit button

---

Last Updated: 23 October 2026
Project Version: Examinantt v0.0.0
GitHub: https://github.com/rahul2026km-maker/examinant
Live Website: https://examinantt.com
