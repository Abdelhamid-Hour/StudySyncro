const APP_URL = process.env.RENDER_EXTERNAL_URL || "http://localhost:5000";

const getFooter = () => `
  <br/>
  <hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
  <p style="font-size: 12px; color: #888; text-align: center;">
    This is an automated message from StudyHype.<br/>
    Please do not reply to this email, as this inbox is unmonitored.
  </p>
`;

const getButton = (text, url) => `
  <div style="margin-top: 25px; margin-bottom: 25px;">
    <a href="${url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      ${text}
    </a>
  </div>
`;

const sessionStartedTemplate = (sessionData, groupId, sessionId) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
    <h2 style="color: #e53e3e;">A Live Session is Happening Now!</h2>
    <p>Hello,</p>
    <p>A new live session <strong>"${sessionData.sessionName}"</strong> has just been started by the admin in the group <strong>${sessionData.groupName}</strong>.</p>
    <p>Log in to your account now to join the session before it ends!</p>
    ${getButton("Join Live Session", `${APP_URL}/app/groups/my/${groupId}/chat?sessionId=${sessionId}&sessionName=${encodeURIComponent(sessionData.sessionName)}&groupName=${encodeURIComponent(sessionData.groupName)}`)}
    ${getFooter()}
  </div>
`;

const joinResultTemplate = (groupName, isAccepted, groupId) => {
  const statusHtml = isAccepted 
    ? `<span style="color: green; font-weight: bold;">Accepted</span>. You can now access the group.` 
    : `<span style="color: red; font-weight: bold;">Declined</span>.`;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
      <h2>Group Join Request Update</h2>
      <p>Hello,</p>
      <p>Your request to join the group <strong>"${groupName}"</strong> has been reviewed by the admin.</p>
      <p>Status: ${statusHtml}</p>
      ${isAccepted ? getButton("Go to Group", `${APP_URL}/app/groups/my/${groupId}/chat`) : ""}
      ${getFooter()}
    </div>
  `;
};

const groupInviteTemplate = (groupName, senderName, groupId) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
    <h2 style="color: #3182ce;">New Group Invitation</h2>
    <p>Hello,</p>
    <p><strong>${senderName}</strong> has invited you to join the group <strong>"${groupName}"</strong>.</p>
    <p>Log in to your dashboard to accept or decline this invitation.</p>
    ${getButton("Review Invitation", `${APP_URL}/app/home?inviteId=${groupId}&groupName=${encodeURIComponent(groupName)}`)}
    ${getFooter()}
  </div>
`;

const adminJoinRequestTemplate = (applicantName, groupName, groupId) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
    <h2>New Join Request</h2>
    <p>Hello Admin,</p>
    <p><strong>${applicantName}</strong> has requested to join your group <strong>"${groupName}"</strong>.</p>
    <p>Please review their request in your group's sidebar.</p>
    ${getButton("Go to Group", `${APP_URL}/app/groups/my/${groupId}/chat`)}
    ${getFooter()}
  </div>
`;

module.exports = {
  sessionStartedTemplate,
  joinResultTemplate,
  groupInviteTemplate,
  adminJoinRequestTemplate,
};
