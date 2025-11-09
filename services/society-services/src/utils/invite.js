// src/utils/invite.js
const { sendMail } = require("../libs/mail");
const logger = require("../utils/logger");

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function sendManagerInvite({
  toEmail,
  firstName,
  societyName,
  tempPassword,
  changePasswordUrl,
}) {
  // Use the EJS template "invite-manager-password.ejs" (see below)
  try {
    await sendMail({
      to: toEmail,
      subject: `Account created for ${societyName}`,
      template: "invite-manager-password", // new template name
      data: { firstName, societyName, tempPassword, changePasswordUrl, toEmail },
    });
    logger.info(`Invite (with password) email sent to ${toEmail}`);
    return true;
  } catch (err) {
    logger.error("Failed to send invite email", err);
    return false;
  }
}

module.exports = { generateInviteToken, sendManagerInvite };
