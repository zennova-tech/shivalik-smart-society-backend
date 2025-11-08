// src/utils/invite.js
const crypto = require("crypto");
const config = require("../config/env");
const { sendMail } = require("../libs/mail"); // your EJS-enabled mail lib
const logger = require("./logger");

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function sendManagerInvite({ toEmail, firstName, societyName, token }) {
  const acceptUrl = `${config.appUrl || "http://localhost:4001"}/accept-invite?token=${token}`;
  try {
    await sendMail({
      to: toEmail,
      subject: `Invite to manage ${societyName}`,
      template: "invite-manager",
      data: { firstName, societyName, acceptUrl },
    });
    logger.info(`Invite email queued/sent to ${toEmail}`);
    return true;
  } catch (err) {
    logger.error("Failed to send invite email", err);
    return false;
  }
}

module.exports = { generateInviteToken, sendManagerInvite };
