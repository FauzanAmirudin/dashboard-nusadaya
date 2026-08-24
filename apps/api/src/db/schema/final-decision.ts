import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { evaluatorDecisionEnum } from "./enums";
import { students, users } from "./shared";

// 10. Final Decision
export const finalDecision = pgTable(
	"final_decision",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull()
			.unique(),
		evaluatorDecision:
			evaluatorDecisionEnum("evaluator_decision").default("menunggu"),
		evaluatorNotes: text("evaluator_notes"),
		decidedAt: timestamp("decided_at"),
		decidedBy: integer("decided_by").references(() => users.id),
		isApprovedByDirector: boolean("is_approved_by_director").default(false),
		departureDate: timestamp("departure_date"),
		notes: text("notes"),
		confidentialNotes: text("confidential_notes"),
		skDocumentUrl: text("sk_document_url"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_final_decision_student_id").on(t.studentId)],
);
