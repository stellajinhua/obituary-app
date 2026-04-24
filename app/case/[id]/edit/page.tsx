import ObituaryForm from "@/components/ObituaryForm";
import { supabase } from "@/lib/supabaseClient";

export default async function Page({ params }: any) {
  const { id } = await params; // 🔥 MUST await

  const { data: obituaryData } = await supabase
    .from("obituaries")
    .select("*")
    .eq("case_uuid", id)
    .single();

  const { data: parlours } = await supabase
    .from("locations")
    .select("*")
    .order("name_en");

const { data: caseData } = await supabase
  .from("cases")
  .select("religion, burialtype")
  .eq("id", id)
  .maybeSingle();

  return (
    <ObituaryForm
      parlours={parlours || []}
      caseId={id}
      religion={caseData?.religion || "Buddhist"} // 🔥 prevent undefined
      burialtype={caseData?.burialtype}
      initialData={obituaryData || null}
    />
  );
}