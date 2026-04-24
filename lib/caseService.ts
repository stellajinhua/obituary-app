import { supabase } from "@/lib/supabaseClient";

// ✅ helper: safe local date (NO timezone shift)
function parseDate(dateStr: string) {
  if (!dateStr) return null;

  const raw = dateStr.includes("T")
    ? dateStr.split("T")[0]
    : dateStr;

  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// =========================
// NEXT PRAYER
// =========================
function getNextPrayer(prayers: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ✅ normalize

  return (
    prayers
      .map((p) => ({
        ...p,
        dateObj: parseDate(p.western_date),
      }))
      .filter((p) => p.dateObj && p.dateObj >= today)
      .sort(
        (a, b) =>
          a.dateObj.getTime() - b.dateObj.getTime()
      )[0] || null
  );
}

// =========================
// MAIN SERVICE
// =========================
export async function getCasesWithNextPrayer() {
  const { data: cases } = await supabase.from("cases").select("*");
  const { data: obituaries } = await supabase.from("obituaries").select("*");
  const { data: prayers } = await supabase.from("prayer_schedules").select("*");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // ✅ normalize

  return (cases || []).map((c: any) => {
    // ✅ match obituary safely
    const ob = obituaries?.find(
      (o: any) => o.case_uuid === c.id
    );

    // ✅ match prayers safely
    const related =
      prayers?.filter((p: any) => {
        return (
          p.case_uuid === c.id ||
          p.case_id === c.id
        );
      }) || [];

    const next = getNextPrayer(related);

    const deathDate = parseDate(ob?.death_datetime);

    const day_number = deathDate
      ? Math.floor(
          (today.getTime() - deathDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      id: c.id,
      name: ob?.name_cn || null,
      religion: c.religion,

      contact_name: c.contact_name,
      contact_phone: c.contact_phone,
      relationship: c.contact_relationship,

      death_datetime: ob?.death_datetime || null,

      next_prayer_date: next?.western_date || null,
      next_prayer_type: next?.prayer_type || null,

      // ✅ lunar data (FIXED)
      lunar_month: next?.lunar_month || null,
      lunar_day: next?.lunar_day || null,
      lunar_day_name: next?.lunar_day_name || null,

      day_number,
    };
  });
}