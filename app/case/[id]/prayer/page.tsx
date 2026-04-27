"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { generatePrayerData, PRAYER_LABELS } from "@/lib/prayer";
import solarlunar from "solarlunar";
import { formatDate } from "@/lib/date";

const RELATIONSHIP_LABELS: Record<string, string> = {
  Son: "Son 儿子",
  Daughter: "Daughter 女儿",
  ElderSister: "Elder Sister 姐姐",
  YoungerSister: "Younger Sister 妹妹",
};


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
  const [saving, setSaving] = useState(false);

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
  useEffect(() => {
    const fetchData = async () => {
      if (!caseId) return;

      try {
        setLoading(true);

        const [caseRes, obRes, prayerRes] = await Promise.all([
          supabase
            .from("cases")
            .select("religion, contact_name, contact_phone, contact_relationship")
            .eq("id", caseId)
            .single(),

          supabase
            .from("obituaries")
            .select("name_cn, name_ic, death_datetime")
            .eq("case_uuid", caseId)
            .single(),

          supabase
            .from("prayer_schedules")
            .select("*")
            .eq("case_uuid", caseId),
        ]);

        const caseData = caseRes.data;
        const obData = obRes.data;
        const existing = prayerRes.data;

        if (!caseData || !obData) {
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

        setObituary(obData);

        // ✅ ALWAYS generate fresh from death date
        const generated = generatePrayerData(obData.death_datetime);

        const existingMap = new Map(
          (existing || []).map((p: any) => [p.prayer_type, p])
        );

        const merged = generated.map((g: any) => {
          const db = existingMap.get(g.type);

          if (db) {
            return {
              ...g,
              ...db,
              type: db.prayer_type,
              label: PRAYER_LABELS[db.prayer_type] || db.prayer_type,
              isManual: db.is_manual || false,
              remark: db.remark || "",
            };
          }

          return {
            ...g,
            label: PRAYER_LABELS[g.type] || g.type,
            isManual: false,
            remark: "",
          };
        });

        merged.sort(
          (a, b) =>
            PRAYER_ORDER.indexOf(a.type) -
            PRAYER_ORDER.indexOf(b.type)
        );

        setPrayers(merged);
        setSelected(existing?.map((p: any) => p.prayer_type) || []);
      } catch (err) {
        console.error(err);
      } finally {
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

  // 🔥 FIXED RESET (RECALCULATE FROM SOURCE)
  const handleReset = (index: number) => {
    if (!obituary?.death_datetime) return;

    const fresh = generatePrayerData(obituary.death_datetime);
    const targetType = prayers[index].type;

    const freshItem = fresh.find((f: any) => f.type === targetType);
    if (!freshItem) return;

    const updated = [...prayers];

    updated[index] = {
      ...updated[index],
      ...freshItem,
      label: PRAYER_LABELS[targetType] || targetType,
      isManual: false,
      remark: updated[index].remark || "",
    };

    setPrayers(updated);
  };

  // 🔹 SAVE
  const handleSave = async () => {
    if (selected.length === 0) {
      alert("Please select at least one prayer");
      return;
    }

    setSaving(true);

    try {
      const updatePromise = supabase
        .from("cases")
        .update({
          contact_name: contact.name,
          contact_phone: contact.phone,
          contact_relationship: contact.relationship,
        })
        .eq("id", caseId);

      const payload = prayers
        .filter((p) => selected.includes(p.type))
        .map((p) => ({
          case_uuid: caseId,
          prayer_type: p.type,
          western_date: p.western_date,
          western_day: p.western_day,
          lunar_month: p.lunar_month,
          lunar_day: p.lunar_day,
          lunar_day_name: p.lunar_day_name,
          reminder_date: p.reminder_date,
          is_manual: p.isManual || false,
          remark: p.remark || "",
        }));

      const deletePromise =
        selected.length > 0
          ? supabase
              .from("prayer_schedules")
              .delete()
              .eq("case_uuid", caseId)
              .not(
                "prayer_type",
                "in",
                `(${selected.map((s) => `"${s}"`).join(",")})`
              )
          : supabase
              .from("prayer_schedules")
              .delete()
              .eq("case_uuid", caseId);

      const upsertPromise = supabase
        .from("prayer_schedules")
        .upsert(payload, {
          onConflict: "case_uuid,prayer_type",
        });

      const [, deleteRes, upsertRes] = await Promise.all([
        updatePromise,
        deletePromise,
        upsertPromise,
      ]);

      if (deleteRes.error) {
        console.error(deleteRes.error);
        alert("Error deleting old prayers");
        return;
      }

      if (upsertRes.error) {
        console.error(upsertRes.error);
        alert("Error saving");
        return;
      }

      router.push(`/case/${caseId}`);
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!obituary) return <div className="p-4">No obituary found</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
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

      <div className="px-4 py-6 space-y-6">

        {/* Deceased */}
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
            {obituary.death_datetime
              ? formatDate(obituary.death_datetime)
              : "No date"}
          </div>
        </div>

        {/* Contact */}
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
            className="w-full border p-3 rounded-lg"
          />

          <input
            placeholder="Phone"
            value={contact.phone}
            onChange={(e) =>
              setContact({ ...contact, phone: e.target.value })
            }
            className="w-full border p-3 rounded-lg"
          />

          <select
            value={contact.relationship || ""}
            onChange={(e) =>
              setContact({ ...contact, relationship: e.target.value })
            }
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Select Relationship</option>
            <option value="Son">Son 儿子</option>
            <option value="Daughter">Daughter 女儿</option>
            <option value="ElderSister">Elder Sister 姐姐</option>
            <option value="YoungerSister">Younger Sister 妹妹</option>
          </select>
        </div>

        {/* Prayer List */}
        <div className="space-y-4">
          {prayers.map((p, index) => (
            <div key={p.type} className="bg-white border rounded-2xl p-4">
              <label className="flex gap-3">

                <input
                  type="checkbox"
                  checked={selected.includes(p.type)}
                  onChange={() => toggle(p.type)}
                />

                <div className="w-full space-y-2">

                  <div className="font-semibold">
                    {p.type} {p.label}
                  </div>

                  <input
                    type="date"
                    value={p.western_date}
                    onChange={(e) =>
                      handleDateChange(index, e.target.value)
                    }
                    className="border px-3 py-2 rounded-lg w-full"
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
                        <span className="text-orange-600">Manual</span>
                        <button
                          onClick={() => handleReset(index)}
                          className="text-blue-600 underline"
                        >
                          Reset
                        </button>
                      </>
                    ) : (
                      <span className="text-green-600">Auto</span>
                    )}
                  </div>

                  <textarea
  placeholder="Remark (optional)"
  value={p.remark || ""}
  onChange={(e) => {
    const updated = [...prayers];
    updated[index].remark = e.target.value;
    setPrayers(updated);
  }}
  className="border px-3 py-2 rounded-lg w-full text-sm"
/>

                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-black text-white py-4 rounded-xl"
        >
          {saving ? "Saving..." : "Save Prayer Schedule"}
        </button>

      </div>
    </div>
  );
}