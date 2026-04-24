"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { generatePrayerData, PRAYER_LABELS } from "@/lib/prayer";
import solarlunar from "solarlunar";
import { formatDate } from "@/lib/date";

const PRAYER_ORDER = ["1st", "3rd", "5th", "7th", "100th"];

export default function PrayerPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const [caseId, setCaseId] = useState<string | null>(null);
  const [obituary, setObituary] = useState<any>(null);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [contact, setContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  const isUUID = (id: string) =>
    /^[0-9a-f-]{36}$/i.test(id);

  // 🔹 resolve caseId
  useEffect(() => {
    const resolveCase = async () => {
      if (!rawId) return;

      if (isUUID(rawId)) {
        setCaseId(rawId);
        return;
      }

      const { data } = await supabase
        .from("cases")
        .select("id")
        .eq("case_id", rawId)
        .single();

      if (data?.id) setCaseId(data.id);
    };

    resolveCase();
  }, [rawId]);

  // 🔹 fetch data
  // 🔹 fetch data
useEffect(() => {
  const fetchData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);

      const { data: caseData } = await supabase
        .from("cases")
        .select(
          "religion, contact_name, contact_phone, contact_relationship"
        )
        .eq("id", caseId)
        .single();

      if (!caseData) {
        setLoading(false);
        return;
      }

      if (caseData.religion !== "Buddhist") {
        router.push(`/case/${caseId}`);
        return;
      }

      setContact({
        name: caseData.contact_name || "",
        phone: caseData.contact_phone || "",
        relationship: caseData.contact_relationship || "",
      });

      const { data: obData } = await supabase
        .from("obituaries")
        .select("name_cn, name_ic, death_datetime")
        .eq("case_uuid", caseId)
        .single();

      if (!obData) {
        setLoading(false);
        return;
      }

      setObituary(obData);

      const { data: existing } = await supabase
        .from("prayer_schedules")
        .select("*")
        .eq("case_uuid", caseId);

      // ✅ ALWAYS generate full list
      const generated = generatePrayerData(obData.death_datetime);

      // ✅ map DB into lookup
      const existingMap = new Map(
        (existing || []).map((p: any) => [p.prayer_type, p])
      );

      // ✅ merge generated + DB
      const merged = generated.map((g: any) => {
        const db = existingMap.get(g.type);

        if (db) {
          return {
            type: db.prayer_type,
            label: PRAYER_LABELS[db.prayer_type] || db.prayer_type,

            western_date: db.western_date,
            western_day: db.western_day,
            lunar_month: db.lunar_month,
            lunar_day: db.lunar_day,
            lunar_day_name: db.lunar_day_name,
            reminder_date: db.reminder_date,
            isManual: db.is_manual || false,

            original_date: g.western_date,
            original_day: g.western_day,
            original_lunar_month: g.lunar_month,
            original_lunar_day: g.lunar_day,
            original_lunar_day_name: g.lunar_day_name,
          };
        }

        return {
          ...g,
          isManual: false,

          original_date: g.western_date,
          original_day: g.western_day,
          original_lunar_month: g.lunar_month,
          original_lunar_day: g.lunar_day,
          original_lunar_day_name: g.lunar_day_name,
        };
      });

      // ✅ keep order
      merged.sort(
        (a, b) =>
          PRAYER_ORDER.indexOf(a.type) -
          PRAYER_ORDER.indexOf(b.type)
      );

      setPrayers(merged);

      // ✅ selected comes ONLY from DB
      setSelected(existing?.map((p: any) => p.prayer_type) || []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  fetchData();
}, [caseId]);



  // 🔹 toggle
  const toggle = (type: string) => {
    setSelected((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // 🔹 change date
  const handleDateChange = (index: number, newDate: string) => {
    const updated = [...prayers];
    const d = new Date(newDate);
    if (isNaN(d.getTime())) return;

    const lunar = solarlunar.solar2lunar(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );

    updated[index] = {
      ...updated[index],
      western_date: newDate,
      western_day: d.toLocaleDateString("en-GB", { weekday: "long" }),
      lunar_month: lunar.monthCn,
      lunar_day: lunar.dayCn,
      lunar_day_name: `星期${"日一二三四五六"[d.getDay()]}`,
      isManual: true,
    };

    setPrayers(updated);
  };

  // 🔹 reset
  const handleReset = (index: number) => {
    const updated = [...prayers];

    updated[index] = {
      ...updated[index],
      western_date: updated[index].original_date,
      western_day: updated[index].original_day,
      lunar_month: updated[index].original_lunar_month,
      lunar_day: updated[index].original_lunar_day,
      lunar_day_name: updated[index].original_lunar_day_name,
      isManual: false,
    };

    setPrayers(updated);
  };

  // 🔹 SAVE (FULL FIX)
  const handleSave = async () => {
    if (selected.length === 0) {
      alert("Please select at least one prayer");
      return;
    }

    await supabase
      .from("cases")
      .update({
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_relationship: contact.relationship,
      })
      .eq("id", caseId);

    const { data: caseData } = await supabase
      .from("cases")
      .select("case_id")
      .eq("id", caseId)
      .single();

    const payload = prayers
      .filter((p) => selected.includes(p.type))
      .map((p) => ({
        case_uuid: caseId,
        case_id: caseData?.case_id,
        prayer_type: p.type,
        western_date: p.western_date,
        western_day: p.western_day,
        lunar_month: p.lunar_month,
        lunar_day: p.lunar_day,
        lunar_day_name: p.lunar_day_name,
        reminder_date: p.reminder_date,
        is_manual: p.isManual || false,
      }));


let deleteError = null;

// ✅ DELETE
if (selected.length > 0) {
  const selectedList = selected.map((s) => `"${s}"`).join(",");

  const { error } = await supabase
    .from("prayer_schedules")
    .delete()
    .eq("case_uuid", caseId)
    .not("prayer_type", "in", `(${selectedList})`);

  deleteError = error;
} else {
  const { error } = await supabase
    .from("prayer_schedules")
    .delete()
    .eq("case_uuid", caseId);

  deleteError = error;
}

// ✅ UPSERT
const { error: upsertError } = await supabase
  .from("prayer_schedules")
  .upsert(payload, {
    onConflict: "case_uuid,prayer_type",
  });

// ✅ ERROR HANDLING
if (deleteError) {
  console.error(deleteError);
  alert("Error deleting old prayers");
  return;
}

if (upsertError) {
  console.error(upsertError);
  alert("Error saving");
} else {
  alert("Saved successfully");
  router.push(`/case/${caseId}`);
}

  }
  

if (loading) return <div className="p-4">Loading...</div>;
if (!obituary) return <div className="p-4">No obituary found</div>;

return (
  <div className="min-h-screen bg-gray-50">

    {/* 🔝 Sticky Header (MATCHED) */}
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => router.push(`/case/${caseId}`)}
        className="text-base font-medium text-gray-700"
      >
        ← Back
      </button>

      <h1 className="text-base font-semibold text-gray-900">
        Prayer Schedule
      </h1>
    </div>

    {/* Content */}
    <div className="px-4 py-6 space-y-6">

      {/* 👤 Deceased Info */}
      <div className="bg-white border rounded-2xl p-5 text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">
          {obituary.name_cn}
        </h2>

        {obituary.name_ic && (
          <div className="text-sm text-gray-600">
            {obituary.name_ic}
          </div>
        )}

        <div className="text-sm text-gray-500 mt-2">
          Death Date:{" "}
          {obituary?.death_datetime
         ? formatDate(obituary.death_datetime)
          : "No date"}
        </div>
      </div>

      {/* 📞 Contact */}
      <div className="bg-white border rounded-2xl p-5 space-y-3">
        <h3 className="text-base font-semibold text-gray-800">
          Contact Person
        </h3>

        <input
          placeholder="Name"
          value={contact.name}
          onChange={(e) =>
            setContact({ ...contact, name: e.target.value })
          }
          className="w-full border p-3 rounded-lg text-base"
        />

        <input
          placeholder="Phone"
          value={contact.phone}
          onChange={(e) =>
            setContact({ ...contact, phone: e.target.value })
          }
          className="w-full border p-3 rounded-lg text-base"
        />

        <select
          value={contact.relationship}
          onChange={(e) =>
            setContact({ ...contact, relationship: e.target.value })
          }
          className="w-full border p-3 rounded-lg text-base"
        >
          <option value="">Select Relationship</option>
          <option value="Son">Son 儿子</option>
          <option value="Daughter">Daughter 女儿</option>
        </select>
      </div>

      {/* 🕯 Prayer List */}
      <div className="space-y-4">
        {prayers.map((p, index) => (
          <div
            key={p.type}
            className="bg-white border rounded-2xl p-4 shadow-sm"
          >
            <label className="flex gap-3 items-start">

              <input
                type="checkbox"
                checked={selected.includes(p.type)}
                onChange={() => toggle(p.type)}
                className="mt-1"
              />

              <div className="w-full space-y-2">

                <div className="font-semibold text-gray-900">
                  {p.type} {p.label}
                </div>

                <input
                  type="date"
                  value={p.western_date}
                  onChange={(e) =>
                    handleDateChange(index, e.target.value)
                  }
                  className="border px-3 py-2 rounded-lg w-full text-base"
                />

                <div className="text-sm text-gray-600">
                {p.western_date
                  ? new Date(p.western_date + "T00:00:00").toLocaleDateString("en-GB")
                  : "No date"} ({p.western_day})
                  
                </div>

                <div className="text-sm text-gray-700">
                  {p.lunar_month} {p.lunar_day} {p.lunar_day_name}
                </div>

                <div className="text-xs flex gap-2">
                  {p.isManual ? (
                    <>
                      <span className="text-orange-600">
                        🟠 Manual
                      </span>
                      <button
                        onClick={() => handleReset(index)}
                        className="text-blue-600 underline"
                      >
                        Reset
                      </button>
                    </>
                  ) : (
                    <span className="text-green-600">
                      🟢 Auto
                    </span>
                  )}
                </div>

              </div>
            </label>
          </div>
        ))}
      </div>

      {/* 💾 Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-black text-white py-4 rounded-xl text-base font-medium"
      >
        Save Prayer Schedule
      </button>

    </div>
  </div>
);
  }