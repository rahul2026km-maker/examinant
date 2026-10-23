# EXAMINANT - Complete Project Documentation
# Examinantt - India ka Premium Online Test & Learning Platform

---

## PROJECT KYA HAI?

Examinantt ek full-featured Online Education & Test Preparation Platform hai jo Indian competitive exam students ke liye banaya gaya hai — jaise JEE, NEET, SSC, UPSI, NDA, CUET, etc.

Ye platform 3 types ke users ke liye kaam karta hai:
1. Admin       - Jo platform manage karta hai (Teachers / Institute owners)
2. Students    - Jo tests dete hain aur padhai karte hain
3. Public      - Jo free resources dekh sakte hain

---

## TECH STACK

| Technology        | Kaam                          |
|-------------------|-------------------------------|
| React 19          | Frontend UI framework         |
| TypeScript        | Type-safe JavaScript          |
| Vite              | Fast build tool / Dev server  |
| TailwindCSS v4    | Styling                       |
| Framer Motion     | Animations                    |
| Firebase Firestore| Database (NoSQL, Real-time)   |
| Firebase Auth     | Login / Signup                |
| Firebase Storage  | File storage                  |
| Cloudinary        | Image/Media upload (CDN)      |
| React Router v7   | Page routing / Navigation     |
| Recharts          | Analytics graphs              |
| jsPDF             | PDF generate karna            |
| PapaParser        | CSV bulk import               |
| QRCode.react      | QR Code generate karna        |

---

## PROJECT STRUCTURE (Folder structure)

examinant/
|-- public/
|   |-- uploads/          <- Local image uploads (dev only)
|-- server/
|   |-- index.js          <- Node.js backend (OTP, email) - Port 3001
|-- src/
|   |-- components/       <- Reusable UI components
|   |   |-- admin/        <- Admin-specific components
|   |   |-- landing/      <- Landing page components
|   |   |-- student/      <- Student components
|   |   |-- test/         <- Test attempt components
|   |-- pages/
|   |   |-- admin/        <- Admin panel (23 pages)
|   |   |-- student/      <- Student panel (18 pages)
|   |   |-- *.tsx         <- Public pages (Landing, Login, etc.)
|   |-- services/         <- Firebase & API calls (18 services)
|   |-- types/            <- TypeScript type definitions
|   |-- utils/            <- Helper functions (cloudinary, etc.)
|   |-- firebase.ts       <- Firebase configuration
|   |-- App.tsx           <- Main app with all routes
|-- .env                  <- Environment variables (secrets)
|-- vite.config.ts        <- Vite configuration
|-- package.json          <- Project dependencies

---

## PROJECT KAISE CHALAYE? (Local Setup)

### Step 1: Clone karo
  git clone https://github.com/rahul2026km-maker/examinant.git
  cd examinant

### Step 2: Dependencies install karo
  npm install

### Step 3: .env file banao aur ye values daalo
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

### Step 4: Dev server chalo
  npm run dev
  => App: http://localhost:5173

### Step 5: Production build
  npm run build

---

## ADMIN PANEL - Puri Guide
Admin URL: http://localhost:5173/admin-dashboard

---

### 1. DASHBOARD
Path: /admin-dashboard
- Total Students count
- Active Test Series count
- Total Questions in Bank
- Total Chapters
- Recent purchases / payments
- Analytics growth graph

---

### 2. TEST SERIES MANAGEMENT
Path: /admin-dashboard/test-series

Kya kar sakte hain:
- "+ New Series" button se nayi series banao:
    * Series naam daalo (e.g., "JEE Mains 2025 Full Package")
    * Banner/Thumbnail image upload karo
    * Exam category chuno (JEE, NEET, SSC, Railways, etc.)
    * Pricing set karo (Free ya Paid with amount)
    * Description aur features likho
- "Edit" button se existing series update karo
- "Clone" button se series ki copy banao
- "Delete" button se series hatao
- "Tests" button se series ke andar ke tests dekho

