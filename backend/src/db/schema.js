const { pgTable, uuid, text, timestamp, integer, uniqueIndex } = require('drizzle-orm/pg-core');
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

module.exports = {
  users,
  subjects,
  resources,
  announcements,
  savedResources,
};
