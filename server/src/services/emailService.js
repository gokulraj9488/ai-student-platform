const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  const { data, error } = await resend.emails.send({
    from: 'Kuriosity <onboarding@resend.dev>',
    to: email,
    subject: 'Your Kuriosity OTP Code',
    html: `
      <h2>Your OTP Code</h2>
      <h1>${otp}</h1>
      <p>Expires in 10 minutes.</p>
    `,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  console.log('Email sent:', data);
}

module.exports = { generateOTP, sendOTP };