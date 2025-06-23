const nodemailer = require('nodemailer');

// Step 1: Create the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'daniellofficial@gmail.com', // ✅ Your Gmail
    pass: '***'           // ✅ App password (no spaces)
  }
});

// Step 2: Define email options
const mailOptions = {
  from: 'daniellofficial@gmail.com',
  to: 'yourrecipient@example.com',    // 🔁 Change to your recipient
  subject: '✅ Test Email from Node.js',
  text: 'This is a test email sent using Nodemailer + Gmail App Password.'
};

// Step 3: Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('❌ Error:', error);
  }
  console.log('✅ Email sent:', info.response);
});
