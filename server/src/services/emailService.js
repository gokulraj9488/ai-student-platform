const { Resend } = require('resend');

console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is missing');
}

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  try {
    console.log('Sending OTP to:', email);

    const { data, error } = await resend.emails.send({
      from: 'Kuriosity <noreply@gokul.quest>',
      to: email,
      subject: 'Your Kuriosity OTP Code',
      html: `
        <h2>Kuriosity Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Expires in 10 minutes.</p>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully');
    console.log(data);

    return data;
  } catch (err) {
    console.error('OTP send error:', err);
    throw err;
  }
}

module.exports = {
  generateOTP,
  sendOTP,
};