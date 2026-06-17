const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('Sending OTP to:', email);
  const mailOptions = {
    from: `"Kuriosity" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Kuriosity OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #0f172a; color: white; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #60a5fa; margin: 0;">Kuriosity</h1>
          <p style="color: #94a3b8; margin: 8px 0 0;">Your AI Student Platform</p>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 16px;">Your verification code is:</p>
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #60a5fa; margin: 0 0 16px;">${otp}</div>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Expires in 10 minutes</p>
        </div>
        <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTP };