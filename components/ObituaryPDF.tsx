"use client";


import { floralBgBase64 } from "@/lib/pdfAssets";
import solarlunar from "solarlunar";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/* ------------------ FONT ------------------ */
import { notoSansSC } from "@/lib/fontBase64";

Font.register({
  family: "NotoSansSC",
  src: "http://localhost:3000/fonts/NotoSansSC-Regular.otf",
});

function formatTimeENOnly(dateString?: string) {
  if (!dateString) return "";

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const isPM = hours >= 12;

  hours = hours % 12;
  if (hours === 0) hours = 12;

  if (minutes === 0) {
    return `${hours} ${isPM ? "PM" : "AM"}`;
  }

  return `${hours}:${String(minutes).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
}


function numberToChinese(num: number) {
  const cnNums = ["零","一","二","三","四","五","六","七","八","九","十"];

  if (num <= 10) return cnNums[num];

  if (num < 20) return "十" + cnNums[num % 10];

  if (num % 10 === 0) return cnNums[Math.floor(num / 10)] + "十";

  return cnNums[Math.floor(num / 10)] + "十" + cnNums[num % 10];
}


function formatLunarFromDate(date?: string) {
  if (!date) return { lunar: "", weekday: "" };

  const d = new Date(date);

  const lunar = solarlunar.solar2lunar(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );

  const rawWeekday = lunar.ncWeek || "";
  const cleanWeekday = rawWeekday.replace(/^星期/, "");

  return {
    lunar: `${lunar.monthCn}${lunar.dayCn}`,
    weekday: `星期${cleanWeekday}`,
  };
}


function formatTimeOnlyCN(date?: string) {
  if (!date) return "";

  const d = new Date(date);

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const period = hours >= 12 ? "下午" : "上午";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hourCN = numberToChinese(hours);
  const minuteCN =
    minutes === 0
      ? ""
      : numberToChinese(minutes);

  return minutes === 0
    ? `${period}${hourCN}时`
    : `${period}${hourCN}时${minuteCN}分`;
}


function formatLunarCN(lunar?: string, weekday?: string, withPrefix = true) {
  if (!lunar && !weekday) return "-";

  const cleanLunar = lunar?.replace(/^(農曆)+/, "") || "";

  const prefix = withPrefix ? "農曆" : "";

  if (cleanLunar && weekday) {
    return `${prefix}${cleanLunar}，${weekday}`;
  }

  if (cleanLunar) {
    return `${prefix}${cleanLunar}`;
  }

  if (weekday) {
    return weekday;
  }

  return "-";
}



const formatDeathEN = (date?: string) => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatRange = (date: any, start: any, end: any) => {
  if (!date || !start) return "";

  const s = new Date(`${date} ${start}`);
  const e = end ? new Date(`${date} ${end}`) : null;

  // Chinese
  const cnStart = formatDate(s.toISOString());
  const cnEnd = e
    ? `${e.getHours() >= 12 ? "下午" : "上午"}${
        (e.getHours() % 12) || 12
      }时${String(e.getMinutes()).padStart(2, "0")}分`
    : "";

  // English
  const enStart = formatDateEN(s.toISOString());
  const enEnd = e
  ? formatTimeENOnly(e.toISOString())
  : "";

  return {
    cn: e ? `${cnStart} - ${cnEnd}` : cnStart,
    en: e ? `${enStart} - ${enEnd}` : enStart,
  };
};


function splitVenue(text = "") {
  if (!text) return { cn: "", en: "" };

  const clean = text.replace(/\s+/g, " ").trim();

  // Detect Chinese
  const hasChinese = /[\u4e00-\u9fff]/.test(clean);

  // Case 1: pure English → no split
  if (!hasChinese) {
    return { cn: clean, en: "" };
  }

  // 🔥 FIX: detect first English OR number
  const index = clean.search(/[A-Za-z0-9]/);

  if (index === -1) {
    return { cn: clean, en: "" };
  }

  return {
    cn: clean.slice(0, index).trim(),
    en: clean.slice(index).trim(),
  };
}



/* ------------------ DATE FORMAT ------------------ */
function formatDateEN(dateString?: string) {
  if (!dateString) return "";

  const d = new Date(dateString);

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const isPM = hours >= 12;
  const period = isPM ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const time =
    minutes === 0
      ? `${hours} ${isPM ? "PM" : "AM"}`
      : `${hours}:${String(minutes).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${datePart}, ${time}`;
}

const formatDateOnlyCN = (date?: string) => {
  if (!date) return "-";

  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const formatDateOnlyEN = (date?: string) => {
  if (!date) return "";

  const d = new Date(date);

  return `${d.getDate()} ${d.toLocaleString("en-MY", {
    month: "long",
  })} ${d.getFullYear()}`;
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const d = new Date(date);

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const isPM = hours >= 12;
  const period = isPM ? "下午" : "上午";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const time =
    minutes === 0
      ? `${period}${hours}时`
      : `${period}${hours}时${String(minutes).padStart(2, "0")}分`;

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日${time}`;
};




/* ------------------ ZODIAC ------------------ */
const zodiacMap: Record<string, string> = {
  鼠: "Rat",
  牛: "Ox",
  虎: "Tiger",
  兔: "Rabbit",
  龙: "Dragon",
  蛇: "Snake",
  马: "Horse",
  羊: "Goat",
  猴: "Monkey",
  鸡: "Rooster",
  狗: "Dog",
  猪: "Pig",
};


function formatZodiacList(zodiaclist: any = [], mode = "full") {
  // ✅ FIX: prevent crash when null / undefined
  if (!Array.isArray(zodiaclist) || zodiaclist.length === 0) return [];

  const grouped: Record<string, number[]> = {};

  zodiaclist.forEach((z) => {
    if (!z?.zodiac) return;

    if (!grouped[z.zodiac]) grouped[z.zodiac] = [];

    const ages = Array.isArray(z.ages)
      ? z.ages
      : String(z.ages || "")
          .split(",")
          .map((a) => Number(a.trim()));

    grouped[z.zodiac].push(...ages);
  });

  const entries = Object.entries(grouped);

  if (mode === "ultra") {
    const zodiacs = entries.map(([z]) => z).join("、");
    const ages = entries.flatMap(([_, a]) => a);

    return [
      `${zodiacs}（${ages.join("、")}岁） ${
        entries.map(([z]) => zodiacMap[z]).join(", ")
      } (${ages.join(", ")})`,
    ];
  }

  if (mode === "compact") {
    return entries.map(([zodiac, ages]) => {
      const cn = `${zodiac}（${ages.map((a) => `${a}岁`).join("、")}）`;
      const en = `${zodiacMap[zodiac]} (${ages.join(", ")})`;
      return `${cn} ${en}`;
    });
  }

  // full
  return entries.map(([zodiac, ages]) => ({
    cn: `${zodiac}（${ages.map((a) => `${a}岁`).join("、")}）`,
    en: `${zodiacMap[zodiac]} (${ages.join(", ")})`,
  }));
}

function smartClamp(text: string = "", maxChars: number = 80) {
  if (!text) return "";

  // Detect if mostly Chinese
  const isChinese = /[\u4e00-\u9fff]/.test(text);

  const limit = isChinese ? maxChars : maxChars + 20;

  if (text.length <= limit) return text;

  return text.slice(0, limit).trim() + "...";
}




/* ------------------ ROW COMPONENT ------------------ */
const RowCNEN = ({
  labelCn,
  labelEn,
  valueCn,
  valueEn,
  isVenue = false, // 👈 ADD THIS
}: {
  labelCn: string;
  labelEn: string;
  valueCn: any;
  valueEn: string;
  isVenue?: boolean;
}) => (
  <View style={styles.row} wrap>
    <View style={styles.left}>
      <Text style={styles.labelCn}>{labelCn}</Text>
      <Text style={styles.labelEn}>{labelEn}</Text>
    </View>

    <View style={styles.right}>
      {typeof valueCn === "string" ? (
        <Text
          style={[
  styles.valueCn,
  ...(isVenue ? [{ fontSize: 11 }] : []),
]}
        >
          {valueCn}
        </Text>
      ) : (
        <View>{valueCn}</View>
      )}

      {valueEn ? (
        <Text style={styles.valueEn}>{valueEn}</Text>
      ) : null}
    </View>
  </View>
);        // 👈 THIS closes arrow function

/* ------------------ MAIN ------------------ */
export default function ObituaryPDF({ data }: { data: any }) {
  if (!data) return null;

  const record = data;

const zodiacListSafe = Array.isArray(record.zodiaclist)
  ? record.zodiaclist
  : [];

const zodiacCount = zodiacListSafe.length;

  const mode =
    zodiacCount === 1
      ? "full"
      : zodiacCount === 2
      ? "compact"
      : "ultra";

const zodiacData =
  mode === "ultra"
    ? formatZodiacList(zodiacListSafe, "ultra")
    : formatZodiacList(zodiacListSafe, mode);

  const MAX_ZODIAC_LINES = 2;

const limitedZodiac =
  zodiacData.length > MAX_ZODIAC_LINES
    ? [
        ...zodiacData.slice(0, MAX_ZODIAC_LINES - 1),
        "...",
      ]
    : zodiacData;


const formatRangeCN = (date: any, start: any, end: any) => {
  if (!date || !start) return "";

  const s = new Date(`${date} ${start}`);
  const e = end ? new Date(`${date} ${end}`) : null;

  if (!e) return formatDate(s.toISOString());

  const startStr = formatDate(s.toISOString());
  const endStr = formatDate(e.toISOString());

  return `${startStr} - ${endStr.split("日")[1]}`;
};


let venueCn = record.venue_cn || record.venue_full || "";
let venueEn = record.venue_en || "";

const familyDateTime =
  record.family_date && record.family_time
    ? `${record.family_date} ${record.family_time}`
    : "";

const familyLunar = formatLunarFromDate(familyDateTime);


  const encoffin = formatRange(
  record.encoffin_date,
  record.encoffin_start,
  record.encoffin_end
);


const encoffinStart =
  record.encoffin_date && record.encoffin_start
    ? `${record.encoffin_date} ${record.encoffin_start}`
    : "";

const encoffinEnd =
  record.encoffin_date && record.encoffin_end
    ? `${record.encoffin_date} ${record.encoffin_end}`
    : "";

const encoffinLunar = formatLunarFromDate(
  `${record.encoffin_date} ${record.encoffin_start}`
);

  const isBurial = record?.burialtype === "burial";

  const locationLabelCn = isBurial ? "土葬于" : "火化于";
  const locationLabelEn = isBurial
    ? "Burial Location"
    : "Cremation Location";

  const rawLocation = isBurial
  ? record?.burial_place
  : record?.cremation_place;

const locationSplit = splitVenue(rawLocation);

return (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* 🌸 BACKGROUND */}
      <Image src={floralBgBase64} style={styles.background} fixed />

      {/* 📦 CONTENT */}
      <View style={styles.content}>

        {/* HEADER */}
        <View style={styles.header}>

          {(record.image_base64 || record.image_url) && (
            <View style={styles.photoWrapper}>
              <Image
                src={record.image_base64 || record.image_url}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          )}

          <Text style={styles.nameCn}>{record.name_cn || ""}</Text>
          <Text style={styles.nameEn}>{record.name_ic || ""}</Text>

          <View style={styles.ageRow}>
            <View style={styles.line} />
            <Text style={styles.age}>享年 {record.age || ""} 岁</Text>
            <View style={styles.line} />
          </View>

        </View>

        {/* DETAILS */}
        <View style={styles.section} wrap>

<RowCNEN
  labelCn="往生日期"
  labelEn="Date of Passing"
  valueCn={formatLunarCN(
  record.death_lunar_date,
  record.death_lunar_day
)}
  valueEn={
    record.death_datetime
      ? formatDeathEN(record.death_datetime)
      : "—"
  }
/>

<RowCNEN
  labelCn="治喪地點"
  labelEn="Venue"
  valueCn={smartClamp(venueCn, 80)}
  valueEn={venueEn}
  isVenue={record.venue_type === "home"}
/>


          <RowCNEN
            labelCn="出殯時日"
            labelEn="Funeral Service"
      valueCn={
  record.funeral_datetime
    ? `${formatLunarCN(
        record.funeral_lunar_date,
        record.funeral_lunar_day
      )} ${formatTimeOnlyCN(record.funeral_datetime)}`
    : "-"
}
            valueEn={formatDateEN(record.funeral_datetime)}
          />


<RowCNEN
  labelCn="入殮時日"
  labelEn="Encoffin"
  valueCn={
    encoffinStart ? (
      <Text
        style={[
          styles.valueCn,
          {
            fontSize: 12,     // 🔥 force smaller
            lineHeight: 1.2,  // 🔥 keep it tight
          },
        ]}
      >
        {`${formatLunarCN(
          encoffinLunar.lunar,
          encoffinLunar.weekday,
          false
        )} ${
          encoffinEnd
            ? `${formatTimeOnlyCN(encoffinStart)} - ${formatTimeOnlyCN(encoffinEnd)}`
            : formatTimeOnlyCN(encoffinStart)
        }`}
      </Text>
    ) : (
      ""
    )
  }
  valueEn={(encoffin as any)?.en}
/>

          <RowCNEN
  labelCn="親屬集合"
  labelEn="Family Assembly"
  valueCn={
  record.family_date && record.family_time
    ? `${formatLunarCN(
        familyLunar.lunar,
        familyLunar.weekday,
        false
      )} ${formatTimeOnlyCN(familyDateTime)}`
    : ""
}
  valueEn={
    record.family_date && record.family_time
      ? formatDateEN(`${record.family_date} ${record.family_time}`)
      : ""
  }
/>

<RowCNEN
  labelCn="犯沖生肖"
  labelEn="Zodiac Clash"
  valueCn={
    limitedZodiac.map((item, i) => {
      if (typeof item === "string") {
        return (
          <Text
            key={i}
            style={[
              styles.valueCn,
              {
                fontSize: 12,
                lineHeight: 1.2,
              },
            ]}
          >
            {item}
          </Text>
        );
      }

      return (
        <View key={i} style={{ marginBottom: 4 }}>
          <Text
            style={[
              styles.valueCn,
              {
                fontSize: 12,
                lineHeight: 1.2,
              },
            ]}
          >
            {item.cn}
          </Text>

          <Text
            style={[
              styles.valueEn,
              {
                fontSize: 11,
                lineHeight: 1.2,
              },
            ]}
          >
            {item.en}
          </Text>
        </View>
      );
    })
  }
  valueEn=""   // 👈 ADD THIS LINE
/>
    

          <RowCNEN
            labelCn={locationLabelCn}
            labelEn={locationLabelEn}
            valueCn={smartClamp(locationSplit.cn, 40)}
            valueEn={locationSplit.en}
          />

        </View>

       </View> {/* ✅ CLOSE CONTENT */}

      {/* ✅ ONLY ONE FOOTER — OUTSIDE CONTENT */}
      <View style={styles.footer} fixed>
        <Text style={{ fontSize: 18 }}>
          金花丧事服务有限公司
        </Text>
        <Text style={{ fontSize: 12 }}>
          JIN HUA FUNERAL SERVICES SDN BHD
        </Text>
        <Text>011-40407133 / 019-8980171</Text>
      </View>

    </Page>
  </Document>
);
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  page: {
  padding: 0,
  fontSize: 11,
  fontFamily: "NotoSansSC",
},

background: {
  position: "absolute",
  top: 0,
  left: 0,
  width: 595,
  height: 842,
},


 content: {               //fix center balance
  paddingTop: 10,   
  paddingBottom: 110,     //photo after the gold divider line
  paddingHorizontal: 80,    //move more to left or right whole content. 
},


 header: {
  alignItems: "center",
},

topBlock: {
  alignItems: "center",
  paddingTop: 30,
  paddingBottom: 10,
},

afterLineGap: {
  height: 12,              // 🔥 spacing AFTER gold line
},


titleCn: {
  fontFamily: "NotoSansSC",
  fontSize: 45,
},


photoWrapper: {
  width: 125,
  height: 150,

  borderWidth: 2,
  borderColor: "#C9A646",

  borderRadius: 6,               // soft corners (elderly-friendly)
  overflow: "hidden",
 
  marginTop: 120,
  marginBottom: 11, 

  alignSelf: "center", 
},


  ageRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: -2,
  marginBottom: 4,
},

