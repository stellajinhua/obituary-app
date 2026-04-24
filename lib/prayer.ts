import solarlunar from "solarlunar";

export const PRAYER_MAP: Record<string, number> = {
  "1st": 6,   // 7th day
  "3rd": 20,  // 21st day
  "5th": 34,  // 35th day
  "7th": 48,  // 49th day
  "100th": 99 // 100th day
};

export const PRAYER_LABELS: Record<string, string> = {
  "1st": "头七",
  "3rd": "三七",
  "5th": "五七",
  "7th": "七七",
  "100th": "百日",
};

// ✅ ALWAYS control order here
export const PRAYER_ORDER = ["1st", "3rd", "5th", "7th", "100th"];

const weekdayCn = [
  "星期日","星期一","星期二",
  "星期三","星期四","星期五","星期六"
];

export function generatePrayerData(deathDate: string) {
  // ✅ FIX: handle UTC datetime → convert to LOCAL date correctly
  const dateObj = new Date(deathDate);

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid deathDate:", deathDate);
    return [];
  }

  const base = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );

  // ✅ FORCE ORDER HERE
  return PRAYER_ORDER.map((type) => {
    const offset = PRAYER_MAP[type];

    const d = new Date(base);
    d.setDate(d.getDate() + offset);

    const lunar = solarlunar.solar2lunar(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );

    const reminder = new Date(d);
    reminder.setDate(reminder.getDate() - 3);

    const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

    return {
      type,
      label: PRAYER_LABELS[type] || type, // ✅ safe fallback

    
      western_date: formatDate(d),
      western_day: d.toLocaleDateString("en-MY", {
        weekday: "long",
      }),

      lunar_month: lunar.monthCn || "-",
      lunar_day: lunar.dayCn || "-",
      lunar_day_name: weekdayCn[d.getDay()],

     
      reminder_date: formatDate(reminder),
    };
  });
}