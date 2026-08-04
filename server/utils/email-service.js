const nodemailer = require("nodemailer");
const templates = require("./email-templates");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMailHelper = async (to, bcc, subject, htmlContent) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS is not set in .env. Skipping email.");
    return;
  }

  const mailOptions = {
    from: '"StudyHype (No Reply)" <' + process.env.EMAIL_USER + '>',
    subject: subject,
    html: htmlContent,
  };

  if (to) mailOptions.to = to;
  if (bcc && bcc.length > 0) mailOptions.bcc = bcc;

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
  }
};

const sendSessionStartedEmail = async (userEmails, sessionData, groupId, sessionId) => {
  if (!userEmails || userEmails.length === 0) return;
  const subject = `🔴 Live Session Started: ${sessionData.sessionName}`;
  const html = templates.sessionStartedTemplate(sessionData, groupId, sessionId);
  await sendMailHelper(null, userEmails, subject, html);
};

const sendJoinResultEmail = async (userEmail, groupName, isAccepted, groupId) => {
  if (!userEmail) return;
  const subject = isAccepted 
    ? `✅ Accepted into ${groupName}` 
    : `❌ Join Request Update for ${groupName}`;
  const html = templates.joinResultTemplate(groupName, isAccepted, groupId);
  await sendMailHelper(userEmail, null, subject, html);
};

const sendGroupInviteEmail = async (userEmail, groupName, senderName, groupId) => {
  if (!userEmail) return;
  const subject = `📩 You have been invited to ${groupName}`;
  const html = templates.groupInviteTemplate(groupName, senderName, groupId);
  await sendMailHelper(userEmail, null, subject, html);
};

const sendAdminJoinRequestEmail = async (adminEmail, applicantName, groupName, groupId) => {
  if (!adminEmail) return;
  const subject = `🔔 New Join Request for ${groupName}`;
  const html = templates.adminJoinRequestTemplate(applicantName, groupName, groupId);
  await sendMailHelper(adminEmail, null, subject, html);
};

const sendEmailVerificationMail = async (userEmail, actionLink) => {
  if (!userEmail) return;
  const subject = `Verify Your Email for StudyHype`;
  const html = templates.emailVerificationTemplate(actionLink);
  await sendMailHelper(userEmail, null, subject, html);
};

const sendPasswordResetMail = async (userEmail, actionLink) => {
  if (!userEmail) return;
  const subject = `Reset Your StudyHype Password`;
  const html = templates.passwordResetTemplate(actionLink);
  await sendMailHelper(userEmail, null, subject, html);
};

module.exports = {
  sendSessionStartedEmail,
  sendJoinResultEmail,
  sendGroupInviteEmail,
  sendAdminJoinRequestEmail,
  sendEmailVerificationMail,
  sendPasswordResetMail,
};
