import express from 'express';
// Trigger restart
import cors from 'cors';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Initialize Firebase Admin
// This uses the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// Make sure to set it in your .env file: GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to 'SendGrid' or your preferred provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper to generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Check if user exists in Firebase Auth
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Return 200 even if not found to prevent email enumeration, 
        // but for this app it might be better to show an error.
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
      throw error;
    }

    // 2. Generate OTP and expiry (10 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Save to Firestore
    await db.collection('password_resets').doc(email).set({
      otp: otp,
      expiresAt: expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Password Reset OTP - Examinantt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Examinantt Account Recovery</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Here is your One-Time Password (OTP):</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br/>The Examinantt Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully to ' + email });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Internal server error while processing request.' });
  }
});

app.post('/api/verify-password-reset-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    const resetDocRef = db.collection('password_resets').doc(email);
    const docSnap = await resetDocRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const data = docSnap.data();

    if (data.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    const now = new Date();
    if (now > data.expiresAt.toDate()) {
      await resetDocRef.delete();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    res.status(500).json({ error: 'Internal server error while verifying OTP.' });
  }
});

app.post('/api/verify-and-reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    // 1. Verify OTP in Firestore
    const resetDocRef = db.collection('password_resets').doc(email);
    const docSnap = await resetDocRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const data = docSnap.data();

    if (data.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    const now = new Date();
    if (now > data.expiresAt.toDate()) {
      await resetDocRef.delete();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // 2. Update user password in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    // 3. Delete OTP doc to prevent reuse
    await resetDocRef.delete();

    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    console.error('Error verifying OTP and resetting password:', error);
    res.status(500).json({ error: 'Internal server error while resetting password.' });
  }
});

app.post('/api/request-signup-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Check if user already exists
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({ error: 'This email is already registered.' });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // 2. Generate OTP and expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Save to Firestore
    await db.collection('signup_otps').doc(email).set({
      otp: otp,
      expiresAt: expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email - Examinantt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Examinantt!</h2>
          <p>Hello,</p>
          <p>Please use the following One-Time Password (OTP) to verify your email address and complete your registration:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br/>The Examinantt Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully to ' + email });
  } catch (error) {
    console.error('Error sending signup OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

app.post('/api/verify-signup-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    const docRef = db.collection('signup_otps').doc(email);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const data = docSnap.data();
    if (data.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    if (new Date() > data.expiresAt.toDate()) {
      await docRef.delete();
      return res.status(400).json({ error: 'OTP has expired.' });
    }

    // OTP verified, delete the doc
    await docRef.delete();
    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Error verifying signup OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
