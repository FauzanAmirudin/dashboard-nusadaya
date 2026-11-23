"use client";

import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/eden";
import {
	ChecklistGroup,
	ChecklistRow,
	RowField,
	rowInputClass,
} from "./ChecklistRow";

interface TabSyaratAkhirProps {
	studentId: number;
	data: any;
	postInternshipDocs: any[];
	canEditPostInternship: boolean;
	loadingItem?: string | null;
	setPostInternshipDocs: (docs: any[]) => void;
	handleToggleField: (field: string, value: any) => Promise<void> | void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => Promise<void> | void;
}

export function TabSyaratAkhir({
	studentId,
	data,
	postInternshipDocs,
	canEditPostInternship,
	loadingItem = null,
	setPostInternshipDocs,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
}: TabSyaratAkhirProps) {
	const fetchDocs = () => {
		api.students[studentId.toString()]["post-internship"].documents
			.get()
			.then((res) => {
				if (res.data?.success) setPostInternshipDocs(res.data.data as any[]);
			});
	};

	const items = [
		{
			key: "logbookReady",
			docKey: "logbook",
			label: "Logbook Harian Magang",
			desc: "Buku harian yang telah ditandatangani supervisor industri",
		},
		{
			key: "laporanAkhirReady",
			docKey: "laporan_akhir",
			label: "Laporan Akhir Magang",
		},
		{
			key: "videoDokumentasiReady",
			docKey: "video_portofolio",
			label: "Video Portofolio / Luaran",
		},
	];
	const completedCount = items.filter((it) => Boolean(data?.[it.key])).length;

	return (
		<ChecklistGroup
			title="Berkas Kepulangan (Post-Internship)"
			done={completedCount}
			total={items.length}
		>
			{items.map((it) => (
				<ChecklistRow
					key={it.key}
					id={it.key}
					label={it.label}
					desc={it.desc}
					checked={Boolean(data?.[it.key])}
					loading={loadingItem === it.key}
					disabled={!canEditPostInternship}
					onCheckedChange={(checked) => handleToggleField(it.key, checked)}
					upload={
						<DocumentUpload
							studentId={studentId}
							panel="post-internship"
							documentKey={it.docKey}
							canEdit={canEditPostInternship}
							onUploadSuccess={fetchDocs}
						/>
					}
				>
					{it.key === "videoDokumentasiReady" && (
						<RowField
							label="Link Video Portofolio"
							htmlFor="videoDokumentasiLink"
						>
							<Input
								id="videoDokumentasiLink"
								placeholder="https://youtube.com/... atau Drive"
								className={rowInputClass}
								value={data?.videoDokumentasiLink || ""}
								disabled={!canEditPostInternship}
								onChange={(e) =>
									handleLocalChange("videoDokumentasiLink", e.target.value)
								}
								onBlur={() => handleBlurField("videoDokumentasiLink")}
							/>
						</RowField>
					)}
				</ChecklistRow>
			))}
		</ChecklistGroup>
	);
}