---

### 3. DIGITAL TEST BANANA
Path: /admin-dashboard/create-test

Steps:
  Step 1 - Basic Info:
    - Test naam likho
    - Konsi series me daalna hai select karo
    - Test type chuno: Mock / Practice / Previous Year / Subject Wise / Chapter Wise

  Step 2 - Questions Config:
    - Subject select karo (Physics, Chemistry, etc.)
    - Chapter select karo
    - Total questions kitne honge
    - MCQ percentage aur Numerical percentage

  Step 3 - Settings:
    - Duration (minutes me) set karo
    - Marks per question (+4 default)
    - Negative marking (-1 default)
    - Shuffle questions on/off
    - Show solutions on/off

  Step 4 - Review & Publish:
    - Preview dekho
    - Draft save karo ya directly Publish karo

---

### 4. OMR TEST BANANA
Path: /admin-dashboard/create-omr-test

Kab use karo: Jab offline paper/OMR wala test online system me add karna ho

Steps:
  Step 1 - Basic Info: naam, series, type, duration
  Step 2 - OMR Template: sections banao (Physics 45 Qs, Chemistry 45 Qs, etc.)
  Step 3 - Answer Key: har question ka sahi answer mark karo
  Step 4 - Review & Publish

---

### 5. QUESTION BANK (SABSE IMPORTANT)
Path: /admin-dashboard/question-bank

Yahan saare questions store hote hain jisse tests automatically generate hote hain.

QUESTION ADD KARNA:
  - "Add New Question" button dabao
  - Form me ye bharo:
      * Question text (English me)
      * Question text Hindi me (optional)
      * Question type: MCQ ya Numerical
      * Options: A, B, C, D (MCQ ke liye)
      * Correct answer select karo
      * Subject chuno
      * Chapter chuno
      * Unit & Topic (optional)
      * Difficulty: Easy / Medium / Hard
      * Marks & Negative marks
      * Image upload karo (JPG/PNG - optional)
      * Explanation (English + Hindi - optional)
  - "Add Question" dabao

BULK CSV IMPORT:
  - "Bulk Import" button se CSV file se hazaron questions ek saath upload karo
  
  CSV format:
  text, type, options, correctAnswer, subject, chapter, difficulty
  "Newton's 1st law?", "MCQ", "Inertia,Motion,Gravity,Force", "0", "Physics", "Laws of Motion", "Easy"
  "Value of g?", "Numerical", "", "9.8", "Physics", "Gravitation", "Easy"

FILTER KARNA:
  - Subject, Chapter, Type, Difficulty se filter lagao
  - Search box se question dhundho

---

### 6. STUDENTS MANAGEMENT
Path: /admin-dashboard/students

- Saare registered students ki list
- Har student ka: naam, email, phone, join date
- Purchase history dekho
- Student block/unblock karo
- Search & filter karo

---

### 7. PAYMENTS
Path: /admin-dashboard/payments

- Saare payment transactions
- Kiska payment aaya, kya purchase kiya
- Amount aur date
- Revenue analytics

---

### 8. LIVE CLASSES
Path: /admin-dashboard/live-classes

- Nayi live class schedule karo
- Teacher assign karo
- Subject aur batch set karo
- JaaS virtual classroom se live stream
- Recorded class links add karo

---

### 9. PYQs (PREVIOUS YEAR QUESTIONS)
Path: /admin-dashboard/pyqs

- PYQ papers upload karo (PDF format)
- Exam name, year, subject set karo
- Free ya paid access set karo students ke liye

---

### 10. RESOURCES
Path: /admin-dashboard/resources

- Study materials upload karo (PDF, notes, formula sheets)
- Category wise organize karo
- Free ya paid access set karo

---

### 11. COURSES
Path: /admin-dashboard/courses

- Video courses banao
- Lessons/chapters add karo
- Video content upload karo
- Course pricing set karo

