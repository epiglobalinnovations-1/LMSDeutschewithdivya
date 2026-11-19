import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/app/app-shell";
import { adminModules } from "@/lib/modules";

export default async function AdminModulePage({ params }: PageProps<"/admin/[module]">) {
  const { module } = await params;
  const info = adminModules.find((m) => m.slug === module);
  if (!info) notFound();
  return <ComingSoon title={info.label} phase={info.phase} description={info.description} backHref="/admin" />;
}
