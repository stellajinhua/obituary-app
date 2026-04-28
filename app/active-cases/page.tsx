"use client";

import { useEffect, useState } from "react";
import { getCasesWithNextPrayer } from "@/lib/caseService";
import { useRouter } from "next/navigation";
import solarlunar from "solarlunar";
import { formatDateWithDay } from "@/lib/date";
import { PRAYER_LABELS } from "@/lib/prayer";

const RELATIONSHIP_CN: Record<string, string> = {
  Son: "儿子",
  Daughter: "女儿",
  ElderSister: "姐姐",
  YoungerSister: "妹妹",
};


// =========================
// SAFE DATE (FIXES TIMEZONE)
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
// Helpers
// =========================
function getMilestone(day: number) {
  if (day === 7) return "头七";
  if (day === 49) return "七七";
  if (day === 100) return "百日";
  return null;
}

function getNextMilestone(day: number) {
  if (day < 7) return { day: 7, label: "头七" };
  if (day < 49) return { day: 49, label: "七七" };
  if (day < 100) return { day: 100, label: "百日" };
  return null;
}


// ✅ NEW: calculate next milestone date
function getNextMilestoneDate(deathStr: string, targetDay: number) {
  const death = parseDate(deathStr);
  if (!death) return null;

  const next = new Date(death);
  next.setDate(death.getDate() + (targetDay - 1));

  return next;
}

// ✅ NEW: format western + lunar
function formatFullDate(date: Date) {
  const western = `${date.toLocaleDateString("en-GB")} (${date.toLocaleDateString(
    "en-GB",
    { weekday: "long" }
  )})`;

  const lunar = solarlunar.solar2lunar(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const lunarText = `${lunar.monthCn} ${lunar.dayCn} 星期${
    "日一二三四五六"[date.getDay()]
  }`;

  return { western, lunar: lunarText };
}

// =========================
// Page
// =========================
export default function ActiveCasesPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const all = await getCasesWithNextPrayer();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: any[] = [];

    all.forEach((c) => {
      if (!c.death_datetime) return;

      const religion = (c.religion || "").toLowerCase().trim();
      if (!religion.includes("buddhist")) return;

      const death = parseDate(c.death_datetime);
      if (!death) return;

      const dayCount = Math.floor(
        (today.getTime() - death.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (dayCount < 0 || dayCount > 100) return;

      result.push({
        ...c,
        day_count: dayCount,
      });
    });

    result.sort((a, b) => a.day_count - b.day_count);
    setList(result);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-base font-medium text-gray-700 py-1"
        >
          ← Home
        </button>

        <h1 className="text-base font-semibold text-gray-900">
          Active Cases
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-6">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            Within 100 Days
          </h2>

          {list.length > 0 && (
            <span className="text-xs text-gray-400">
              {list.length}
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <div className="bg-white border rounded-2xl p-5 text-sm text-gray-400 text-center">
            No active cases
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((c) => (
              <Card key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================
// Card
// =========================
function Card({ c }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">

      {/* Name */}
      <div className="text-base font-semibold text-gray-900 leading-snug">
        {c.name || "No Name"}
      </div>

      {/* Date */}
      <div className="text-sm text-gray-600 leading-relaxed">
        <span className="font-semibold text-gray-800">
          Date of Death:
        </span>{" "}
        {formatDateWithDay(c.death_datetime)}
      </div>

      {/* Milestone */}
      {(() => {
        const milestone = getMilestone(c.day_count);
        const next = getNextMilestone(c.day_count);
        const prayer = c.prayer;

        if (milestone) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-xs text-red-500 font-semibold">
                TODAY
              </div>
              <div className="text-lg font-bold text-red-600">
                {milestone}
              </div>
              <div className="text-sm text-red-500">
                Day {c.day_count}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Day {c.day_count}
              <span className="text-xs text-gray-500 ml-2">
                since passing
              </span>
            </div>

            {prayer && (() => {
  const date = parseDate(prayer.western_date);
  if (!date) return null;

  const { western, lunar } = formatFullDate(date);

  const today = new Date();
  today.setHours(0,0,0,0);

  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000*60*60*24)
  );

  return (
    <div className="bg-gray-50 border rounded-xl p-3 space-y-1">
   

      <div className="text-xs text-gray-500 font-semibold">
        {diffDays === 0 ? "TODAY" : "UPCOMING"}
      </div>

      <div className="text-lg font-bold text-gray-900">
        {PRAYER_LABELS[prayer.prayer_type] || prayer.prayer_type}
      </div>

      <div className="text-sm text-gray-500">
        {diffDays === 0 ? "Today" : `in ${diffDays} days`}
      </div>

      <div className="text-sm text-gray-600">
        {western}
      </div>

      <div className="text-sm text-gray-700">
        {lunar}
      </div>
   {prayer.remark && (
  <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
    📝 {prayer.remark}
  </div>
)}
    </div>
  );
})()}
          </div>
        );
      })()}

      {/* Divider */}
      <div className="border-t pt-2" />

      {/* Contact */}
      <div className="text-sm text-gray-700 leading-relaxed">
        <span className="font-semibold text-gray-800">
          Contact:
        </span>{" "}
        {c.contact_name}{" "}
        <span className="text-gray-500">
  ({RELATIONSHIP_CN[c.relationship] || c.relationship})
</span>{" "}
        <span className="font-medium">
          {c.contact_phone}
        </span>
      </div>
    </div>
  );
}