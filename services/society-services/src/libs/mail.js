const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const logger = require("../utils/logger");
const { mailUser, mailPass } = require("../config/env");

const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP host (e.g., SES, SendGrid)
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

async function renderTemplate(templateName, data) {
  const filePath = path.join(
    __dirname,
    "..",
    "templates",
    "emails",
    `${templateName}.ejs`
  );
  return new Promise((resolve, reject) => {
    ejs.renderFile(filePath, data, {}, (err, html) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

async function sendMail({ to, subject, template, data }) {
  try {
    const html = await renderTemplate(template, data);
    const mailOptions = {
      from: `"Society Admin" <${mailUser}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error("Error sending email:", err);
    throw err;
  }
}

module.exports = { sendMail };
