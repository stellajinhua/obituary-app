"use client";


import { supabase } from "@/lib/supabaseClient";
import { pdf } from "@react-pdf/renderer";
import ObituaryPDF from "@/components/ObituaryPDF";
import { useCallback, useState } from "react";
import solarlunar from "solarlunar";
import ChristianPDF from "./ChristianObituaryPDF";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRef } from "react";


function getTemplate(data: any) {
  const religion = (data.religion || "").toLowerCase().trim();

  if (religion === "christian") return ChristianPDF;

  return ObituaryPDF; // ✅ always fallback
}

function transformCaseData(form: any, case_id: string, case_uuid: string) {
  const religion = (form.religion || "").toLowerCase().trim();

  return {
    // ✅ core
    case_id,
    case_uuid,

    name_cn: form.name_cn || null,
    name_ic: form.name_ic || null,
    age: form.age || null,
    //gender: form.gender || null,
   // dialect: form.dialect || null,
   // food: form.food || null,
    burialtype: form.burialtype || null,

    // ✅ dates
    death_datetime: form.death_datetime || null,
    funeral_datetime: form.funeral_datetime || null,
    encoffin_date: form.encoffin_date || null,
    encoffin_start: form.encoffin_start || null,
    encoffin_end: form.encoffin_end || null,
    family_date: form.family_date || null,
    family_time: form.family_time || null,

    // ✅ lunar
    death_lunar_date: form.death_lunar_date || null,
    death_lunar_day: form.death_lunar_day || null,
    funeral_lunar_date: form.funeral_lunar_date || null,
    funeral_lunar_day: form.funeral_lunar_day || null,

    // ✅ venue
    venue_location_id:
      form.venue_type === "home"
        ? null
        : form.venue_location_id || null,

    venue_full:
      form.venue_type === "parlour"
        ? null
        : form.venue_full || null,

    // ✅ burial / cremation
    burial_place:
      form.burialtype === "cremation"
        ? null
        : form.burial_place_select === "others"
        ? form.burial_place_custom || null
        : form.burial_place_select || null,

    cremation_place:
      form.burialtype === "burial"
        ? null
        : form.cremation_place || null,


    zodiaclist:
      religion === "christian"
        ? []
        : Array.isArray(form.zodiaclist)
        ? form.zodiaclist
        : [],

    birth_year: religion === "christian" ? form.birth_year || null : null,
    memorial_service_date:
      religion === "christian"
        ? form.memorial_service_date || null
        : null,
    memorial_service_time:
      religion === "christian"
        ? form.memorial_service_time || null
        : null,

    // ✅ image
    image_url:
      typeof form.image_url === "string" &&
      form.image_url.startsWith("http")
        ? form.image_url
        : null,
  };  
}

function buildObituaryData(form: any, case_id: string, case_uuid: string) {
  const base = transformCaseData(form, case_id, case_uuid);

  return {
    ...base,
    religion: form.religion,
    venue_type: form.venue_type,
    venue_full:
      form.venue_type === "home"
        ? form.venue_full || ""
        : "",
    venue_en: form.custom_venue_en || "",
    venue_cn: form.custom_venue_cn || "",
  };
}


