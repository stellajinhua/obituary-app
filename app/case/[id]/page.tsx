"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CasePage() {
  const router = useRouter();
  const params = useParams();

  const caseUuid = params.id as string;

  const [form, setForm] = useState<any>(null);
  const [originalForm, setOriginalForm] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ FETCH
 useEffect(() => {
  const fetchCase = async () => {
    let query = supabase.from("cases").select("*");

    if (caseUuid.includes("-") && caseUuid.length > 20) {
      query = query.eq("id", caseUuid);
    } else {
      query = query.eq("case_id", caseUuid);
    }

    const { data, error } = await query.maybeSingle();

    console.log("FETCH RESULT:", data);
    console.log("LOOKING FOR:", caseUuid);

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    if (!data) {
      console.error("No case found for:", caseUuid);
      return;
    }

    setForm(data);
    setOriginalForm(data);
  };

  if (caseUuid) fetchCase();
}, [caseUuid]);

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
      ZhaoAnn: {en: "Zhao Ann", cn: "诏安"},
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
    const item = map[category][value];
    if (!item) return value;
    return `${item.en} ${item.cn}`;
  };

  // ✅ SAVE
  const handleUpdate = async () => {
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

    if (!error) {
      setIsEditing(false);
      setOriginalForm(form);
    }
  };

  // ✅ WHATSAPP (RESTORED)
  function formatWhatsAppMessage(form: any) {
    return `🪦 Case No: ${form.case_id}

Gender: ${form.gender}
Religion: ${form.religion}
Dialect: ${form.dialect}
Food: ${form.food}
Service Type: ${map.service[form.burialtype]?.en || "-"}

——————————

案件编号：${form.case_id}

性别：${map.gender[form.gender]?.cn || ""}
宗教：${map.religion[form.religion]?.cn || ""}
籍贯：${map.dialect[form.dialect]?.cn || ""}
餐食：${map.food[form.food]?.cn || ""}
服务类型：${map.service[form.burialtype]?.cn || ""}
`;
  }


if (!form) return <div className="p-6">Loading...</div>;

const isChristian = form.religion === "Christian";
const caseId = form.case_id;
const religion = (form.religion || "").toLowerCase().trim();


  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-white shadow p-5 rounded-xl">
        <p className="text-sm text-gray-500">Case ID 案件编号</p>
        <p className="text-3xl font-bold">{form.case_id}</p>
      </div>

      {/* SUMMARY */}
      <div className="bg-white shadow p-5 rounded-xl space-y-4">

        {/* GENDER */}
        <div>
          <strong>Gender 性别:</strong>{" "}
          {isEditing ? (
            <select
              value={form.gender || ""}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value })
              }
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
          <strong>Dialect 籍贯:</strong>{" "}
          {isEditing ? (
            <select
              value={form.dialect || ""}
              onChange={(e) =>
                setForm({ ...form, dialect: e.target.value })
              }
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
          <strong>Food 餐食:</strong>{" "}
          {isEditing ? (
            <select
              value={form.food || ""}
              onChange={(e) =>
                setForm({ ...form, food: e.target.value })
              }
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
          <strong>Religion 宗教:</strong>{" "}
          {isEditing ? (
            <select
              value={form.religion || ""}
              onChange={(e) =>
                setForm({ ...form, religion: e.target.value })
              }
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
          <strong>Service 类型:</strong>{" "}
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
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save 保存
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

        {/* ✅ WHATSAPP BACK */}
        <button
          onClick={() => {
            const message = formatWhatsAppMessage(form);
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          WhatsApp
        </button>

        {/* CONTINUE */}
        <button
          onClick={async () => {
            if (isEditing) await handleUpdate();
            router.push(`/case/${caseUuid}/edit`);
          }}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Continue to Obituary
        </button>

        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 underline"
        >
          ← Back
        </button>

      </div>
    </div>
  );
}