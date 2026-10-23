import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin
let firebaseInitialized = false;
try {
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log("Firebase Admin initialized with service-account.json.");
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'examinantt-ae432'
    });
    firebaseInitialized = true;
    console.log("Firebase Admin initialized with default projectId.");
  }
} catch (error) {
  console.error("Firebase Admin initialization notice:", error.message);
}

let db;
try {
  db = admin.firestore();
} catch (e) {
  console.warn("Firestore not initialized via Admin SDK:", e.message);
}

// Reliable in-memory fallback stores to guarantee OTP verification even without Firestore Admin credentials
const inMemorySignupOtps = new Map();
const inMemoryPasswordResets = new Map();

const app = express();
app.use(cors());
app.use(express.json());

// Helper to configure Nodemailer transporter dynamically
const getTransporter = (useFallbackPort = false) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      family: 4,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: { rejectUnauthorized: false }
    });
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: useFallbackPort ? 587 : 465,
    secure: !useFallbackPort,
    family: 4, // Force IPv4 connection to prevent IPv6 ECONNREFUSED
    auth: {
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
    },
    tls: { rejectUnauthorized: false }
  });
};

const sendMailWithFallback = async (mailOptions) => {
  try {
    const transporter = getTransporter(false);
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn("Primary SMTP connection (port 465) notice, retrying with port 587 (IPv4)...", err.message);
    const fallbackTransporter = getTransporter(true);
    return await fallbackTransporter.sendMail(mailOptions);
  }
};

// Helper to generate a secure 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email sender address
const getFromAddress = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  return user ? `"Examinantt Edu" <${user}>` : 'no-reply@examinantt.com';
};

// ---------------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const hasEmailConfig = !!((process.env.EMAIL_USER && process.env.EMAIL_PASS) || (process.env.SMTP_USER && process.env.SMTP_PASS));
  res.status(200).json({
    status: 'online',
    firebaseAdmin: firebaseInitialized,
    emailConfigured: hasEmailConfig,
    senderEmail: process.env.EMAIL_USER || process.env.SMTP_USER || 'Not configured'
  });
});

