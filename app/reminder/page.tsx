"use client";

import { useEffect, useState } from "react";
import { getCasesWithNextPrayer } from "@/lib/caseService";
import { useRouter } from "next/navigation";


// =========================
// Helpers
// =========================
function getPrayerChinese(type: string) {
  if (!type) return "";

  const map: Record<string, string> = {
    "1st": "头七",
    "2nd": "二七",
    "3rd": "三七",
    "4th": "四七",
    "5th": "五七",
    "6th": "六七",
    "7th": "七七",
    "100th": "百日",
  };

  return map[type] || "";
}

function formatDateWithDay(dateStr: string) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  const day = d.toLocaleDateString("en-GB");
  const weekday = d.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  return `${day} (${weekday})`;
}

// =========================
// Main Page
// =========================
export default function ReminderPage() {
  const router = useRouter();
  const [todayList, setTodayList] = useState<any[]>([]);
  const [upcomingList, setUpcomingList] = useState<any[]>([]);

  useEffect(() => {
    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function load() {
    const all = await getCasesWithNextPrayer();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    const t: any[] = [];
    const u: any[] = [];

    all.forEach((c) => {
      if (!c.next_prayer_date) return;

      const d = new Date(c.next_prayer_date + "T00:00:00");
      d.setHours(0, 0, 0, 0);

      if (d.getTime() === today.getTime()) {
        t.push(c);
        return;
      }

      if (d > today && d <= in3Days) {
        u.push(c);
      }
    });

    setTodayList(t);
    setUpcomingList(u);
  }

  return (

    
    <div className="min-h-screen bg-gray-50 px-4 py-6">

  {/* 🔝 Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">

        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium text-gray-700"
        >
          ← Home
        </button>

        <h1 className="text-lg font-semibold text-gray-900">
          Reminder
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-10">
        <Section title="Today" data={todayList} variant="today" />
        <Section title="Upcoming" data={upcomingList} />
      </div>

    </div>
  );
}



// =========================
// Section
// =========================
function Section({ title, data, variant }: any) {
  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>

        {data.length > 0 && (
          <span className="text-xs text-gray-400">
            {data.length}
          </span>
        )}
      </div>

      {/* Content */}
      {data.length === 0 ? (
        <div className="bg-white border rounded-2xl p-5 text-sm text-gray-400 text-center">
          No reminders
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((c: any) => (
            <Card key={c.id} c={c} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

// =========================
// Card (MOBILE OPTIMIZED)
// =========================
function Card({ c, variant }: any) {
  return (
    <div
      className={`
        rounded-2xl p-5 bg-white shadow-sm
        ${variant === "today" ? "bg-red-50 border border-red-200" : "border border-gray-100"}
      `}
    >
      <div className="space-y-4">

        {/* Name */}
        <div className="text-lg font-semibold text-gray-900 leading-snug">
          {c.name || "No Name"}
        </div>

        {/* Date of Death */}
        <div className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">
            Date of Death:
          </span>{" "}
          {formatDateWithDay(c.death_datetime)}
        </div>

        {/* Prayer */}
        <div className="space-y-1">
          <div className="text-base text-gray-900 leading-relaxed">
            <span className="font-bold text-lg">
              {getPrayerChinese(c.next_prayer_type)}:
            </span>{" "}
            <span className="text-gray-600">
              {c.lunar_month} {c.lunar_day} {c.lunar_day_name}
            </span>
          </div>

          <div className="text-sm text-gray-500 ml-1">
            {formatDateWithDay(c.next_prayer_date)}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t pt-3" />

        {/* Contact */}
        <div className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-800">
            Contact Person:
          </span>{" "}
          {c.contact_name}{" "}
          <span className="text-gray-500">
            ({c.relationship})
          </span>{" "}
          <span className="font-medium">
            {c.contact_phone}
          </span>
        </div>

      </div>
    </div>
  );
}