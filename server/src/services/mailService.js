const nodemailer = require('nodemailer');

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(to, otp) {
  const appName = process.env.APP_NAME || 'Kuriosity';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!hasSmtpConfig()) {
    console.warn('[MAIL] SMTP is not configured. OTP was not sent by email.');
    console.log(`[DEV OTP] ${to}: ${otp}`);
    return { delivery: 'console' };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: `${appName} email verification code`,
    text: `Your ${appName} verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>${appName} email verification</h2>
        <p>Use this code to finish creating your account:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });

  return { delivery: 'email' };
}

module.exports = { sendVerificationEmail };
