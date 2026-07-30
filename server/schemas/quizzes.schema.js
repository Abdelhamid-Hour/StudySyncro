const { z } = require("zod");
const {
  safeString,
  safeInt,
  safeSortQuery,
  safeDate,
  safeOptionalString,
} = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

// Matches exact attributes accessed in modifyQuizQuestions (examen.js:814 & 830)
const questionSchema = z.object({
  id: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Question ID"),
  text: safeString(
    LIMITS.QUESTION_TEXT_MIN_LENGTH,
    LIMITS.QUESTION_TEXT_MAX_LENGTH,
    "Question Text",
  ),
  choices: z
    .array(
      safeString(
        LIMITS.CHOICE_TEXT_MIN_LENGTH,
        LIMITS.CHOICE_TEXT_MAX_LENGTH,
        "Choice",
      ),
    )
    .min(
      LIMITS.MIN_CHOICES_COUNT,
      `At least ${LIMITS.MIN_CHOICES_COUNT} choices required`,
    )
    .max(
      LIMITS.MAX_CHOICES_COUNT,
      `Maximum ${LIMITS.MAX_CHOICES_COUNT} choices allowed`,
    ),
  correctAnswerIndex: safeInt(
    0,
    LIMITS.MAX_CHOICES_COUNT - 1,
    "Correct Answer Index",
  ),
});

// Matches exact attributes accessed in createQuiz (examen.js:343 & 357)
const createQuizSchema = z.object({
  quizData: z.object({
    "quiz-title": safeString(
      LIMITS.NAME_TITLE_MIN_LENGTH,
      LIMITS.NAME_TITLE_MAX_LENGTH,
      "Quiz Title",
    ),
    subject: safeString(
      LIMITS.SUBJECT_MIN_LENGTH,
      LIMITS.SUBJECT_MAX_LENGTH,
      "Subject",
    ),
  }),
});

// Matches checkQuizTitleHandler (controllers/quizzes.js:31)
const checkQuizTitleSchema = z.object({
  title: safeString(
    LIMITS.NAME_TITLE_MIN_LENGTH,
    LIMITS.NAME_TITLE_MAX_LENGTH,
    "Quiz Title",
  ),
});

// Matches routes with :quizId in URL params (/update-quiz/:quizId, /remove-quiz/:quizId, /quiz-play-details/:quizId)
const quizIdParamSchema = z.object({
  quizId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Quiz ID"),
});

// Matches updateQuizHandler (controllers/quizzes.js:48-50)
const updateQuizSchema = z
  .object({
    updatedQuestions: z.array(questionSchema).optional().default([]),
    newQuestions: z.array(questionSchema).optional().default([]),
    deletedQuestions: z
      .array(
        safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Question ID"),
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) =>
      data.updatedQuestions.length > 0 ||
      data.newQuestions.length > 0 ||
      data.deletedQuestions.length > 0,
    {
      message: "api:at_least_one_of_updatedquestions_newques",
    },
  );

// Matches patchQuizHandler (controllers/quizzes.js:71-72)
// Each attribute is optional independently, but at least one must be present.
const patchQuizSchema = z
  .object({
    title: safeOptionalString(
      LIMITS.NAME_TITLE_MIN_LENGTH,
      LIMITS.NAME_TITLE_MAX_LENGTH,
      "Quiz Title",
    ).default(""),
    subject: safeString(
      LIMITS.SUBJECT_MIN_LENGTH,
      LIMITS.SUBJECT_MAX_LENGTH,
      "Subject",
    ).default(""),
  })
  .refine((data) => data.title || data.subject, {
    message: "api:at_least_one_of_title_or_subject_must_be",
  });

// Matches duplicateQuizHandler (controllers/quizzes.js:178)
const duplicateQuizSchema = z.object({
  quizId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Quiz ID"),
  title: safeString(
    LIMITS.NAME_TITLE_MIN_LENGTH,
    LIMITS.NAME_TITLE_MAX_LENGTH,
    "New Quiz Title",
  ),
});

// Matches exact attributes accessed in addQuizResult (examen.js:938, 985-994, 1014) and client utils.js
const addQuizResultSchema = z.object({
  quizResult: z.object({
    quizId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Quiz ID"),
    groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
    quizTitle: safeOptionalString(
      LIMITS.NAME_TITLE_MIN_LENGTH,
      LIMITS.NAME_TITLE_MAX_LENGTH,
      "Quiz Title",
    ).default(""),
    correctAnswers: z
      .array(
        safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Question ID"),
      )
      .max(500, "Too many correct answers")
      .default([]),
    incorrectAnswers: z
      .array(
        z.object({
          id: safeString(
            LIMITS.ID_MIN_LENGTH,
            LIMITS.ID_MAX_LENGTH,
            "Question ID",
          ),
          answerIndex: safeInt(0, LIMITS.MAX_CHOICES_COUNT - 1, "Answer Index"),
        }),
      )
      .max(500, "Too many incorrect answers")
      .default([]),
    skippedQuestions: z
      .array(
        safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Question ID"),
      )
      .max(500, "Too many skipped questions")
      .optional()
      .default([]),
    submittedAt: safeDate("Submitted At"),
  }),
});

// Matches GET /quizzes query
const quizzesQuerySchema = z.object({
  searchTerm: safeString(0, LIMITS.SEARCH_MAX_LENGTH, "Search Term").optional(),
  sort: safeSortQuery().optional(),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  status: z
    .string()
    .trim()
    .max(100, "Status query is too long")
    .refine(
      (val) => {
        if (!val) return true;
        const items = val.split(",").map((item) => item.trim().toLowerCase());
        const allowedStatus = ["draft", "published"];
        return items.every((item) => allowedStatus.includes(item));
      },
      { message: "api:status_query_contains_invalid_status_ite" },
    )
    .optional(),
});

// Matches GET /group-quizzes query
const groupQuizzesQuerySchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  search: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  sort: safeSortQuery().optional(),
  date: safeDate("Date Filter").optional(),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

// Matches GET /passed-quizzes query
const passedQuizzesQuerySchema = z.object({
  searchTerm: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  date: safeDate("Date Filter").optional(),
  sort: safeSortQuery().optional(),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count").optional(),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

// Matches GET /quizzes-list-menu query
const quizzesListMenuQuerySchema = z.object({
  searchTerm: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count").optional(),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

// Matches GET /results-list query
const resultsListQuerySchema = z.object({
  quizId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Quiz ID"),
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
});

// Matches GET /examen-result query
const examenResultQuerySchema = z.object({
  userId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "User ID"),
  quizId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Quiz ID"),
  groupId: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Group ID",
  ).default(""),
});

module.exports = {
  createQuizSchema,
  checkQuizTitleSchema,
  quizIdParamSchema,
  updateQuizSchema,
  patchQuizSchema,
  duplicateQuizSchema,
  addQuizResultSchema,
  quizzesQuerySchema,
  groupQuizzesQuerySchema,
  passedQuizzesQuerySchema,
  quizzesListMenuQuerySchema,
  resultsListQuerySchema,
  examenResultQuerySchema,
};
