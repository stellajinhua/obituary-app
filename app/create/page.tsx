"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import NewCaseForm from "@/components/NewCaseForm";

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: correct casing + include all fields
  const [form, setForm] = useState({
    gender: "",
    dialect: "",
    food: "",
    religion: "",
    burialtype: "", // 🔥 must be lowercase or empty
    burial_place: "",
    cremation_place: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      // ✅ auto-clear opposite field
      if (name === "burialtype") {
        if (value === "Burial") {
          updated.cremation_place = "";
        } else if (value === "Cremation") {
          updated.burial_place = "";
        }
      }

      return updated;
    });
  };

  const generateCaseId = async () => {
    const now = new Date();

    const prefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const { data } = await supabase
      .from("cases")
      .select("case_id")
      .ilike("case_id", `${prefix}-%`)
      .order("case_id", { ascending: false })
      .limit(1);

    let next = 1;

    if (data && data.length > 0) {
      const last = data[0].case_id;
      next = parseInt(last.split("-")[2]) + 1;
    }

    return `${prefix}-${String(next).padStart(3, "0")}`;
  };

  const handleCreate = async () => {
    setLoading(true);

    const case_id = await generateCaseId();

    const payload = {
      ...form,
      case_id,

      // ✅ ensure proper saving
      burialtype: form.burialtype || null,
      burial_place: form.burial_place || null,
      cremation_place: form.cremation_place || null,
    };

    console.log("Creating case:", payload); // 🔍 DEBUG

    const { data, error } = await supabase
      .from("cases")
      .insert([payload])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.log("Insert error:", error.message);
      return;
    }

   router.push(`/case/${data.id}`); 
  };

  return (
    <NewCaseForm
      form={form}
      handleChange={handleChange}
      handleCreate={handleCreate}
      loading={loading}
    />
  );
}