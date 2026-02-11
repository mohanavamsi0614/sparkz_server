import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (email, name) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Sparkz!',
      text: `Hello ${name},\n\nWelcome to Sparkz! You have successfully registered.\n\nBest regards,\nSparkz Team`,
      html: `<b>Hello ${name},</b><br><br>Welcome to Sparkz! You have successfully registered.<br><br>Best regards,<br>Sparkz Team`,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
