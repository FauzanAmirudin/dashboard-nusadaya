import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface TabPraPasporProps {
	studentId: number;
	data: any;
	passportClearance: any;
	canEdit: boolean;
	handleToggleField: (field: string, value: any) => void;
	fetchInternshipData: () => Promise<void>;
}

export function TabPraPaspor({
	studentId,
	data,
	passportClearance,
	canEdit,
	handleToggleField,
	fetchInternshipData,
}: TabPraPasporProps) {
	// Compute isAllClear based on local data checkboxes
	const isAllClear =
		data?.praPasporPasFoto &&
		data?.praPasporKtm &&
		data?.praPasporKtp &&
		data?.praPasporKk &&
		data?.praPasporAktaKelahiran &&
		data?.praPasporSl21 &&
		data?.praPasporSkma &&
		data?.praPasporRekomendasiDisdik &&
		(passportClearance?.isGapYear ? data?.praPasporGapYear : true);

	return (
		<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
			<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
				<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
					STATUS KELAYAKAN PRA-PASPOR
				</h3>
			</div>
			<div className="p-5">
				<div className="mb-4">
					<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
						<span>Kelengkapan Berkas Sidik Paspor</span>
						{isAllClear ? (
							<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
								Lengkap
							</Badge>
						) : (
							<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
								Belum Lengkap
							</Badge>
						)}
					</h4>

					<h5 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">
						Dokumen Wajib
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
						{[
							{
								label: "Pas Foto Terbaru",
								key: "praPasporPasFoto",
								panel: "pmb",
								docKey: "pas_foto",
							},
							{
								label: "KTM",
								key: "praPasporKtm",
								panel: "pmb",
								docKey: "ktm",
							},
							{
								label: "Scan KTP",
								key: "praPasporKtp",
								panel: "pmb",
								docKey: "ktp",
							},
							{
								label: "Scan KK",
								key: "praPasporKk",
								panel: "pmb",
								docKey: "kk",
							},
							{
								label: "Scan Akta Kelahiran",
								key: "praPasporAktaKelahiran",
								panel: "pmb",
								docKey: "akta_kelahiran",
							},
							{
								label: "Statement Letter",
								key: "praPasporSl21",
								panel: "pmb",
								docKey: "sl21",
							},
							{
								label: "Surat Keterangan Mahasiswa Aktif",
								key: "praPasporSkma",
								panel: "pmb",
								docKey: "skma",
							},
							{
								label: "Surat Rekomendasi dari Disdik",
								key: "praPasporRekomendasiDisdik",
								panel: "pmb",
								docKey: "rekomendasi_disdik",
							},
							...(passportClearance?.isGapYear
								? [
										{
											label: "Dokumen Gap Year",
											key: "praPasporGapYear",
											panel: "pmb",
											docKey: "gap_year",
										},
									]
								: []),
						].map((item, idx) => (
							<div
								key={`wajib-${idx}`}
								className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
							>
								<div className="flex items-start gap-3 mb-3">
									<div className="mt-0.5 shrink-0 flex items-center">
										{canEdit ? (
											<button
												onClick={() =>
													handleToggleField(item.key, !data?.[item.key])
												}
												className="focus:outline-none hover:scale-110 transition-transform"
											>
												{data?.[item.key] ? (
													<CheckCircle className="w-5 h-5 text-emerald-500" />
												) : (
													<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
												)}
											</button>
										) : data?.[item.key] ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
										)}
									</div>
									<span
										className={`text-sm font-bold ${data?.[item.key] ? "text-slate-800" : "text-slate-600"}`}
									>
										{item.label}
									</span>
								</div>
								<div className="mt-auto pt-2 border-t border-slate-200/60">
									{item.panel ? (
										<DocumentUpload
											studentId={studentId}
											panel={item.panel as any}
											documentKey={item.docKey!}
											canEdit={canEdit}
											onUploadSuccess={fetchInternshipData}
										/>
									) : (
										<div className="text-xs text-slate-500 italic py-2 flex items-center justify-center bg-white rounded border border-slate-200 border-dashed">
											Divalidasi oleh Tim Akademik
										</div>
									)}
								</div>
							</div>
						))}
					</div>

					<h5 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">
						Dokumen Opsional
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
						{[
							{
								label: "NIM Tervalidasi PDDikti",
								key: "praPasporPddikti",
								panel: null,
								docKey: null,
							},
							{
								label: "CV Format Industri",
								key: "praPasporCv",
								panel: "pmb",
								docKey: "cv",
							},
						].map((item, idx) => (
							<div
								key={`opsional-${idx}`}
								className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
							>
								<div className="flex items-start gap-3 mb-3">
									<div className="mt-0.5 shrink-0 flex items-center">
										{canEdit ? (
											<button
												onClick={() =>
													handleToggleField(item.key, !data?.[item.key])
												}
												className="focus:outline-none hover:scale-110 transition-transform"
											>
												{data?.[item.key] ? (
													<CheckCircle className="w-5 h-5 text-emerald-500" />
												) : (
													<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
												)}
											</button>
										) : data?.[item.key] ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
										)}
									</div>
									<span
										className={`text-sm font-bold ${data?.[item.key] ? "text-slate-800" : "text-slate-600"}`}
									>
										{item.label}
									</span>
								</div>
								<div className="mt-auto pt-2 border-t border-slate-200/60">
									{item.panel ? (
										<DocumentUpload
											studentId={studentId}
											panel={item.panel as any}
											documentKey={item.docKey!}
											canEdit={canEdit}
											onUploadSuccess={fetchInternshipData}
										/>
									) : (
										<div className="text-xs text-slate-500 italic py-2 flex items-center justify-center bg-white rounded border border-slate-200 border-dashed">
											Divalidasi oleh Tim Akademik
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
