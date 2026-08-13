import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

async function test() {
  try {
    console.log("Testing Firebase Auth...");
    try {
      await admin.auth().getUserByEmail('pritamkumars5398@gmail.com');
      console.log("User found.");
    } catch (e) {
      console.log("Firebase auth error:", e);
    }
    
    console.log("Testing Firestore...");
    try {
      await admin.firestore().collection('test').doc('test').set({ test: 'test' });
      console.log("Firestore write success.");
    } catch (e) {
      console.log("Firestore write error:", e);
    }

    console.log("Testing Nodemailer...");
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      await transporter.verify();
      console.log("Nodemailer verify success.");
    } catch (e) {
      console.log("Nodemailer verify error:", e);
    }

  } catch (err) {
    console.error("General error:", err);
  }
}

test();
