"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/lib/date";
import Card from "@/components/Card";
import { cachedHome } from "@/lib/cache";


export default function Home() {
  const router = useRouter();

  const [incomplete, setIncomplete] = useState<any>(null);
  const [completed, setCompleted] = useState<any>(null);

useEffect(() => {
  if (cachedHome.completed !== undefined) {
    setIncomplete(cachedHome.incomplete);
    setCompleted(cachedHome.completed);
    return;
  }

  const fetchData = async () => {
      // ✅ Cases
// 1️⃣ Get latest 5 cases
const { data: cases } = await supabase
  .from("cases")
  .select("id, case_id")
  .order("case_id", { ascending: false })
  .limit(5);

// 2️⃣ For these 5, check which ones already have obituary
const ids = (cases || []).map(c => c.id);

const { data: usedRows } = await supabase
  .from("obituaries")
  .select("case_uuid")
  .in("case_uuid", ids);

const used = new Set((usedRows || []).map((o: any) => o.case_uuid));

// 3️⃣ Find first unused
const latestIncomplete = cases?.find((c) => !used.has(c.id));
setIncomplete(latestIncomplete || null);

const { data: latestObituary } = await supabase
  .from("obituaries")
  .select("name_cn, name_ic, case_id, case_uuid, death_datetime")
  .order("case_id", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!latestObituary) {
  setCompleted(null);

cachedHome.incomplete = latestIncomplete;
cachedHome.completed = null;

  return;
}

const { data: caseData } = await supabase
  .from("cases")
  .select("religion")
  .eq("id", latestObituary.case_uuid)
  .maybeSingle();

setCompleted({
  ...latestObituary,
  religion: caseData?.religion || null,
});


cachedHome.incomplete = latestIncomplete;
cachedHome.completed = {
  ...latestObituary,
  religion: caseData?.religion || null,
};

    };
    fetchData();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">



      {/* 🔝 Header */}






      <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          Funeral Control Center
        </h1>
      </div>



      <div className="flex justify-end p-4">
  <button
    onClick={async () => {
      await fetch("/api/logout", { method: "POST" })
      window.location.href = "/login"
    }}
    className="bg-gray-100 px-3 py-1 rounded-md text-sm hover:bg-gray-200"
  >
    Logout
  </button>
</div>


      {/* Content */}
      <div className="px-4 py-6 space-y-8">

        {/* ➕ Create Case */}
        <button
          onClick={() => router.push("/create")}
          className="w-full bg-black text-white py-4 rounded-2xl text-base font-medium"
        >
          + Create New Case
        </button>

        {/* 🟡 Continue Case */}
{incomplete && (
  <div className="space-y-2">

<div className="text-sm font-semibold text-gray-900 px-1">
  Continue Case
</div>

    <Card>
      <div className="text-lg font-semibold text-gray-900">
        Case #{incomplete.case_id}
      </div>

      <button
        onClick={() =>
          router.push(`/case/${incomplete.id}`)
        }
        className="w-full bg-gray-900 text-white py-4 rounded-xl text-base font-medium"
      >
        Continue
      </button>
    </Card>

  </div>
)}

{/* 🟢 Completed Case */}
{completed && (
  <div className="space-y-2">

    {/* Section Label */}
<div className="text-sm font-semibold text-gray-900 px-1">
  Latest Completed Case
</div>

    <Card>

      {/* Name */}
      <div className="text-lg font-semibold text-gray-900">
        {completed.name_cn || "No Name"}
      </div>

      {/* Date of Death */}
      <div className="space-y-1">
        <div className="text-base font-semibold text-gray-900">
         {completed?.death_datetime
            ? formatDate(completed.death_datetime)
           : "No date"}
        </div>

        <div className="text-xs text-gray-400">
          Date of Death
        </div>
      </div>

      {/* Case ID */}
      <div className="text-sm text-gray-500">
        Case #{completed.case_id}
      </div>

      {/* Divider */}
      <div className="border-t pt-2" />

      {/* Buttons */}
      <div className="space-y-2">

        <button
          onClick={() =>
            router.push(`/case/${completed.case_uuid}`)
          }
          className="w-full border py-4 rounded-xl text-base font-medium"
        >
          Open Case
        </button>

        {completed?.religion === "Buddhist" && (
          <button
            onClick={() =>
              router.push(`/case/${completed.case_uuid}/prayer`)
            }
            className="w-full bg-black text-white py-4 rounded-xl text-base font-medium"
          >
            Prayer Schedule
          </button>
        )}

      </div>

    </Card>

  </div>
)}

{/* 🔵 Operations */}
<div className="space-y-2">

  {/* Section Label */}
<div className="text-sm font-semibold text-gray-900 px-1">
  Operations
</div>

  <Card>

    <button
      onClick={() => router.push("/reminder")}
      className="w-full bg-black text-white py-4 rounded-xl text-base font-medium"
    >
      View Upcoming Prayers
    </button>

    <button
      onClick={() => router.push("/active-cases")}
      className="w-full border py-4 rounded-xl text-base font-medium"
    >
      Active Cases (100 Days)
    </button>

    <button
  onClick={() => router.push("/cases")}
  className="w-full border py-4 rounded-xl text-base font-medium"
>
  View All Cases
</button>
  </Card>

</div>

{/* ❗ Empty State */}
{!incomplete && !completed && (
  <div className="space-y-2">
    <Card>
      <div className="text-center text-sm text-gray-400">
        No cases yet
      </div>
    </Card>
  </div>
)}

      </div>
    </div>
  );
}