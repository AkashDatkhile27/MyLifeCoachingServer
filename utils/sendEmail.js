const Nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = Nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Corrected in .env to 'smtp.gmail.com'
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;