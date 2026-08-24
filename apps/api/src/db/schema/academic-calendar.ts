import {
	date,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { academicPeriodTypeEnum } from "./enums";
import { users } from "./shared";

// ==========================================
// KALENDER AKADEMIK
// ==========================================

export const academicCalendars = pgTable("academic_calendars", {
	id: serial("id").primaryKey(),
	academicYear: text("academic_year").notNull(), // e.g. "2024/2025"
	cohort: integer("cohort").notNull(), // e.g. 13
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: text("status").default("active").notNull(), // "active" | "draft" | "archived"
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicPeriods = pgTable("academic_periods", {
	id: serial("id").primaryKey(),
	calendarId: integer("calendar_id")
		.notNull()
		.references(() => academicCalendars.id, { onDelete: "cascade" }),
	title: text("title").notNull(), // e.g. "Pertemuan 1", "UTS", dsb
	description: text("description"), // Custom Deskripsi (sesuai UI)
	periodType: academicPeriodTypeEnum("period_type").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	orderIndex: integer("order_index").default(0).notNull(), // Untuk urutan tampilan
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicEvents = pgTable("academic_events", {
	id: serial("id").primaryKey(),
	calendarId: integer("calendar_id")
		.notNull()
		.references(() => academicCalendars.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"), // Opsional, jika null maka single-day event
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