// ---------------------------------------------------------------------------
// TEST EMAIL ENDPOINT
// ---------------------------------------------------------------------------
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const transporter = getTransporter();
    await transporter.verify();
    
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: 'Examinantt Test Email',
      text: 'Congratulations! Email sending is working correctly.'
    });

    res.status(200).json({ message: 'Test email delivered successfully to ' + email });
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 1. SIGNUP: REQUEST EMAIL VERIFICATION OTP
// ---------------------------------------------------------------------------
app.post('/api/request-signup-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user already exists in Firebase Auth (if Admin Auth is available)
    try {
      if (admin.apps.length > 0) {
        await admin.auth().getUserByEmail(cleanEmail);
        return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
      }
    } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found' && authErr.code !== 'auth/configuration-not-found') {
        // Continue if user-not-found
      }
    }

    // 2. Check if email exists in Firestore users collection
    if (db) {
      try {
        const userSnap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (!userSnap.empty) {
          return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
        }
      } catch (dbErr) {
        console.warn("Firestore user check notice:", dbErr.message);
      }
    }

    // 3. Generate secure 6-digit OTP and 10-minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save in-memory for instant, reliable verification
    inMemorySignupOtps.set(cleanEmail, { otp, expiresAt });

    // 4. Save to Firestore signup_otps collection (if available)
    if (db) {
      try {
        await db.collection('signup_otps').doc(cleanEmail).set({
          otp: otp,
          expiresAt: expiresAt,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbErr) {
        console.warn("Firestore signup OTP save notice (using in-memory fallback):", dbErr.message);
      }
    }

    // 5. Send Email via Transporter
    const hasEmailConfig = !!((process.env.EMAIL_USER && process.env.EMAIL_PASS) || (process.env.SMTP_USER && process.env.SMTP_PASS));
    if (!hasEmailConfig) {
      console.warn("⚠️ SMTP credentials missing. Please set EMAIL_USER and EMAIL_PASS in server/.env");
      return res.status(500).json({
        error: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASS in server/.env to send real OTPs.'
      });
    }

    const transporter = getTransporter();
    const mailOptions = {
      from: getFromAddress(),
      to: cleanEmail,
      subject: `${otp} is your Examinantt Email Verification Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; }
            .logo-sub { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; margin-top: 4px; }
            .content { padding: 32px 28px; }
            .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; }
            .desc { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
            .otp-box { background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; margin: 0; }
            .expiry-note { font-size: 12px; color: #64748b; margin-top: 10px; }
            .security-warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #92400e; margin-top: 24px; line-height: 1.5; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">EXAMINANTT</h1>
              <div class="logo-sub">Smart Learning Platform</div>
            </div>
            <div class="content">
              <span class="badge">Email Verification</span>
              <h2 class="title">Verify your email address</h2>
              <p class="desc">
                Welcome to Examinantt! To complete your student registration and start taking mock tests and video courses, please enter the One-Time Password (OTP) below:
              </p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry-note">⏱️ Valid for 10 minutes</div>
              </div>

              <div class="security-warning">
                <strong>Security Alert:</strong> Never share this OTP with anyone, including Examinantt staff. We will never ask for your code over the phone or message.
              </div>
            </div>
            <div class="footer">
              If you did not request this verification, you can safely disregard this email.<br/>
              &copy; ${new Date().getFullYear()} Examinantt. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMailWithFallback(mailOptions);
    console.log(`[Signup OTP] Delivered successfully to ${cleanEmail}`);

    res.status(200).json({ message: `Verification OTP has been sent to ${cleanEmail}.` });
  } catch (error) {
    console.error('Error requesting signup OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP to your email.' });
  }
});

// ---------------------------------------------------------------------------
// 2. SIGNUP: VERIFY EMAIL OTP
// ---------------------------------------------------------------------------
app.post('/api/verify-signup-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    let record = inMemorySignupOtps.get(cleanEmail);
    if (!record && db) {
      try {
        const docRef = db.collection('signup_otps').doc(cleanEmail);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          record = docSnap.data();
        }
      } catch (err) {
        console.warn("Firestore lookup notice:", err.message);
      }
    }

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email, or OTP has expired.' });
    }

    // Check code match
    if (String(record.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Incorrect OTP code. Please check your email and try again.' });
    }

    // Check expiration
    const expiresAt = record.expiresAt?.toDate ? record.expiresAt.toDate() : new Date(record.expiresAt);
    if (new Date() > expiresAt) {
      inMemorySignupOtps.delete(cleanEmail);
      if (db) db.collection('signup_otps').doc(cleanEmail).delete().catch(() => {});
      return res.status(400).json({ error: 'OTP has expired. Please request a new verification code.' });
    }

    // Success: Delete OTP doc so it cannot be reused
    inMemorySignupOtps.delete(cleanEmail);
    if (db) db.collection('signup_otps').doc(cleanEmail).delete().catch(() => {});

    console.log(`[Signup OTP] Email verified successfully for: ${cleanEmail}`);
    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Error verifying signup OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
  }
});

// ---------------------------------------------------------------------------
// 3. FORGOT PASSWORD: REQUEST RESET OTP
// ---------------------------------------------------------------------------
app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user exists in Firebase Auth
    let userRecord = null;
    try {
      if (admin.apps.length > 0) {
        userRecord = await admin.auth().getUserByEmail(cleanEmail);
      }
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
    }

    // If Admin Auth check skipped, also check Firestore users collection
    if (!userRecord && db) {
      try {
        const userDoc = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (userDoc.empty) {
          return res.status(404).json({ error: 'No account found with this email address.' });
        }
      } catch (e) {
        console.warn("User lookup notice:", e.message);
      }
    }

    // 2. Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save in-memory for instant, reliable verification
    inMemoryPasswordResets.set(cleanEmail, { otp, expiresAt });

    // 3. Save to Firestore password_resets (if available)
    if (db) {
      try {
        await db.collection('password_resets').doc(cleanEmail).set({
          otp: otp,
          expiresAt: expiresAt,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        console.warn("Firestore password reset save notice:", e.message);
      }
    }

    // 4. Send Email
    const hasEmailConfig = !!((process.env.EMAIL_USER && process.env.EMAIL_PASS) || (process.env.SMTP_USER && process.env.SMTP_PASS));
    if (!hasEmailConfig) {
      return res.status(500).json({
        error: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASS in server/.env to send reset OTPs.'
      });
    }

    const transporter = getTransporter();
    const mailOptions = {
      from: getFromAddress(),
      to: cleanEmail,
      subject: `${otp} is your Examinantt Password Reset Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; }
            .logo-sub { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; margin-top: 4px; }
            .content { padding: 32px 28px; }
            .badge { display: inline-block; padding: 4px 12px; background: #fef2f2; color: #ef4444; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; }
            .desc { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
            .otp-box { background: #f8fafc; border: 2px dashed #f87171; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #b91c1c; margin: 0; }
            .expiry-note { font-size: 12px; color: #64748b; margin-top: 10px; }
            .security-warning { background: #fff1f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #9f1239; margin-top: 24px; line-height: 1.5; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">EXAMINANTT</h1>
              <div class="logo-sub">Account Recovery</div>
            </div>
            <div class="content">
              <span class="badge">Password Reset</span>
              <h2 class="title">Reset your password</h2>
              <p class="desc">
                We received a request to reset the password for your account. Please use the following 6-digit verification code to proceed:
              </p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry-note">⏱️ Valid for 10 minutes</div>
              </div>

              <div class="security-warning">
                <strong>Security Alert:</strong> If you did not request a password reset, please change your credentials immediately or contact support.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Examinantt. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMailWithFallback(mailOptions);
    console.log(`[Password Reset OTP] Sent successfully to ${cleanEmail}`);

    res.status(200).json({ message: `Password reset OTP sent to ${cleanEmail}.` });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: error.message || 'Failed to send password reset OTP.' });
  }
});

// ---------------------------------------------------------------------------
// 4. FORGOT PASSWORD: VERIFY RESET OTP
// ---------------------------------------------------------------------------
app.post('/api/verify-password-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    let record = inMemoryPasswordResets.get(cleanEmail);
    if (!record && db) {
      try {
        const resetDocRef = db.collection('password_resets').doc(cleanEmail);
        const docSnap = await resetDocRef.get();
        if (docSnap.exists) {
          record = docSnap.data();
        }
      } catch (err) {}
    }

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    if (String(record.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check your email and try again.' });
    }

    const expiresAt = record.expiresAt?.toDate ? record.expiresAt.toDate() : new Date(record.expiresAt);
    if (new Date() > expiresAt) {
      inMemoryPasswordResets.delete(cleanEmail);
      if (db) db.collection('password_resets').doc(cleanEmail).delete().catch(() => {});
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
  }
});

// ---------------------------------------------------------------------------
// 5. FORGOT PASSWORD: RESET PASSWORD WITH VERIFIED OTP
// ---------------------------------------------------------------------------
app.post('/api/verify-and-reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Verify OTP
    let record = inMemoryPasswordResets.get(cleanEmail);
    if (!record && db) {
      try {
        const resetDocRef = db.collection('password_resets').doc(cleanEmail);
        const docSnap = await resetDocRef.get();
        if (docSnap.exists) {
          record = docSnap.data();
        }
      } catch (err) {}
    }

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    if (String(record.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    const expiresAt = record.expiresAt?.toDate ? record.expiresAt.toDate() : new Date(record.expiresAt);
    if (new Date() > expiresAt) {
      inMemoryPasswordResets.delete(cleanEmail);
      if (db) db.collection('password_resets').doc(cleanEmail).delete().catch(() => {});
      return res.status(400).json({ error: 'OTP has expired.' });
    }

    // 2. Update user password in Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(cleanEmail);
      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword
      });
    } catch (authErr) {
      console.error("Firebase Admin updateUser error:", authErr);
      if (authErr.code === 'auth/configuration-not-found' || authErr.message?.includes('credential')) {
        return res.status(500).json({
          error: 'Firebase Admin credentials missing. Please place service-account.json in the server/ directory to enable password updates.'
        });
      }
      throw authErr;
    }

    // 3. Delete OTP doc to prevent reuse
    inMemoryPasswordResets.delete(cleanEmail);
    if (db) db.collection('password_resets').doc(cleanEmail).delete().catch(() => {});

    console.log(`[Password Reset] Password successfully updated for: ${cleanEmail}`);
    res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password.' });
  }
});

