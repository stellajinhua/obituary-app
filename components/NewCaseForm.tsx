"use client";

import { useRouter } from "next/navigation";

export default function NewCaseForm({
  form,
  handleChange,
  handleCreate,
  loading,
}: any) {
  const router = useRouter();

  // ✅ CENTRALIZED LABELS
  const labels = {
    title: "New Case 新案件",
    gender: "Gender 性别",
    religion: "Religion 宗教",
    dialect: "Dialect 籍贯",
    food: "Meal Preference 餐食",
    service: "Service Type 服务",
    create: "Create Case 创建案件",
    creating: "Creating... 创建中...",
  };

  // ✅ OPTIONS (clean + scalable)
  const genderOptions = [
    { value: "Male", label: "Male 男" },
    { value: "Female", label: "Female 女" },
  ];

  const religionOptions = [
    { value: "Buddhist", label: "Buddhist 佛教" },
    { value: "Christian", label: "Christian 基督教" },
  ];

  const dialectOptions = [
    { value: "Cantonese", label: "Cantonese 广东" },
    { value: "ZhaoAnn", label: "ZhaoAnn 诏安"},
    { value: "Foochow", label: "Foochow 福州" },
    { value: "Hokkien", label: "Hokkien 福建" },
    { value: "Henghua", label: "Henghua 兴化" },
    { value: "Hakka", label: "Hakka 客家" },
    { value: "Hainanese", label: "Hainanese 海南" },
    { value: "Teochew", label: "Teochew 潮州" },
  ];

  const foodOptions = [
    { value: "Vegetarian", label: "Vegetarian 斋" },
    { value: "Non-Vegetarian", label: "Non-Vegetarian 荤" },
    { value: "None", label: "None 无" },
  ];

  const serviceOptions = [
    { value: "burial", label: "Burial 安葬" },
    { value: "cremation", label: "Cremation 火化" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6 space-y-4">

      {/* 🔙 BACK */}
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 underline"
        >
          ← Back 返回主页
        </button>
      </div>

      {/* 📦 FORM CARD */}
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md space-y-4">

        <h1 className="text-xl font-bold text-center">
          {labels.title}
        </h1>

        {/* GENDER */}
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{labels.gender}</option>
          {genderOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* RELIGION */}
        <select
          name="religion"
          value={form.religion}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{labels.religion}</option>
          {religionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* DIALECT */}
        <select
          name="dialect"
          value={form.dialect}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{labels.dialect}</option>
          {dialectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* FOOD */}
        <select
          name="food"
          value={form.food}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{labels.food}</option>
          {foodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* SERVICE */}
        <select
          name="burialtype"
          value={form.burialtype}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{labels.service}</option>
          {serviceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 🚀 SUBMIT */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded"
        >
          {loading ? labels.creating : labels.create}
        </button>

      </div>
    </div>
  );
}