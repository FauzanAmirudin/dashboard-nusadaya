export function exportToCSV(data: any[], filename: string) {
	if (!data || data.length === 0) return;

	// Extract headers
	const headers = Object.keys(data[0]);

	// Create CSV rows
	const csvRows = [];

	// Add header row
	csvRows.push(
		headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(";"),
	);

	// Add data rows
	for (const row of data) {
		const values = headers.map((header) => {
			const val = row[header];
			const strVal = val === null || val === undefined ? "" : String(val);
			// Escape quotes
			return `"${strVal.replace(/"/g, '""')}"`;
		});
		csvRows.push(values.join(";"));
	}

	// Combine rows
	const csvString = csvRows.join("\n");

	// Create Blob and trigger download
	const blob = new Blob([`\uFEFF${csvString}`], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", `${filename}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