// ---------------------------------------------------------------------------
// 6. LIVE CLASSES REST API (FOR MOBILE APPS & WEB CLIENTS)
// ---------------------------------------------------------------------------
const DEFAULT_MOBILE_SAMPLE_CLASSES = [
  {
    id: 'default-live-1',
    title: 'Quantitative Aptitude: Speed Maths & Short Tricks Live Session',
    description: 'Join Sudhanshu Sir live for real-time problem solving, short tricks, and doubts discussion.',
    educatorName: 'Sudhanshu Sir',
    subject: 'Mathematics',
    examCategory: 'SSC',
    scheduledStartTime: new Date().toISOString(),
    durationMinutes: 60,
    streamProvider: 'jitsi',
    roomName: 'examinant_maths_live_speed_tricks',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    status: 'live',
    activeViewers: 248
  },
  {
    id: 'default-live-2',
    title: 'General Awareness: Current Affairs & Static GK Marathon',
    description: 'Comprehensive static GK revision with top 100 expected questions for upcoming exam tiers.',
    educatorName: 'Dr. Ananya Sharma',
    subject: 'General Awareness',
    examCategory: 'Railway',
    scheduledStartTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    durationMinutes: 90,
    streamProvider: 'jitsi',
    roomName: 'examinant_gk_marathon_session',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    status: 'upcoming',
    activeViewers: 0
  }
];

