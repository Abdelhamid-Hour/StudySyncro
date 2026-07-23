import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineString } from "firebase-functions/params";
import admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

// Define the SendGrid API key as a string parameter
const SENDGRID_API_KEY_PARAM = defineString("SENDGRID_API_KEY");

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

admin.initializeApp();

// Access the parameter's value. This value will be eavailable at runtime.
sgMail.setApiKey(SENDGRID_API_KEY_PARAM.value());

export const notifyAdminOnJoin = onDocumentUpdated(
  "groups/{groupId}",
  async (event) => {
    try {
      const beforeUids = event.data?.before?.data()?.membersUids || [];
      const afterUids = event.data?.after?.data()?.membersUids || [];
      const newMemberUids = afterUids.filter(
        (uid) => !beforeUids.includes(uid),
      ); // Add logging to ensure these values are correct
      console.log("Function triggered for groupId:", event.params.groupId);
      console.log("Before UIDs:", beforeUids);
      console.log("After UIDs:", afterUids);
      console.log("New Member UIDs:", newMemberUids);
      if (newMemberUids.length === 0) {
        console.log("No new members detected, returning.");
        return;
      }
      const groupData = event.data.after.data();
      const adminId = groupData.createur;
      const groupName = groupData.nom_groupe || "Your Group";
      console.log("Group Data:", groupData);
      console.log("Admin ID (createur):", adminId);
      console.log("Group Name:", groupName);

      if (!adminId) {
        console.log("Admin ID (createur) is missing, returning.");
        return;
      }
      const adminDoc = await admin
        .firestore()
        .collection("users")
        .doc(adminId)
        .get();
      if (!adminDoc.exists) {
        console.log(
          `Admin document for ID ${adminId} does not exist, returning.`,
        );
        return;
      }
      const adminData = adminDoc.data();
      const adminEmail = adminData?.email;
      const adminName =
        adminData?.displayName || adminData?.fullName || "Admin";
      console.log("Admin Data:", adminData);
      console.log("Admin Email:", adminEmail);
      console.log("Admin Name:", adminName);

      if (!adminEmail) {
        console.log(
          `Admin email not found for admin ID ${adminId}, returning.`,
        );
        return;
      } // Get new member details
      let newMemberName = "New Member";
      try {
        const memberDoc = await admin
          .firestore()
          .collection("users")
          .doc(newMemberUids[0])
          .get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          newMemberName =
            memberData?.displayName ||
            memberData?.fullName ||
            memberData?.email ||
            "New Member";
        }
      } catch (error) {
        console.log("Could not fetch member details:", error);
      }
      console.log("New Member Name:", newMemberName); // Professional HTML email template
      const htmlContent = `
 <!DOCTYPE html>
 <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Member Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                     <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                    🎉 New Member Alert!
                </h1>
            </div>
            
                        <div style="padding: 40px 30px;">
                <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${adminName}</strong>,
                </p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Great news! A new member has joined your group <strong style="color: #667eea;">"${groupName}"</strong>.
                </p>
                
                                <div style="background-color: #f8f9ff; border: 2px solid #e1e7ff; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 24px; font-weight: bold;">
                            ${newMemberName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <h3 style="margin: 0 0 5px 0; color: #333333; font-size: 18px;">
                        ${newMemberName}
                    </h3>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                        New Group Member
                    </p>
                </div>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 25px 0;">
                    You can manage your group members and settings in your dashboard.
                </p>
                
                                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://your-app-url.com/groups/${
        event.params.groupId
      }" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        View Group Dashboard
                    </a>
                </div>
            </div>
            
                        <div style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                    This email was sent automatically when someone joined your group.
                </p>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
                    StudyHype Team © ${new Date().getFullYear()}
                </p>
            </div>
        </div>
        
                <div style="text-align: center; padding: 20px;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
                If you don't want to receive these notifications, you can 
                <a href="https://your-app-url.com/unsubscribe" style="color: #667eea;">unsubscribe here</a>
            </p>
        </div>
    </body>
    </html>`; // Plain text version (important for spam prevention)

      const textContent = `
Hello ${adminName},

Great news! A new member has joined your group "${groupName}".

New Member: ${newMemberName}

You can manage your group members and settings in your dashboard at:
https://your-app-url.com/groups/${event.params.groupId}

This email was sent automatically when someone joined your group.

StudyHype Team
---
If you don't want to receive these notifications, you can unsubscribe at:
https://your-app-url.com/unsubscribe
    `;

      // --- ADD THESE LOGGING STATEMENTS ---
      console.log("--- HTML Content to be sent ---");
      console.log(htmlContent);
      console.log("--- Plain Text Content to be sent ---");
      console.log(textContent);
      console.log("------------------------------------");
      // --- END ADDITION ---

      console.log(
        `Attempting to send email to ${adminEmail} for group ${groupName}...`,
      );
      await sgMail.send({
        to: adminEmail,
        from: {
          email: "zaquarea@gmail.com", // Use your verified domain
          name: "StudyHype Notifications",
        },
        subject: `🎉 New member joined "${groupName}"`,
        text: textContent,
        html: htmlContent,
        headers: {
          "List-Unsubscribe": "<https://your-app-url.com/unsubscribe>",
          "X-Entity-Ref-ID": `group-${event.params.groupId}`,
        },
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false },
        },
      });
      console.log(
        `Professional notification sent to ${adminEmail} for group ${groupName}`,
      );
    } catch (error) {
      console.error("Error in notifyAdminOnJoin:", error);
      throw error;
    }
  },
);