---

### 12. CURRICULUM SETUP (ZAROORI - PEHLE KARO)
Test series aur question bank se pehle ye setup karo:

ORDER:
  1. /admin-dashboard/exams     -> Exams add karo (JEE, NEET, SSC, etc.)
  2. /admin-dashboard/subjects  -> Subjects add karo (Physics, Chemistry, etc.)
  3. /admin-dashboard/chapters  -> Chapters add karo (Laws of Motion, etc.)
  4. /admin-dashboard/topics    -> Topics add karo (Newton's Laws, etc.)

Hierarchy: Exam -> Subject -> Chapter -> Unit -> Topic

---

### 13. INQUIRIES
Path: /admin-dashboard/inquiries

- Contact form se aaye messages
- Students ke doubts/queries

---

## STUDENT PANEL - Puri Guide
Login URL: http://localhost:5173/login

---

### 1. STUDENT DASHBOARD
Path: /student-dashboard
- Purchased series
- Recent test attempts
- Performance summary
- Quick action buttons

### 2. MARKETPLACE
Path: /student-dashboard/marketplace
- Available test series browse karo
- Category filter lagao
- Free demo try karo
- Paid series purchase karo

### 3. TEST DENA (ONLINE)
1. Test select karo
2. Mode chuno: Exam Mode / Practice Mode
3. Timer start hoga
4. MCQ me A/B/C/D click karo, Numerical me value type karo
5. Questions bookmark kar sakte ho
6. Submit karo
7. Result page par detailed analysis dekho

### 4. OMR TEST DENA
1. OMR test select karo
2. OMR sheet download karo (PDF)
3. Print karo aur pen se bharo
4. Photo lo ya scan karo
5. Upload karo
6. System auto-check karega answer key se

### 5. ANALYTICS
Path: /student-dashboard/analytics
- Subject-wise accuracy
- Chapter-wise performance
- Time analysis per question
- All India Rank
- Progress graph (improvement over time)

### 6. MY RESOURCES
Path: /student-dashboard/resources
- Purchased study material
- PDF download

### 7. LIVE CLASSES & COURSES
Path: /student-dashboard/courses
- Enrolled batch ki classes
- Recorded lectures
- Course progress

### 8. COMMUNITY
Path: /student-dashboard/community
- Doubts post karo
- Peers se baat karo
- Teacher answers

---

## PUBLIC PAGES (Bina login ke accessible)

  /                   -> Home / Landing page
  /test-series        -> All test series browse
  /test-series/:id    -> Test series detail & purchase
  /courses            -> All video courses
  /pyqs               -> Previous Year Questions
  /resources          -> Free study resources
  /login              -> Login page
  /signup             -> New account banana
  /about              -> About Examinantt
  /contact            -> Contact form
  /privacy-policy     -> Privacy policy
  /terms              -> Terms & conditions
  /refund-policy      -> Refund policy

---

## FIREBASE DATABASE STRUCTURE

Firestore Collections:
  users/           -> Student & Admin accounts
  testSeries/      -> Test series packages
  tests/           -> Individual tests inside series
  questions/       -> All questions (Question Bank)
  attempts/        -> Student test attempts & scores
  purchases/       -> Payment records
  courses/         -> Video courses
  liveClasses/     -> Live class sessions
  pyqs/            -> Previous year question papers
  resources/       -> Study materials
  batches/         -> Student batches/groups
  exams/           -> Exam categories (JEE, NEET, etc.)
  subjects/        -> Subjects (Physics, Chemistry, etc.)
  chapters/        -> Chapters list
  topics/          -> Topics list
  inquiries/       -> Contact form submissions
  certificates/    -> Student achievement certificates
  community/       -> Community posts & discussions

---

## IMAGE UPLOAD SYSTEM

Upload hone ka order (priority):

1. CLOUDINARY (Primary - Best for production)
   - Set karo: VITE_CLOUDINARY_CLOUD_NAME aur VITE_CLOUDINARY_UPLOAD_PRESET
   - Image CDN par store hogi, har jagah accessible

2. LOCAL SERVER (PDF / Video ke liye only)
   - Files -> public/uploads/ folder me save
   - SIRF development me kaam karta hai
   - Live website par broken image aayega

3. BASE64 FALLBACK (Last resort)
   - Image compress ho ke database me save
   - Koi cloud account nahi chahiye
   - Thoda slow hai badi images ke liye

IMPORTANT NOTE:
  Agar production (live site examinantt.com) par image dikhani hai
  to CLOUDINARY setup karna ZAROORI hai.
  Local uploads sirf aapke computer par kaam karte hain.

---

## EMAIL / OTP SYSTEM

  File: server/index.js
  Port: 3001

  Start karne ke liye:
    npm run server   (alag terminal me)
    ya
    npm run dev     (vite ke saath auto-start hota hai)

  Kya karta hai:
  - Login ke liye OTP email bhejta hai
  - Email verification karta hai

---

## LOGIN / AUTH SYSTEM

3 Methods:
  1. Email + Password  -> Regular login
  2. Email OTP         -> One-time password via email
  3. Google Sign-In    -> Firebase Google Auth

Admin Account Banana:
  - Normal signup karo
  - Firebase Console -> Firestore -> users collection -> us user ka document kholo
  - role field add karo: "admin"

---

## DEPLOYMENT - VERCEL PAR KAISE DEPLOY KARE

Steps:
  1. vercel.com par account banao
  2. "New Project" -> GitHub repo select karo
  3. Framework: Vite
  4. Build Command: npm run build
  5. Output Directory: dist
  6. Environment Variables section me ye sab add karo:
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
  7. Deploy karo

---

## COMMON PROBLEMS & SOLUTIONS

Problem: Banner image live site par nahi dikh raha
  Solution: Cloudinary setup karo. Local path production par kaam nahi karta.

Problem: "Something went wrong" error
  Solution: Browser F12 -> Console tab me exact error dekho, refresh karo.

Problem: Question bank me question add nahi ho raha
  Solution: Firebase Firestore security rules check karo.

Problem: Login nahi ho raha
  Solution: Firebase Authentication console me check karo. Email/Password auth enabled hai?

Problem: OTP email nahi aa raha
  Solution: server/index.js chal raha hai? Port 3001 check karo.

Problem: Image upload bahut slow hai
  Solution: Cloudinary set karo. Base64 conversion badi images ke liye slow hoti hai.

Problem: Git push permission denied
  Solution: gh auth login karo, phir gh auth setup-git, phir git push.

Problem: npm run build fail ho raha hai
  Solution: npm install dobara karo. TypeScript errors fix karo.

---

## GIT WORKFLOW (DAILY USE)

Roz kaam karne ka process:
  git pull origin main          # Latest code lo pehle
  # ... apna kaam karo ...
  git add -A                    # Saare changes stage karo
  git commit -m "Kya kiya"      # Commit message likho
  git push origin main          # GitHub par upload karo

GitHub login issue aane par:
  gh auth login                 # GitHub CLI se login karo
  gh auth setup-git             # Git credentials update karo
  git push origin main          # Ab push ho jayega

---

## RECENT CHANGES

  23-Oct-2026: Banner upload fix - thumbnailUrl ab cards par sahi dikhta hai
  23-Oct-2026: Image upload speed fast - artificial delays remove kiye
  23-Oct-2026: AdminLiveClassesPage crash fix - null-safe toLowerCase
  23-Oct-2026: Image compression optimize (800px, quality 0.75)
  23-Oct-2026: Upload progress percentage ab button par dikh raha hai

---

Documentation: 23 October 2026
Project: Examinantt v0.0.0
GitHub: https://github.com/rahul2026km-maker/examinant
Live Site: https://examinantt.com
