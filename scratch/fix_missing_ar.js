
const fs = require("fs");
const path = require("path");

const filesToUpdate = [
  "d:\\PFE\\client\\public\\locales\\ar\\login.json",
  "d:\\PFE\\server\\locales\\ar\\login.json"
];

const missingTranslations = {
  "verification_expired": "انتهت صلاحية رابط التحقق الخاص بك. يرجى تسجيل الدخول لطلب رابط جديد.",
  "verification_invalid": "رابط التحقق غير صالح. يرجى التحقق من الرابط والمحاولة مرة أخرى.",
  "verification_used": "تم التحقق من هذا البريد الإلكتروني بالفعل أو تم استخدام الرابط مسبقاً.",
  "verification_failed": "حدث خطأ أثناء التحقق من بريدك الإلكتروني. يرجى المحاولة مرة أخرى."
};

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!content.messages) content.messages = {};
    
    Object.assign(content.messages, missingTranslations);
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
    console.log("Updated " + filePath);
  }
});

