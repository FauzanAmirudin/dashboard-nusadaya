import { client } from "../src/db";

async function main() {
	console.log("=== AUDITING EXISTING INDEXES IN POSTGRESQL ===");
	const indexes = await client`
		SELECT
			tablename,
			indexname,
			indexdef
		FROM
			pg_indexes
		WHERE
			schemaname = 'public'
		ORDER BY
			tablename, indexname;
	`;

	console.log(`Found ${indexes.length} indexes:\n`);
	for (const idx of indexes) {
		console.log(`Table: ${idx.tablename} | Index: ${idx.indexname}`);
		console.log(`  Def: ${idx.indexdef}`);
	}

	console.log("\n=== EXPLAIN ANALYZE ON MAIN STUDENTS QUERY ===");
	try {
		const explain = await client.unsafe(`
			EXPLAIN ANALYZE
			SELECT
				s.id, s.nim, s.name, s.cohort, s.overall_status,
				pmb.status, crm.status, fin.status, aca.status, pa.status, intern.status, dec.evaluator_decision
			FROM students s
			LEFT JOIN pmb_data pmb ON s.id = pmb.student_id
			LEFT JOIN crm_data crm ON s.id = crm.student_id
			LEFT JOIN finance_data fin ON s.id = fin.student_id
			LEFT JOIN academic_data aca ON s.id = aca.student_id
			LEFT JOIN pa_data pa ON s.id = pa.student_id
			LEFT JOIN internship_data intern ON s.id = intern.student_id
			LEFT JOIN final_decision dec ON s.id = dec.student_id
			WHERE s.is_archived = false
			ORDER BY s.updated_at DESC, s.id DESC
			LIMIT 50 OFFSET 0;
		`);
		for (const row of explain) {
			console.log(row["QUERY PLAN"]);
		}
	} catch (err) {
		console.error("Explain error:", err);
	}

	process.exit(0);
}

main().catch(console.error);
