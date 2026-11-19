import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/app/app-shell";
import { studentModules } from "@/lib/modules";

export default async function StudentModulePage({ params }: PageProps<"/app/[module]">) {
  const { module } = await params;
  const info = studentModules.find((m) => m.slug === module);
  if (!info) notFound();
  return <ComingSoon title={info.label} phase={info.phase} description={info.description} backHref="/app" />;
}
