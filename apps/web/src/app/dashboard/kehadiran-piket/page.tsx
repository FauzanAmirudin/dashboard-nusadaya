import { redirect } from "next/navigation";

export default function KehadiranPiketPage() {
	redirect("/dashboard/kehadiran?tab=piket");
}
