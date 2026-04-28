import { supabase } from "@/lib/supabaseClient";

// =========================
// Helpers
// =========================
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
  today.setHours(0, 0, 0, 0);

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
// MAIN SERVICE (FIXED)
// =========================
export async function getCasesWithNextPrayer() {
  const [
    { data: cases },
    { data: obituaries },
    { data: prayers },
  ] = await Promise.all([
    supabase.from("cases").select("*"),
    supabase.from("obituaries").select("*"),
    supabase.from("prayer_schedules").select("*"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ✅ build lookup maps (FAST)
  const obituaryMap = new Map();
  obituaries?.forEach((o: any) => {
    obituaryMap.set(o.case_uuid, o);
  });

  const prayerMap = new Map();
  prayers?.forEach((p: any) => {
    const key = p.case_uuid || p.case_id;

    if (!prayerMap.has(key)) {
      prayerMap.set(key, []);
    }

    prayerMap.get(key).push(p);
  });

  return (cases || []).map((c: any) => {
    const ob = obituaryMap.get(c.id) || null;
    const related = prayerMap.get(c.id) || [];

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

      prayer: next
  ? {
      prayer_type: next.prayer_type,
      western_date: next.western_date,
      remark: next.remark || "",
    }
  : null,

      lunar_month: next?.lunar_month || null,
      lunar_day: next?.lunar_day || null,
      lunar_day_name: next?.lunar_day_name || null,

      day_number,
    };
  });
}