/**
 * Scheduled function running every 5 minutes to auto-end expired active sessions
 * if no user manually ended them. Handles Firestore batch chunking (max 500 ops/batch).
 */
export const autoEndExpiredSessions = onSchedule(
  "every 5 minutes",
  async (event) => {
    try {
      const now = Date.now();
      const activeSessionsSnap = await admin
        .firestore()
        .collection("sessions")
        .where("status", "==", "active")
        .get();

      if (activeSessionsSnap.empty) {
        console.log("Auto-end sessions check: No active sessions found.");
        return;
      }

      const db = admin.firestore();
      const batchCommits = [];
      let currentBatch = db.batch();
      let operationCount = 0;
      let updatedCount = 0;

      for (const doc of activeSessionsSnap.docs) {
        const session = doc.data();

        if (!session.startDate || !session.duration) continue;

        const startTime = new Date(session.startDate).getTime();
        const durationMs = Number(session.duration) * 60 * 1000;
        const endTime = startTime + durationMs;

        if (now >= endTime) {
          // Commit current batch and create a new one if operation count limit (450 ops) is reached
          if (operationCount + 2 >= 450) {
            batchCommits.push(currentBatch.commit());
            currentBatch = db.batch();
            operationCount = 0;
          }

          console.log(
            `Auto-ending expired session ID: ${doc.id} (${session.name || "Unnamed"})`,
          );

          // 1. Update session status to "finished"
          currentBatch.update(doc.ref, {
            status: "finished",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          operationCount++;

          // 2. Clear currentSession on parent group doc if set
          if (session.groupId) {
            const groupRef = db.collection("groups").doc(session.groupId);
            currentBatch.update(groupRef, {
              currentSession: "",
            });
            operationCount++;
          }

          updatedCount++;
        }
      }

      if (operationCount > 0) {
        batchCommits.push(currentBatch.commit());
      }

      if (batchCommits.length > 0) {
        await Promise.all(batchCommits);
        console.log(
          `Successfully auto-ended ${updatedCount} expired session(s) across ${batchCommits.length} batch(es).`,
        );
      } else {
        console.log(
          "Auto-end sessions check: All active sessions are still within their duration.",
        );
      }
    } catch (error) {
      console.error("Error in autoEndExpiredSessions function:", error);
    }
  },
);
