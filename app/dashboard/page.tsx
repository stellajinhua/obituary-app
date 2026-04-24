"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateObituaryPDF } from "@/services/obituaryPdf";

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    setRecords(data || []);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* 🔹 TOP ACTIONS */}
      <div className="flex gap-4">
        <button className="bg-black text-white px-4 py-2 rounded">
          + New Case
        </button>
      </div>

      {/* 🔹 RECORD LIST */}
      <div className="space-y-3">
        {records.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{item.name_cn || "No Name"}</p>
              <p className="text-sm text-gray-500">
                {item.funeral_datetime}
              </p>
            </div>

            <div className="flex gap-2">
              <button className="text-sm px-3 py-1 border rounded">
                Edit
              </button>
              <button
                onClick={() => generateObituaryPDF(item)}
                className="text-sm px-3 py-1 bg-black text-white rounded"
                    >
                  PDF
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}