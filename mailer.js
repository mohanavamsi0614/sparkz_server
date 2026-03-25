import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import axios from 'axios';

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
    axios.post("https://7feej0sxm3.execute-api.eu-north-1.amazonaws.com/default/mail_sender",{
      to:email,
      subject:"Welcome to Sparkz!",
      config:{email:process.env.EMAIL_USER,pass:process.env.EMAIL_PASS,from:`'sparkz events' <${process.env.EMAIL_USER}>`},
      html:`<b>Hello ${name},</b><br><br>Welcome to Sparkz! You have successfully registered.<br><br>Best regards,<br>Sparkz Team`
    })
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
