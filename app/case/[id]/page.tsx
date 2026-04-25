"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { cachedCase, cachedHome } from "@/lib/cache";

export default function CasePage() {
  const router = useRouter();
  const params = useParams();

  const caseUuid = params.id as string;

  const [form, setForm] = useState<any>(() => cachedCase[caseUuid] || null);
  const [originalForm, setOriginalForm] = useState<any>(() => cachedCase[caseUuid] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ FETCH (optimized + cached)
  useEffect(() => {
    if (!caseUuid) return;

    if (cachedCase[caseUuid]) {
      setForm(cachedCase[caseUuid]);
      setOriginalForm(cachedCase[caseUuid]);
      return;
    }

    const fetchCase = async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, case_id, gender, dialect, food, religion, burialtype")
        .eq("id", caseUuid)
        .maybeSingle();

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      if (!data) {
        console.error("No case found:", caseUuid);
        return;
      }

      setForm(data);
      setOriginalForm(data);

      cachedCase[caseUuid] = data;
    };

    fetchCase();
  }, [caseUuid]);

  // ✅ FIELD MAP
  const map = {
    gender: {
      Male: { en: "Male", cn: "男" },
      Female: { en: "Female", cn: "女" },
    },
    religion: {
      Buddhist: { en: "Buddhist", cn: "佛教" },
      Christian: { en: "Christian", cn: "基督教" },
    },
    dialect: {
      Cantonese: { en: "Cantonese", cn: "广东" },
      ZhaoAnn: { en: "Zhao Ann", cn: "诏安" },
      Foochow: { en: "Foochow", cn: "福州" },
      Hokkien: { en: "Hokkien", cn: "福建" },
      Henghua: { en: "Henghua", cn: "兴化" },
      Hakka: { en: "Hakka", cn: "客家" },
      Hainanese: { en: "Hainanese", cn: "海南" },
      Teochew: { en: "Teochew", cn: "潮州" },
    },
    food: {
      Vegetarian: { en: "Vegetarian", cn: "斋" },
      "Non-Vegetarian": { en: "Non-Vegetarian", cn: "荤" },
      None: { en: "None", cn: "无" },
    },
    service: {
      burial: { en: "Burial", cn: "安葬" },
      cremation: { en: "Cremation", cn: "火化" },
    },
  };

  const formatField = (category: any, value: string) => {
    if (!value) return "-";
    const item = (map as any)[category]?.[value];
    return item ? `${item.en} ${item.cn}` : value;
  };

  // ✅ SAVE (optimized)
  const handleUpdate = async () => {
    if (!form) return;

    // 🚀 Optimistic update (instant UI)
    setIsEditing(false);
    setOriginalForm(form);
    cachedCase[caseUuid] = form;

    if (cachedHome?.completed?.case_uuid === caseUuid) {
      cachedHome.completed = {
        ...cachedHome.completed,
        ...form,
      };
    }

    setSaving(true);

    const { error } = await supabase
      .from("cases")
      .update({
        gender: form.gender,
        dialect: form.dialect,
        food: form.food,
        religion: form.religion,
        burialtype: form.burialtype,
      })
      .eq("id", caseUuid);

    setSaving(false);

    if (error) {
      console.error("Save failed:", error);
    }
  };

  // ✅ WHATSAPP
  function formatWhatsAppMessage(form: any) {
    return `🪦 Case No: ${form.case_id}

Gender: ${form.gender}
Religion: ${form.religion}
Dialect: ${form.dialect}
Food: ${form.food}
Service Type: ${(map as any).service?.[form.burialtype]?.en || "-"}

——————————

案件编号：${form.case_id}

性别：${(map as any).gender?.[form.gender]?.cn || ""}
宗教：${(map as any).religion?.[form.religion]?.cn || ""}
籍贯：${(map as any).dialect?.[form.dialect]?.cn || ""}
餐食：${(map as any).food?.[form.food]?.cn || ""}
服务类型：${(map as any).service?.[form.burialtype]?.cn || ""}
`;
  }

  if (!form) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white shadow p-5 rounded-xl">
        <p className="text-sm text-gray-700 font-medium">Case ID 案件编号</p>
        <p className="text-3xl font-bold">{form.case_id}</p>
      </div>

      {/* SUMMARY */}
      <div className="bg-white shadow p-5 rounded-xl space-y-4">

        {/* GENDER */}
        <div>
          <span className="font-semibold">Gender 性别:</span>{" "}
          {isEditing ? (
            <select
              value={form.gender || ""}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="Male">Male 男</option>
              <option value="Female">Female 女</option>
            </select>
          ) : (
            formatField("gender", form.gender)
          )}
        </div>

        {/* DIALECT */}
        <div>
          <span className="font-semibold">Dialect 籍贯:</span>{" "}
          {isEditing ? (
            <select
              value={form.dialect || ""}
              onChange={(e) => setForm({ ...form, dialect: e.target.value })}
            >
              <option value="Cantonese">Cantonese 广东</option>
              <option value="ZhaoAnn">ZhaoAnn 诏安</option>
              <option value="Foochow">Foochow 福州</option>
              <option value="Hokkien">Hokkien 福建</option>
              <option value="Henghua">Henghua 兴化</option>
              <option value="Hakka">Hakka 客家</option>
              <option value="Hainanese">Hainanese 海南</option>
              <option value="Teochew">Teochew 潮州</option>
            </select>
          ) : (
            formatField("dialect", form.dialect)
          )}
        </div>

        {/* FOOD */}
        <div>
          <span className="font-semibold">Food 餐食:</span>{" "}
          {isEditing ? (
            <select
              value={form.food || ""}
              onChange={(e) => setForm({ ...form, food: e.target.value })}
            >
              <option value="Vegetarian">Vegetarian 斋</option>
              <option value="Non-Vegetarian">Non-Vegetarian 荤</option>
              <option value="None">None 无</option>
            </select>
          ) : (
            formatField("food", form.food)
          )}
        </div>

        {/* RELIGION */}
        <div>
          <span className="font-semibold">Religion 宗教:</span>{" "}
          {isEditing ? (
            <select
              value={form.religion || ""}
              onChange={(e) => setForm({ ...form, religion: e.target.value })}
            >
              <option value="Buddhist">Buddhist 佛教</option>
              <option value="Christian">Christian 基督教</option>
            </select>
          ) : (
            formatField("religion", form.religion)
          )}
        </div>

        {/* SERVICE */}
        <div>
          <span className="font-semibold">Service 类型:</span>{" "}
          {isEditing ? (
            <select
              value={form.burialtype || ""}
              onChange={(e) =>
                setForm({ ...form, burialtype: e.target.value })
              }
            >
              <option value="burial">Burial 安葬</option>
              <option value="cremation">Cremation 火化</option>
            </select>
          ) : (
            formatField("service", form.burialtype)
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 flex-wrap">

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit 修改
          </button>
        ) : (
          <>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {saving ? "Saving..." : "Save 保存"}
            </button>

            <button
              onClick={() => {
                setForm(originalForm);
                setIsEditing(false);
              }}
              className="border px-4 py-2 rounded"
            >
              Cancel 取消
            </button>
          </>
        )}

        <button
          onClick={() => {
            const message = formatWhatsAppMessage(form);
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          WhatsApp
        </button>

        {/* 🚀 INSTANT NAVIGATION */}
        <button
  onMouseEnter={() => router.prefetch(`/case/${caseUuid}/edit`)}
  onTouchStart={() => router.prefetch(`/case/${caseUuid}/edit`)}
  onClick={() => {
    if (isEditing) handleUpdate();
    router.push(`/case/${caseUuid}/edit`);
  }}
  className="bg-black text-white px-4 py-2 rounded"
>
  Continue to Obituary
</button>

        <button
          onMouseEnter={() => router.prefetch("/")}
          onTouchStart={() => router.prefetch("/")}
          onClick={() => router.push("/")}
          className="text-sm text-gray-700 underline"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}