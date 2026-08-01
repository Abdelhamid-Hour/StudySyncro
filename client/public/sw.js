const locales = {
  en: {
    title_session_started: "Study Session Started",
    body_session_started: "A study session '{sessionName}' has started in {groupName}. Join now!",
    title_session_ended: "Study Session Ended",
    body_session_ended: "The study session '{sessionName}' in {groupName} has ended.",
    title_group_deleted: "Group Deleted",
    body_group_deleted: "The study group {groupName} has been deleted by the host.",
    title_join_request_accepted: "Request Accepted",
    body_join_request_accepted: "Join request from {senderName} for group {groupName} was accepted.",
    title_join_request_rejected: "Request Rejected",
    body_join_request_rejected: "Join request from {senderName} for group {groupName} was rejected.",
    title_join_invite: "Group Invitation",
    body_join_invite: "{senderName} invited you to join {groupName}.",
    title_join_pending: "Request Sent",
    body_join_pending: "Your request to join {groupName} is pending admin approval.",
    title_join_accepted: "Request Accepted",
    body_join_accepted: "Your request to join {groupName} has been accepted. Welcome!",
    title_join_rejected: "Request Declined",
    body_join_rejected: "Your request to join {groupName} was declined by the admin.",
    title_role_transferred: "Host Role Transferred",
    body_role_transferred: "You are now the Host of {groupName}.",
    title_role_demoted: "Role Updated",
    body_role_demoted: "Host role for {groupName} has been transferred to {newAdminName}.",
    title_member_removed: "Removed from Group",
    body_member_removed: "You have been removed from {groupName}.",
    title_join_invite_accepted: "Invitation Accepted",
    body_join_invite_accepted: "Invitation to join group {groupName} was accepted.",
    title_join_invite_rejected: "Invitation Rejected",
    body_join_invite_rejected: "Invitation to join group {groupName} was rejected.",
    title_join_request: "New Join Request",
    body_join_request: "{senderName} requested to join {groupName}.",
    default_title: "StudyHype",
    default_body: "You have a new notification"
  },
  ar: {
    title_session_started: "بدأت جلسة دراسية",
    body_session_started: "بدأت جلسة دراسية '{sessionName}' في مجموعة {groupName}. انضم الآن!",
    title_session_ended: "انتهت الجلسة الدراسية",
    body_session_ended: "انتهت الجلسة الدراسية '{sessionName}' في مجموعة {groupName}.",
    title_group_deleted: "تم حذف المجموعة",
    body_group_deleted: "تم حذف المجموعة الدراسية {groupName} من قبل المضيف.",
    title_join_request_accepted: "تم قبول الطلب",
    body_join_request_accepted: "تم قبول طلب انضمام {senderName} إلى مجموعة {groupName}.",
    title_join_request_rejected: "تم رفض الطلب",
    body_join_request_rejected: "تم رفض طلب انضمام {senderName} إلى مجموعة {groupName}.",
    title_join_invite: "دعوة للانضمام",
    body_join_invite: "دعاك {senderName} للانضمام إلى مجموعة {groupName}.",
    title_join_pending: "تم إرسال الطلب",
    body_join_pending: "طلب انضمامك إلى مجموعة {groupName} قيد انتظار موافقة المشرف.",
    title_join_accepted: "تم قبول الطلب",
    body_join_accepted: "تم قبول طلب انضمامك إلى مجموعة {groupName}. مرحباً بك!",
    title_join_rejected: "تم رفض طلبك",
    body_join_rejected: "تم رفض طلب انضمامك إلى مجموعة {groupName} من قبل المشرف.",
    title_role_transferred: "نقل صلاحيات المضيف",
    body_role_transferred: "أصبحت الآن المضيف (Host) لمجموعة {groupName}.",
    title_role_demoted: "تحديث الصلاحيات",
    body_role_demoted: "تم نقل صلاحيات المضيف في مجموعة {groupName} إلى {newAdminName}.",
    title_member_removed: "تمت إزالتك من المجموعة",
    body_member_removed: "تمت إزالتك من مجموعة {groupName}.",
    title_join_invite_accepted: "تم قبول الدعوة",
    body_join_invite_accepted: "تم قبول الدعوة للانضمام إلى مجموعة {groupName}.",
    title_join_invite_rejected: "تم رفض الدعوة",
    body_join_invite_rejected: "تم رفض الدعوة للانضمام إلى مجموعة {groupName}.",
    title_join_request: "طلب انضمام جديد",
    body_join_request: "طلب {senderName} الانضمام إلى مجموعة {groupName}.",
    default_title: "StudyHype",
    default_body: "لديك إشعار جديد"
  }
};

function t(key, lang, metadata) {
  const language = locales[lang] ? lang : "en";
  let text = locales[language][key];
  if (!text) {
    text = locales.en[key] || "";
  }
  
  if (metadata) {
    for (const k in metadata) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), metadata[k] || '');
    }
  }
  return text;
}

self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      
      let lang = payload.lang;
      if (!lang && self.navigator && self.navigator.language) {
        lang = self.navigator.language.split('-')[0];
      }
      if (lang !== 'en' && lang !== 'ar') {
        lang = 'en'; // default
      }
      
      const type = payload.type || "default";
      const metadata = payload.metadata || {};
      
      let title = t(`title_${type}`, lang, metadata);
      let body = t(`body_${type}`, lang, metadata);

      if (!title) title = locales[lang].default_title;
      if (!body) body = locales[lang].default_body;

      const options = {
        body: body,
        icon: "/app/assets/images/logo.png",
        badge: "/app/assets/images/logo.png",
        data: payload,
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Error parsing push data:", e);
      event.waitUntil(
        self.registration.showNotification("StudyHype", {
          body: event.data.text(),
        })
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
  let targetUrl = "/app";
  const data = event.notification.data;
  
  if (data && data.metadata && data.metadata.groupId) {
     targetUrl = "/app/groups/" + data.metadata.groupId;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes("/app") && "focus" in client) {
          return client.focus().then(c => c.navigate(targetUrl));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