line: {
  width: 40,              // 🔥 shorter = softer
  height: 0.8,            // 🔥 thinner line
  backgroundColor: "#C9A646",
  marginHorizontal: 6,
  opacity: 0.6,           // 🔥 softer gold
},


  divider: {
  width: 120,      // 🔥 control length
  height: 1.5,
  backgroundColor: "#C9A646",     // 🔥 gold color
  marginTop: 8,
  marginBottom: 12,
},

  nameCn: { 
  fontSize: 28,
  fontWeight: "bold",
  color: "#111",
},

nameEn: { 
  fontSize: 15,
  color: "#444",
  marginBottom: 6,
},


age: { 
  fontSize: 13,
  color: "#333",
},

  section: { 
    marginTop: 8
  },


 row: {
  flexDirection: "row",
  paddingVertical: 4,   // 👈 more breathing
  borderBottomWidth: 0.3,
  borderColor: "#ddd",
},


 left: { 
  width: 130,   // 👈 more breathing room
},


right: { 
  flex: 1 
},

rowSingle: {
  marginBottom: 10,   // was 16
  paddingBottom: 6,   // was 10
},

labelCn: { 
  fontSize: 13,
  color: "#000000",
},

labelEn: { 
  fontSize: 11,
  color: "#1f1f1f",
  marginBottom: 3,
},

valueCn: { 
  fontSize: 13,
 fontWeight: "bold",
  color: "#000000",
  lineHeight: 1.4,

},

valueEn: { 
  fontSize: 11,
  color: "#1f1e1e",
  marginTop: 3,
  lineHeight: 1.3,
},

footer: {
  position: "absolute",
  bottom: 30,
  left: 70,
  right: 70,
  textAlign: "center",
  fontSize: 11,
  color: "#5e5e5e",
},

});