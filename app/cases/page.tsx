"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatDateWithDay } from "@/lib/date";

export default function AllCasesPage() {
const router = useRouter();
const [list, setList] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
load();
}, []);

async function load() {
setLoading(true);


// 1️⃣ Get all cases
const { data: cases } = await supabase
  .from("cases")
  .select("id, case_id, created_at")
  .order("created_at", { ascending: false });

if (!cases) {
  setList([]);
  setLoading(false);
  return;
}

// 2️⃣ Get obituaries (for names)
const ids = cases.map(c => c.id);

const { data: obs } = await supabase
  .from("obituaries")
  .select("case_uuid, name_cn, death_datetime")
  .in("case_uuid", ids);

const obMap = new Map();
(obs || []).forEach((o: any) => {
  obMap.set(o.case_uuid, o);
});

// 3️⃣ Merge
const merged = cases.map(c => ({
  ...c,
  name: obMap.get(c.id)?.name_cn || null,
  death_datetime: obMap.get(c.id)?.death_datetime || null,
}));

setList(merged);
setLoading(false);


}

return ( <div className="min-h-screen bg-gray-50">

  {/* HEADER */}
  <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3">
    <button
      onClick={() => router.push("/")}
      className="text-sm text-gray-700"
    >
      ← Home
    </button>

    <h1 className="text-lg font-semibold">
      All Cases
    </h1>
  </div>

  {/* CONTENT */}
  <div className="px-4 py-6 space-y-4">

    {loading ? (
      <div className="text-center text-sm text-gray-400">
        Loading...
      </div>
    ) : list.length === 0 ? (
      <div className="bg-white border rounded-2xl p-5 text-sm text-gray-400 text-center">
        No cases found
      </div>
    ) : (
      list.map((c) => (
  <div
  key={c.id}
  onClick={() => router.push(`/case/${c.id}`)}
  className="bg-white border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition"
>
  <div className="space-y-3">

    {/* NAME */}
    <div className="text-lg font-semibold text-gray-900 leading-snug">
      {c.name || "No Name"}
    </div>

    {/* DATE */}
    <div className="space-y-1">
      <div className="text-xs text-gray-400">
        Date of Death
      </div>

      <div className="text-sm text-gray-600">
        {c.death_datetime
          ? formatDateWithDay(c.death_datetime)
          : "-"}
      </div>
    </div>

    {/* CASE ID */}
    <div className="text-sm text-gray-500">
      Case #{c.case_id}
    </div>

  </div>
</div>
      ))
    )}

  </div>
</div>


);
}