// Endpoint to get list of all live and upcoming classes for Mobile App
app.get('/api/live-classes', async (req, res) => {
  try {
    if (db) {
      const snap = await db.collection('live_classes').get();
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          return new Date(a.scheduledStartTime || 0).getTime() - new Date(b.scheduledStartTime || 0).getTime();
        });
        return res.status(200).json({ success: true, count: list.length, classes: list });
      }
    }
    return res.status(200).json({ success: true, count: DEFAULT_MOBILE_SAMPLE_CLASSES.length, classes: DEFAULT_MOBILE_SAMPLE_CLASSES });
  } catch (err) {
    console.error('Error fetching live classes API:', err);
    return res.status(500).json({ success: false, error: err.message, classes: DEFAULT_MOBILE_SAMPLE_CLASSES });
  }
});

// Endpoint to get details of a specific live class
app.get('/api/live-classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('default-live-')) {
      const found = DEFAULT_MOBILE_SAMPLE_CLASSES.find(c => c.id === id);
      if (found) return res.status(200).json({ success: true, class: found });
    }

    if (db) {
      const docSnap = await db.collection('live_classes').doc(id).get();
      if (docSnap.exists) {
        return res.status(200).json({ success: true, class: { id: docSnap.id, ...docSnap.data() } });
      }
    }
    return res.status(404).json({ success: false, message: 'Live class not found' });
  } catch (err) {
    console.error('Error fetching live class by ID API:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 7. JITSI / 8x8 JAAS ENTERPRISE VIRTUAL CLASSROOM TOKEN GENERATION
// ---------------------------------------------------------------------------
const getJaasPrivateKey = () => {
  if (process.env.JAAS_PRIVATE_KEY) {
    return process.env.JAAS_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  const keyPath = path.join(__dirname, 'jaas_private_key.pk');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8');
  }
  const pemPath = path.join(__dirname, 'jaas_private_key.pem');
  if (fs.existsSync(pemPath)) {
    return fs.readFileSync(pemPath, 'utf8');
  }
  return null;
};

const sanitizeRoomName = (roomName, classId) => {
  let base = (roomName || classId || 'virtual_classroom').toLowerCase().trim();
  if (base.includes('/')) {
    base = base.split('/').pop() || base;
  }
  base = base.replace(/^vpaas-magic-cookie-[a-f0-9]+_?/, '');
  const cleaned = base.replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 50);
  return cleaned.startsWith('examinant_') ? cleaned : `examinant_${cleaned}`;
};

app.post('/api/live-token', async (req, res) => {
  try {
    const { 
      roomId, 
      classId, 
      userId, 
      userName, 
      userEmail, 
      userAvatar, 
      isInstructor 
    } = req.body;

    const rawRoom = roomId || classId || 'virtual_classroom';
    const cleanRoom = sanitizeRoomName(rawRoom, classId);

    const jaasAppId = process.env.JAAS_APP_ID;
    const jaasApiKeyId = process.env.JAAS_API_KEY_ID;
    const jaasPrivateKey = getJaasPrivateKey();

    // If 8x8 JaaS RSA-256 keys are configured
    if (jaasAppId && jaasApiKeyId && jaasPrivateKey) {
      const now = Math.floor(Date.now() / 1000);
      const isTeacher = Boolean(isInstructor);
      
      let finalDisplayName = userName ? userName.trim() : (isTeacher ? 'Instructor' : 'Student');
      if (isTeacher) {
        if (!finalDisplayName.includes('(Host)')) {
          finalDisplayName = `${finalDisplayName} (Host)`;
        }
      }

      // Generate guaranteed unique participant session ID so duplicate tabs/users never collide in WebRTC bridge
      const sessionSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const uniqueParticipantId = userId ? `${userId}_${sessionSuffix}` : `user_${sessionSuffix}`;

      const payload = {
        aud: 'jitsi',
        iss: 'chat',
        iat: now,
        exp: now + 10800, // 3 hours validity
        nbf: now - 10,
        sub: jaasAppId,
        room: '*',
        context: {
          features: {
            livestreaming: isTeacher ? 'true' : 'false',
            recording: isTeacher ? 'true' : 'false',
            transcription: 'false',
            'outbound-call': 'false'
          },
          user: {
            id: uniqueParticipantId,
            name: finalDisplayName,
            email: userEmail ? String(userEmail) : '',
            avatar: userAvatar || '',
            moderator: isTeacher ? 'true' : 'false'
          }
        }
      };

      const token = jwt.sign(payload, jaasPrivateKey, {
        algorithm: 'RS256',
        header: {
          alg: 'RS256',
          typ: 'JWT',
          kid: jaasApiKeyId
        }
      });

      return res.status(200).json({
        success: true,
        token,
        mode: 'jaas',
        domain: '8x8.vc',
        appId: jaasAppId,
        roomName: `${jaasAppId}/${cleanRoom}`,
        isInstructor: isTeacher
      });
    }

    // High-reliability Fallback (meet.jit.si) when 8x8 JaaS key is not yet set
    return res.status(200).json({
      success: true,
      token: null,
      mode: 'jitsi_meet_direct',
      domain: 'meet.jit.si',
      roomName: cleanRoom,
      isInstructor: Boolean(isInstructor),
      notice: 'Using direct Jitsi Meet domain. Set JAAS_APP_ID, JAAS_API_KEY_ID and JAAS_PRIVATE_KEY in .env for custom 8x8 JaaS.'
    });
  } catch (error) {
    console.error('Error generating live classroom token:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate live classroom token.' 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
