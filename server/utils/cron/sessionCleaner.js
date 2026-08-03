const cron = require('node-cron');
const { db } = require('../../firebase/firebaseAdmin');
const { cancelSession } = require('../firebase-utils/session');

const startSessionCleaner = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = Date.now();
      const sessionsRef = db.collection('sessions');
      // Look for active sessions that have passed their endTime
      const snapshot = await sessionsRef
        .where('status', '==', 'active')
        .where('endTime', '<=', now)
        .get();
      
      if (snapshot.empty) return;

      snapshot.forEach(async (doc) => {
        console.log(`[Cron] Session ${doc.id} expired. Auto-ending...`);
        // force=true to bypass admin validation
        await cancelSession(doc.id, null, true);
      });
    } catch (error) {
      console.error('[Cron] Error running session cleaner:', error);
    }
  });
  console.log('Session cleaner cron job started (runs every 5 minutes)');
};

module.exports = startSessionCleaner;
