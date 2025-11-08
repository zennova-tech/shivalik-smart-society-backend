const { sendMail } = require("../libs/mail");

async function sendWelcomeEmail({ name, email, societyName }) {
  return sendMail({
    to: email,
    subject: `Welcome to ${societyName}!`,
    template: "welcome-email",
    data: { name, societyName },
  });
}

module.exports = { sendWelcomeEmail };
