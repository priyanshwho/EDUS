const { pgTable, uuid, text, timestamp, integer, uniqueIndex, check } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  name: text('name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('student'),
  oauthProvider: text('oauth_provider'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  academicBranch: text('academic_branch'),
  enrollmentYear: integer('enrollment_year'),
});

const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  branch: text('branch').notNull(),
  semester: integer('semester').notNull(),
  nameFull: text('name_full').notNull(),
  acronym: text('acronym').notNull(),
  addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
  addedDate: timestamp('added_date', { withTimezone: true }).notNull().defaultNow(),
});

const resources = pgTable('resources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  year: integer('year'),
  pyqType: text('pyq_type'),
  externalLink: text('external_link'),
  awsS3Key: text('aws_s3_key'),
  youtubeUrl: text('youtube_url'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  slug: text('slug').notNull().unique(),
});

const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  postedBy: uuid('posted_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

const savedResources = pgTable('saved_resources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userResourceUnique: uniqueIndex('saved_resources_user_resource_uq').on(table.userId, table.resourceId),
}));

const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
});

const resourceEvents = pgTable('resource_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventType: text('event_type').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  resourceId: uuid('resource_id').references(() => resources.id, { onDelete: 'set null' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  eventTypeCheck: check('resource_events_type_check', sql`${table.eventType} in ('OPEN', 'DOWNLOAD_REQUEST', 'SAVE', 'UNSAVE')`),
}));

const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  chapterTitle: text('chapter_title').notNull(),
  difficulty: text('difficulty').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  scoreCheck: check('quiz_score_check', sql`${table.score} >= 0 and ${table.score} <= ${table.totalQuestions}`),
  totalQuestionsCheck: check('quiz_total_questions_check', sql`${table.totalQuestions} > 0`),
  difficultyCheck: check('quiz_difficulty_check', sql`${table.difficulty} in ('easy', 'medium', 'hard')`),
}));

const aiFeatureEvents = pgTable('ai_feature_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  featureType: text('feature_type').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  featureTypeCheck: check('ai_feature_type_check', sql`${table.featureType} in ('AI_TUTOR', 'MCQ_GENERATOR', 'FLASHCARDS', 'PYQ_PREDICTOR')`),
}));

const syllabi = pgTable('syllabi', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  subjectName: text('subject_name').notNull(),
  subjectCode: text('subject_code'),
  branch: text('branch').notNull(),
  semester: integer('semester').notNull(),
  content: text('content').notNull(),
  sectionA: text('section_a'),
  sectionB: text('section_b'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  subjectBranchSemUnique: uniqueIndex('syllabi_subject_branch_sem_uq').on(table.subjectName, table.branch, table.semester),
}));

module.exports = {
  users,
  subjects,
  resources,
  announcements,
  savedResources,
  userSessions,
  resourceEvents,
  quizAttempts,
  aiFeatureEvents,
  syllabi,
};
