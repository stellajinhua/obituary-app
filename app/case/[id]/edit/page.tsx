import ObituaryForm from "@/components/ObituaryForm";
import { supabase } from "@/lib/supabaseClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const [obituaryRes, parloursRes, caseRes] = await Promise.all([
    supabase
      .from("obituaries")
      .select("*")
      .eq("case_uuid", id)
      .maybeSingle(),

    supabase
      .from("locations")
      .select("*")
      .order("name_en"),

    supabase
      .from("cases")
      .select("religion, burialtype")
      .eq("id", id)
      .maybeSingle(),
  ]);

  const obituaryData = obituaryRes.data;
  const parlours = parloursRes.data;
  const caseData = caseRes.data;

  return (
    <ObituaryForm
      parlours={parlours ?? []}
      caseId={id}
      religion={caseData?.religion ?? "Buddhist"}
      burialtype={caseData?.burialtype ?? null}
      initialData={obituaryData ?? null}
    />
  );
}