export default function ObituaryForm(props: any) {
    
  const { initialData } = props;

  const router = useRouter();

  const [form, setForm] = useState<any>({
    // defaults
    burial_place_select: "",
    burial_place_custom: "",
    zodiaclist: [{ zodiac: "", ages: [""] }],

    // load saved data
    ...(props.initialData || {}),

    // enforce
    case_uuid: props.caseId, // ✅ correct
    religion: initialData?.religion || props.religion,
    burialtype: props.burialtype || "",
  });

  // ✅ MOVE HERE
// ✅ INITIAL LOAD (from DB)
useEffect(() => {
  if (initialData) {
    let updated: any = {
      ...(initialData || {}),
      religion: initialData?.religion || props.religion, // ✅ FIXED
    };

    // ✅ Christian cleanup on load
    if ((updated.religion || "").toLowerCase().trim() === "christian") {
      updated.zodiaclist = [];
    }

    // ✅ reconstruct burial dropdown
    if (initialData.burial_place) {
      const predefined = [
        "古晉老路十四哩客属義山之原 14th Mile Hakka Cemetery",
      ];

      if (predefined.includes(initialData.burial_place)) {
        updated.burial_place_select = initialData.burial_place;
      } else {
        updated.burial_place_select = "others";
        updated.burial_place_custom = initialData.burial_place;
      }
    }

    // ✅ reconstruct venue_type
    if (initialData.venue_location_id) {
      updated.venue_type = "parlour";
    } else if (initialData.venue_full) {
      updated.venue_type = "home";
    }

    setForm((prev: any) => ({
      ...prev,
      ...updated,
    }));
  }
}, [initialData]);


// ✅ LIVE RELIGION REACTION (user changes dropdown)
useEffect(() => {
  const religion = (form.religion || "").toLowerCase().trim();

  if (religion === "christian" && form.zodiaclist?.length) {
    setForm((prev: any) => ({ ...prev, zodiaclist: [] }));
  }

  if (religion !== "christian" && form.birth_year) {
    setForm((prev: any) => ({
      ...prev,
      birth_year: null,
      memorial_service_date: null,
      memorial_service_time: null,
    }));
  }
}, [form.religion]);

const [previewUrl, setPreviewUrl] = useState("");
const [previewData, setPreviewData] = useState<any>(null);
const previewRef = useRef<HTMLDivElement | null>(null);


const handleImageChange = async (e: any) => {
  const file = e.target.files?.[0];

if (!file || !file.type.startsWith("image/")){
  alert("please upload an image");
  return;
}
   console.log("FILE:", file);


  // unique filename
  const fileName = `${props.caseId}-${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from("obituary_images")
    .upload(fileName, file);

    console.log("UPLOAD RESULT:", data, error);

  if (error) {
    console.error("Upload error:", error);
    return;
  }

  // get public URL
  const { data: publicUrlData } = supabase.storage
    .from("obituary_images")
    .getPublicUrl(fileName);

     console.log("PUBLIC URL:", publicUrlData);

  const imageUrl = publicUrlData.publicUrl;

  // save into form
  setForm((prev: any) => ({
    ...prev,
    image_url: imageUrl,
  }));

  console.log("Uploaded image:", imageUrl);
};

const zodiacs = [
  "鼠", "牛", "虎", "兔", "龙", "蛇",
  "马", "羊", "猴", "鸡", "狗", "猪"
];

const { parlours = [] } = props;

const religion = (form.religion || "").toLowerCase().trim();
const isChristian = religion === "christian";

const toLocalDateTime = (d: Date) => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toLocalDate = (d: Date) => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

const formatTime = (d: Date) => {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatWeekday = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const days = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  return days[d.getDay()];
};

const formatLunar = (dateStr: string) => {
  if (!dateStr) return "";

  try {
    const d = new Date(dateStr + "T00:00:00");

    if (isNaN(d.getTime())) return "";

    const lunar = solarlunar.solar2lunar(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );

    return `農曆${lunar.gzYear}年${lunar.monthCn}${lunar.dayCn}日`;
  } catch {
    return "";
  }
};

const buildFuneralFlow = (deathStr: string) => {
  if (!deathStr) return {};

  const death = new Date(deathStr + "T00:00:00");
  if (isNaN(death.getTime())) return {};


  const funeral = new Date(death);
  funeral.setDate(funeral.getDate() + 2);

  const end = new Date(funeral);
  end.setHours(end.getHours() + 1);

  const funeralStr = toLocalDateTime(funeral);

  return {
    funeral_datetime: funeralStr,
    encoffin_date: toLocalDate(funeral),
    encoffin_start: formatTime(funeral),
    encoffin_end: formatTime(end),
    family_date: toLocalDate(funeral),
    family_time: formatTime(funeral),
    death_lunar_date: formatLunar(deathStr),
    death_lunar_day: formatWeekday(deathStr),
    funeral_lunar_date: formatLunar(funeralStr),
    funeral_lunar_day: formatWeekday(funeralStr),
  };
};

const handleChange = useCallback((e: any) => {
  const { name, value } = e.target;

  setForm((prev: any) => {
    let updated = { ...prev };

    // normalize death_datetime
    if (name === "death_datetime") {
      updated[name] = value ? `${value}T00:00:00` : "";
    } else {
      updated[name] = value;
    }

    // auto encoffin end (+1 hour)
    if (name === "encoffin_start" && value && value.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      const base = new Date();
      base.setHours(h, m, 0);

      const end = new Date(base);
      end.setHours(end.getHours() + 1);

      updated.encoffin_end = formatTime(end);
    }

    // death → auto flow
    if (name === "death_datetime" && value) {
      const auto = buildFuneralFlow(updated[name]);

      Object.keys(auto).forEach((key) => {
        const k = key as keyof typeof auto;

        if ((updated as any)[k] == null || (updated as any)[k] === "") {
          (updated as any)[k] = auto[k];
        }
      });
    }

    // manual funeral update
    if (name === "funeral_datetime" && value) {
      updated.funeral_lunar_date = formatLunar(value);
      updated.funeral_lunar_day = formatWeekday(value);

      const funeral = new Date(value);
      updated.family_date = toLocalDate(funeral);
      updated.family_time = formatTime(funeral);
    }

    return updated;
  });
}, []);

const [submitted, setSubmitted] = useState(false);

// =========================
// ✅ 3. AUTO SCROLL (ADD THIS)
// =========================
const addZodiac = () => {
  setForm((prev: any) => ({
    ...prev,
    zodiaclist: [
      ...(prev.zodiaclist || []),
      { zodiac: "", ages: [""] },
    ],
  }));

  // 🔥 auto scroll
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, 100);
};

const updateZodiac = (index: number, value: string) => {
  setForm((prev: any) => {
    const list = [...(prev.zodiaclist || [])];

    const current = list[index];

    list[index] = {
      ...current,
      zodiac: value,
    };

    return { ...prev, zodiaclist: list };
  });
};

function formatZodiacList(zodiaclist: any = [], mode = "full") {
  if (!Array.isArray(zodiaclist) || zodiaclist.length === 0) return [];

  const grouped: Record<string, string[]> = {};

  for (const item of zodiaclist) {
    const animal = item?.zodiac;
    const ages = item?.ages || [];

    if (!animal || ages.length === 0) continue;

    if (!grouped[animal]) {
      grouped[animal] = [];
    }

    grouped[animal].push(...ages.filter(Boolean));
  }

  return Object.entries(grouped).map(([animal, ages]) => {
    if (mode === "short") {
      return `${animal}${ages.join(",")}`;
    }
    return `${animal} (${ages.join(", ")})`;
  });
}

const addAge = (index: number) => {
  setForm((prev: any) => {
    const list = [...(prev.zodiaclist || [])];
    const current = list[index];

    list[index] = {
      ...current,
      ages: [...(current.ages || []), ""],
    };

    return { ...prev, zodiaclist: list };
  });
};

const updateAge = (zIndex: number, aIndex: number, value: string) => {
  setForm((prev: any) => {
    const list = [...(prev.zodiaclist || [])];

    const current = list[zIndex];

    const newAges = [...(current.ages || [])];
    newAges[aIndex] = value;

    list[zIndex] = {
      ...current,
      ages: newAges,
    };

    return { ...prev, zodiaclist: list };
  });
};

const removeage = (zIndex: number, aIndex: number) => {
  setForm((prev: any) => ({
    ...prev,
    zodiaclist: prev.zodiaclist.map((z: any, i: number) =>
      i === zIndex
        ? {
            ...z,
            ages: z.ages.filter((_: any, idx: number) => idx !== aIndex),
          }
        : z
    ),
  }));
};

const handleSubmit = async () => {
  setSubmitted(true);

  try {
    // 1. Get case_id
    const casePromise = form.case_id
      ? Promise.resolve({ case_id: form.case_id })
      : supabase
          .from("cases")
          .select("case_id")
          .eq("id", props.caseId)
          .maybeSingle();
let case_id = form.case_id;

if (!case_id) {
  const { data, error } = await supabase
    .from("cases")
    .select("case_id")
    .eq("id", props.caseId)
    .maybeSingle();

  if (error) throw error;

  case_id = data?.case_id;
}

    // 2. Save
    const dataToSave = transformCaseData(form, case_id, props.caseId);

    const { error } = await supabase
      .from("obituaries")
      .upsert(dataToSave, { onConflict: "case_uuid" });

    if (error) throw error;

    // 3. Build preview
    const builtPreviewData = buildObituaryData(form, case_id, props.caseId);

    // 4. Venue enrichment
    if (form.venue_type === "parlour") {
      const id = form.venue_location_id;

      if (id) {
        const p = parlours.find((x: any) => x.id === id);
        builtPreviewData.venue_en = p?.name_en || "";
        builtPreviewData.venue_cn = p?.name_cn || "";
      } else {
        builtPreviewData.venue_en = form.custom_venue_en || "";
        builtPreviewData.venue_cn = form.custom_venue_cn || "";
      }

      builtPreviewData.venue_full =
        `${builtPreviewData.venue_cn} ${builtPreviewData.venue_en}`.trim();
    }

    if (form.venue_type === "home") {
      builtPreviewData.venue_full = form.venue_full || "";
      builtPreviewData.venue_cn = form.venue_full || "";
    }

    // 5. Generate PDF (non-blocking feel)
    setTimeout(async () => {
      try {
        const Component = getTemplate(builtPreviewData);
        const element = <Component data={builtPreviewData} />;

        const blob = await pdf(element).toBlob();
        const url = URL.createObjectURL(blob);

        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        setPreviewData(builtPreviewData);

        previewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

      } catch (err) {
        console.error("PDF error:", err);
      } finally {
        setSubmitted(false);
      }
    }, 50);

  } catch (err: any) {
    console.error("Submit error:", err);
    setSubmitted(false);
  }
};

  return (
    // 👉 PASTE YOUR BIG JSX HERE
    
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8 pb-32">
        <h1 className="text-3xl font-bold text-center">Obituary Form</h1>

        {/* IMAGE UPLOAD */}
        <Section title="Image Upload">

<label className="block border p-3 active:bg-gray-100 rounded-lg text-center cursor-pointer">

  Upload Image
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
  />
</label>

           {/* ✅ SHOW EXISTING IMAGE */}
        {form.image_url && (
  <div style={{ marginTop: 10 }}>
    <img
      src={form.image_url}
      onError={(e) => (e.currentTarget.style.display = "none")}
      alt="preview"
      style={{
        width: 120,
        height: 150,
        objectFit: "cover",
        border: "1px solid #000",
      }}
    />
  </div>
  )}

        </Section>

        {/* Deceased */}
        <Section title="Deceased Details">
  <Input name="name_cn" placeholder="Name in Chinese" value={form.name_cn || ""} onChange={handleChange} />
  <Input name="name_ic" placeholder="Name Follow IC" value={form.name_ic || ""} onChange={handleChange} />
  <Input name="age" placeholder="Age" value={form.age || ""} onChange={handleChange} />

  {religion === "christian" && (
    <div className="border-t pt-4 space-y-4">

      <h3 className="font-medium text-gray-700">Christian Details</h3>

      <div>
        <label className="text-sm font-medium mb-1 block">Year of Birth</label>
        <Input
          name="birth_year"
          placeholder="e.g. 1950"
          value={form.birth_year || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Memorial Service Date</label>
        <input
          type="date"
          name="memorial_service_date"
          value={form.memorial_service_date || ""}
          onChange={handleChange}
          className={dateClass}
           style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Memorial Service Time</label>
        <input
          type="time"
          name="memorial_service_time"
          value={form.memorial_service_time || ""}
          onChange={handleChange}
          className={dateClass}
          style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
        />
      </div>

    </div>
  )}
</Section>

{/* Death */}
<Section title="Death Details">

  <input
    type="date"
    name="death_datetime"
    value={
  form?.death_datetime
    ? form.death_datetime.slice(0, 10)
    : ""}
    onChange={handleChange}
    className={dateClass}
   style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
  />

  <div className="px-3 py-2 bg-gray-100 rounded-lg w-full">
    {form.death_lunar_date}
  </div>

  <div className="px-3 py-2 bg-gray-100 rounded-lg w-full">
    {form.death_lunar_day}
  </div>

</Section>


        {/* Funeral */}
        <Section title="Funeral Details">
          <input type="datetime-local" name="funeral_datetime" value={
  form?.funeral_datetime
    ? form.funeral_datetime.slice(0, 16)
    : ""
} onChange={handleChange} className={dateClass}
   style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }} />
          <div className="px-3 py-2 bg-gray-100 rounded-lg w-full">
            {form.funeral_lunar_date}
          </div>
          <div className="px-3 py-2 bg-gray-100 rounded-lg w-full">
            {form.funeral_lunar_day}
          </div> 
        </Section>

        {/* Encoffin */}
 <Section title="Encoffin Details">

  <input
    type="date"
    name="encoffin_date"
    value={form.encoffin_date || ""}
    onChange={handleChange}
    className={dateClass}
   style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
  />

<div className="flex flex-col md:flex-row gap-3 w-full">
  <input
    type="time"
    name="encoffin_start"
    value={form.encoffin_start || ""}
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 w-full"
  />

  <input
    type="time"
    name="encoffin_end"
    value={form.encoffin_end || ""}
    readOnly
   className="border rounded-lg px-3 py-2 w-full bg-gray-100"
  />
</div>
</Section>

        {/* Family */}
<Section title="Family Assembly">

  <input
    type="date"
    name="family_date"
    value={form.family_date || ""}
    onChange={handleChange}
    className={dateClass}
   style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
  />

  <input
    type="time"
    name="family_time"
    value={form.family_time || ""}
    onChange={handleChange}
    className={dateClass}
   style={{ WebkitAppearance: "none", width: "100%", minWidth: 0 }}
  />

  <div className="flex flex-col gap-3">

    {/* VENUE TYPE */}
    <select
      value={form.venue_type || ""}
      onChange={(e) => {
        const value = e.target.value;
        setForm((prev: any) => ({
          ...prev,
          venue_type: value,
          venue_location_id: null,
          custom_venue_en: "",
          custom_venue_cn: "",
          venue_full: "",
        }));
      }}
      className="border rounded-lg px-3 py-2 w-full"
    >
      <option value="">Select Venue</option>
      <option value="home">Home</option>
      <option value="parlour">Funeral Parlour</option>
    </select>

    {/* PARLOUR */}
    {form.venue_type === "parlour" && (
      <select
        value={
          form.custom_venue_en
            ? "others"
            : form.venue_location_id || ""
        }
        onChange={(e) => {
          const value = e.target.value;

          if (value === "others") {
            handleChange({
              target: { name: "venue_location_id", value: null },
            });
          } else {
            handleChange({
              target: { name: "venue_location_id", value: String(value) },
            });
          }
        }}
        className="border rounded-lg px-3 py-2 w-full"
      >
        <option value="">Select Funeral Parlour</option>

        {parlours.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name_en} {p.name_cn}
          </option>
        ))}

        <option value="others">Others (其他)</option>
      </select>
    )}

    {/* OTHERS */}
    {form.venue_type === "parlour" && !form.venue_location_id && (
      <div className="flex flex-col gap-3">
        <input
          placeholder="English Name"
          value={form.custom_venue_en || ""}
          onChange={(e) =>
            handleChange({
              target: { name: "custom_venue_en", value: e.target.value },
            })
          }
          className="border rounded-lg px-3 py-2 w-full"
        />

        <input
          placeholder="Chinese Name"
          value={form.custom_venue_cn || ""}
          onChange={(e) =>
            handleChange({
              target: { name: "custom_venue_cn", value: e.target.value },
            })
          }
          className="border rounded-lg px-3 py-2 w-full"
        />
      </div>
    )}

    {/* HOME */}
    {form.venue_type === "home" && (
      <textarea
        name="venue_full"
        value={form.venue_full || ""}
        onChange={handleChange}
        placeholder="Enter home address"
        className="border rounded-lg px-3 py-2 w-full min-h-[80px]"
      />
    )}

  </div>

</Section>



{!isChristian && (
  <Section title="Contradictory Zodiac">

    {(form.zodiaclist || []).map((z: any, index: number) => (
      <div
        key={index}
        className="border rounded-xl p-4 space-y-3 bg-gray-50"
      >
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row gap-2">
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={z.zodiac || ""}
            onChange={(e) => updateZodiac(index, e.target.value)}
          >
            <option value="">Select Zodiac</option>
            {zodiacs.map((o: any) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              const updated = [...form.zodiaclist];
              updated.splice(index, 1);
              setForm({ ...form, zodiaclist: updated });
            }}
            className="text-red-500 text-sm px-3 py-2 self-end hover:underline"
          >
            Remove
          </button>
        </div>

        {/* Ages */}
        <div className="flex flex-col gap-2">
          {(z.ages || []).map((age: any, aIndex: number) => (
            <div key={aIndex} className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="Age"
                value={age || ""}
                onChange={(e) =>
                  updateAge(index, aIndex, e.target.value)
                }
              />

              <button
                type="button"
                onClick={() => removeage(index, aIndex)}
                className="text-red-500 px-3"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addAge(index)}
          className="text-blue-600 text-sm px-3 py-2 self-start hover:underline"
        >
          + Add Age
        </button>
      </div>
    ))}

    {/* ADD ZODIAC BUTTON */}
    <button
      type="button"
      onClick={addZodiac}
      className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] transition"
    >
      + Add Zodiac
    </button>

  </Section>
)}

<Section title="Burial / Cremation">

  {/* Step 1: Type Selection */}
  <select
    name="burialtype"
    value={form.burialtype || ""}
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 w-full"
  >
    <option value="">Select Type</option>
    <option value="burial">Burial</option>
    <option value="cremation">Cremation</option>
  </select>

  {/* ================= BURIAL ================= */}
  {form.burialtype === "burial" && (
    <div className="w-full">

<select
  name="burial_place_select"
  value={form.burial_place_select || ""}
  onChange={handleChange}
  className="border rounded-lg px-3 py-2 w-full"
>
        <option value="">Select Burial Place</option>

        <option value="古晉老路十四哩客属義山之原 14th Mile Hakka Cemetery">
          古晉老路十四哩客属義山之原 14th Mile Hakka Cemetery
        </option>

        <option value="others">Others</option>
      </select>

      {form.burial_place_select === "others" && (
<input
  name="burial_place_custom"
  placeholder="Enter burial place"
  value={form.burial_place_custom || ""}
  onChange={handleChange}
  className="border rounded-lg px-3 py-2 w-full mt-2"
/>
      )}
    </div>
  )}

  {/* ================= CREMATION ================= */}
  {form.burialtype === "cremation" && (
    <div className="w-full">
<select
  name="cremation_place"
  value={form.cremation_place || ""}
  onChange={handleChange}
  className="border rounded-lg px-3 py-2 w-full"
>
        <option value="">Select Cremation Place</option>

        <option value="佛教新村火化中心 KBS Buddhist Village">
          佛教新村火化中心 KBS Buddhist Village
        </option>

        <option value="富贵山荘聚寶堂火化中心 Nirvana Treasure Hall Crematorium">
          富贵山荘聚寶堂火化中心 Nirvana Treasure Hall Crematorium
        </option>
      </select>
    </div>
  )}

{previewUrl && (
  <div ref={previewRef} className="mt-6">
    <h2 className="text-lg font-semibold mb-2">Preview</h2>

    <iframe
      src={previewUrl}
      className="w-full h-[70vh] border rounded-xl"
    />
  </div>
)}

        </Section>
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t pt-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">

          <button 
            onClick={handleSubmit} 
            disabled={submitted} 
            className={`w-full py-4 rounded-xl text-lg text-white ${
              submitted ? "bg-gray-400" : "bg-black"
            }`}
          >
            {submitted ? "Generating PDF..." : "Save & Preview"}
          </button>

          <button
            onClick={() => {
              const confirmLeave = confirm("Discard changes and return to Control Center?");
              if (confirmLeave) router.push("/");
            }}
            className="w-full py-3 rounded-xl border"
          >
            Cancel / Back to Control Center
          </button>

          {previewData && previewUrl && (
            <button
              onClick={() => {
                const a = document.createElement("a");

                const safeName = `${previewData?.name_cn || "obituary"}讣告`
                  .trim()
                  .replace(/[\\/:*?"<>|]/g, "");

                a.href = previewUrl;
                a.download = `${safeName}.pdf`;
                a.click();
              }}
              className="w-full py-3 rounded-xl bg-black text-white"
            >
              Download PDF
            </button>
          )}

        </div>

</div>
</div>

  );
}

function Section({ title, children }: any) {
  return (
    <div className="border rounded-xl p-5 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
     <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

// =========================
// ✅ 1. FIX INPUT COMPONENT
// =========================

const dateClass =
  "border rounded-lg px-3 py-2 w-full box-border";

function Input({ value, onChange, ...rest }: any) {
  return (
    <input
      {...rest}
      value={value || ""}
      onChange={onChange}
      className="border rounded-lg px-3 py-2 w-full"
    />
  );
}

