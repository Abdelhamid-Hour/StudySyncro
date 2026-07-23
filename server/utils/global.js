const MAX_FILE_SIZE_50MB = 50 * 1024 * 1024; // 50MB
const INITIALE_LOADERS_COUNT = 20;
class Task {
  constructor({
    title,
    description,
    durationInMins,
    isQuiz,
    isBreak,
    status,
    UID,
  }) {
    this.title = title;
    this.status = status || "pending";
    this.durationInMins = durationInMins;
    this.isQuiz = isQuiz || false;
    this.isBreak = isBreak || false;
    this.UID = UID || null; // Unique identifier for the task
    if (!isBreak) this.description = description;
  }
}

class Quiz extends Task {
  constructor({ UID, title, description, durationInMins, questionsCount }) {
    super({ title, description, durationInMins, isQuiz: true });
    this.questionsCount = questionsCount;
    this.UID = UID;
  }
}

const pathNames = {
  home: {
    inactive: "/home/inactive",
    active: "/home/active",
  },
  groups: {
    my: "/groups/my",
    available: "/groups/available",
  },
  quizzes: {
    my: "/quizzes/my",
    passed: "/quizzes/passed",
  },
  settings: "/settings",
};

const formatHoursMinutes = (TimeOrDate) => {
  const date = new Date(TimeOrDate);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const toReadableDate = (TimeOrDate, type) => {
  const date = new Date(TimeOrDate);

  if (type === "short") {
    return date.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const millisecondsToHMFormat = (ms) => {
  if (typeof ms !== "number" || ms < 0) return "0m";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (hours && minutes)
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;
  return "0m";
};

const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return "0";
  const absNum = Math.abs(number);
  if (absNum >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (absNum >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (absNum >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return number.toString();
};

const getScoreClass = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  return "poor";
};

const formatTimeAgo = (timestamp, t = null) => {
  if (!timestamp) return "";
  const diff = Date.now() - Number(timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t ? t("home:inactive.time.just_now") : "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t ? t("home:inactive.time.ago_minutes", { count: minutes }) : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t ? t("home:inactive.time.ago_hours", { count: hours }) : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return t ? t("home:inactive.time.ago_days", { count: days }) : `${days}d ago`;
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString();
};

module.exports = {
  formatHoursMinutes,
  formatTimeAgo,
  toReadableDate,
  millisecondsToHMFormat,
  INITIALE_LOADERS_COUNT,
  MAX_FILE_SIZE_50MB,
  getScoreClass,
  formatNumber,
  pathNames,
  Task,
  Quiz,
};
