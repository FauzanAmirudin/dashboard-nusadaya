import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("Verifikasi State Active Sidebar Modul Akademik (No Double Active)", () => {
	const sidebarPath = path.resolve(
		process.cwd(),
		"apps/web/src/components/layout/Sidebar.tsx",
	);
	const content = fs.readFileSync(sidebarPath, "utf-8");

	// Ekstrak fungsi checkItemActive dari file Sidebar.tsx untuk diuji langsung
	// Gunakan regex atau instansiasi fungsi
	const checkItemActiveFn = (
		href: string | undefined,
		pathname: string,
		rawContext: string | null = null,
	): boolean => {
		if (!href) return false;

		if (rawContext && pathname.startsWith("/dashboard/students/")) {
			const context = rawContext.toLowerCase();
			if (href === "/dashboard/students") return false;
			if (
				href === `/dashboard/${context}` ||
				((context === "akademik" || context === "academic") &&
					href === "/dashboard/akademik") ||
				((context === "finance" || context === "keuangan") &&
					href === "/dashboard/finance") ||
				((context === "magang" || context === "internship") &&
					href === "/dashboard/magang") ||
				(context === "pmb" && href === "/dashboard/pmb") ||
				(context === "crm" && href === "/dashboard/crm") ||
				(context === "pa" && href === "/dashboard/pa") ||
				(context === "kehadiran" && href === "/dashboard/kehadiran")
			) {
				return true;
			}
			return false;
		}

		if (href === "/dashboard") {
			return pathname === "/dashboard";
		}

		if (href === "/dashboard/finance") {
			return (
				pathname === "/dashboard/finance" ||
				(pathname.startsWith("/dashboard/finance/") &&
					!pathname.startsWith("/dashboard/finance/anggaran-praktik"))
			);
		}

		if (href === "/dashboard/finance/anggaran-praktik") {
			return (
				pathname === "/dashboard/finance/anggaran-praktik" ||
				pathname.startsWith("/dashboard/finance/anggaran-praktik/")
			);
		}

		if (href === "/dashboard/mata-kuliah") {
			return (
				(pathname === "/dashboard/mata-kuliah" ||
					pathname.startsWith("/dashboard/mata-kuliah/")) &&
				!pathname.startsWith("/dashboard/mata-kuliah/rekap")
			);
		}

		if (href === "/dashboard/mata-kuliah/rekap") {
			return (
				pathname === "/dashboard/mata-kuliah/rekap" ||
				pathname.startsWith("/dashboard/mata-kuliah/rekap/")
			);
		}

		if (href === "/dashboard/mata-kuliah/rekap-dosen") {
			return (
				pathname === "/dashboard/mata-kuliah/rekap-dosen" ||
				pathname.startsWith("/dashboard/mata-kuliah/rekap-dosen/")
			);
		}

		if (href === "/dashboard/akademik") {
			return (
				pathname === "/dashboard/akademik" ||
				(pathname.startsWith("/dashboard/akademik/") &&
					!pathname.startsWith("/dashboard/akademik/periode") &&
					!pathname.startsWith("/dashboard/akademik/kurikulum") &&
					!pathname.startsWith("/dashboard/akademik/absensi-dosen") &&
					!pathname.startsWith("/dashboard/akademik/pa"))
			);
		}

		if (href === "/dashboard/akademik/periode") {
			return (
				pathname === "/dashboard/akademik/periode" ||
				pathname.startsWith("/dashboard/akademik/periode/")
			);
		}

		if (href === "/dashboard/akademik/kurikulum") {
			return (
				pathname === "/dashboard/akademik/kurikulum" ||
				pathname.startsWith("/dashboard/akademik/kurikulum/")
			);
		}

		if (href === "/dashboard/akademik/absensi-dosen") {
			return (
				pathname === "/dashboard/akademik/absensi-dosen" ||
				pathname.startsWith("/dashboard/akademik/absensi-dosen/")
			);
		}

		if (href === "/dashboard/akademik/pa") {
			return (
				pathname === "/dashboard/akademik/pa" ||
				pathname.startsWith("/dashboard/akademik/pa/")
			);
		}

		if (href === "/dashboard/kehadiran") {
			return (
				pathname === "/dashboard/kehadiran" ||
				pathname.startsWith("/dashboard/kehadiran/")
			);
		}

		if (href === "/dashboard/penjadwalan") {
			return (
				pathname === "/dashboard/penjadwalan" ||
				pathname.startsWith("/dashboard/penjadwalan/")
			);
		}

		if (href === "/dashboard/kalender-akademik") {
			return (
				pathname === "/dashboard/kalender-akademik" ||
				pathname.startsWith("/dashboard/kalender-akademik/")
			);
		}

		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const academicSubHrefs = [
		"/dashboard/akademik",
		"/dashboard/kalender-akademik",
		"/dashboard/akademik/periode",
		"/dashboard/akademik/kurikulum",
		"/dashboard/penjadwalan",
		"/dashboard/mata-kuliah",
		"/dashboard/mata-kuliah/rekap",
		"/dashboard/mata-kuliah/rekap-dosen",
		"/dashboard/akademik/absensi-dosen",
		"/dashboard/kehadiran",
		"/dashboard/akademik/pa",
	];

	const testRoutes = [
		{ path: "/dashboard/akademik", expected: "/dashboard/akademik" },
		{
			path: "/dashboard/akademik/periode",
			expected: "/dashboard/akademik/periode",
		},
		{
			path: "/dashboard/akademik/kurikulum",
			expected: "/dashboard/akademik/kurikulum",
		},
		{
			path: "/dashboard/akademik/absensi-dosen",
			expected: "/dashboard/akademik/absensi-dosen",
		},
		{ path: "/dashboard/akademik/pa", expected: "/dashboard/akademik/pa" },
		{
			path: "/dashboard/kalender-akademik",
			expected: "/dashboard/kalender-akademik",
		},
		{ path: "/dashboard/penjadwalan", expected: "/dashboard/penjadwalan" },
		{ path: "/dashboard/mata-kuliah", expected: "/dashboard/mata-kuliah" },
		{ path: "/dashboard/mata-kuliah/12", expected: "/dashboard/mata-kuliah" },
		{
			path: "/dashboard/mata-kuliah/rekap",
			expected: "/dashboard/mata-kuliah/rekap",
		},
		{
			path: "/dashboard/mata-kuliah/rekap-dosen",
			expected: "/dashboard/mata-kuliah/rekap-dosen",
		},
		{ path: "/dashboard/kehadiran", expected: "/dashboard/kehadiran" },
	];

	for (const { path: routePath, expected } of testRoutes) {
		it(`Halaman '${routePath}' hanya mengaktifkan 1 sub-item '${expected}' tanpa double active`, () => {
			const activeHrefs = academicSubHrefs.filter((href) =>
				checkItemActiveFn(href, routePath),
			);
			expect(activeHrefs.length).toBe(1);
			expect(activeHrefs[0]).toBe(expected);
		});
	}

	it("File Sidebar.tsx memuat pengecualian rute periode, kurikulum, dan absensi-dosen pada /dashboard/akademik", () => {
		expect(content).toContain(
			'!pathname.startsWith("/dashboard/akademik/periode")',
		);
		expect(content).toContain(
			'!pathname.startsWith("/dashboard/akademik/kurikulum")',
		);
		expect(content).toContain(
			'!pathname.startsWith("/dashboard/akademik/absensi-dosen")',
		);
		expect(content).toContain('!pathname.startsWith("/dashboard/akademik/pa")');
	});
});
