"use client";

//import { floralBgBase64, christianBgBase64 } from "@/lib/pdfAssets";
//import christianBg from "@/public/bg-christian.png";
//import floralBg from "@/public/bg-buddhist.png";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

/* ------------------ FONT ------------------ */
Font.register({
  family: "NotoSansSC",
  src: "http://localhost:3000/fonts/NotoSansSC-Regular.otf",
});


/* ------------------ HELPERS ------------------ */
function formatDateCNEN(date?: string) {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const weekdaysCN = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  const weekdayCN = weekdaysCN[d.getDay()];

  const cn = `${year} 年${month} 月${day} 日, ${weekdayCN}`;

  const en = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${cn}\n${en}`;
}


function numberToChinese(num: number) {
  const nums = ["零","一","二","三","四","五","六","七","八","九"];
  const tens = ["","十","二十","三十","四十","五十"];

  if (num < 10) return nums[num];

  if (num < 60) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;

    if (ten === 1) {
      return unit === 0 ? "十" : `十${nums[unit]}`;
    }

    return unit === 0
      ? tens[ten]
      : `${tens[ten]}${nums[unit]}`;
  }

  return num.toString(); // fallback
}

function formatTimeOnlyCNChars(date?: string) {
  if (!date) return "";

  const d = new Date(date);

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const period = hours >= 12 ? "下午" : "上午";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hoursCN = numberToChinese(hours);
  const minutesCN = numberToChinese(minutes);

  return minutes === 0
    ? `${period}${hoursCN}时`
    : `${period}${hoursCN}时${minutesCN}分`;
}

function formatDateTimeCNEN(date?: string) {
  if (!date) return { cn: "-", en: "" };
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const weekdaysCN = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  const weekdayCN = weekdaysCN[d.getDay()];

  // -------- CN TIME --------
  let hours = d.getHours();
  const minutes = d.getMinutes();

  const periodCN = hours >= 12 ? "下午" : "上午";

  hours = hours % 12;
  if (hours === 0) hours = 12;

const hoursCN = numberToChinese(hours);
const minutesCN = numberToChinese(minutes);

const cnTime =
  minutes === 0
    ? `${periodCN}${hoursCN}时`
    : `${periodCN}${hoursCN}时${minutesCN}分`;

  const cn = `${year} 年${month} 月${day} 日, ${weekdayCN} ${cnTime}`;

  // -------- EN TIME --------
  let hoursEN = d.getHours();
  const minutesEN = d.getMinutes();
  const isPM = hoursEN >= 12;

  hoursEN = hoursEN % 12;
  if (hoursEN === 0) hoursEN = 12;

  const enTime =
    minutesEN === 0
      ? `${hoursEN} ${isPM ? "PM" : "AM"}`
      : `${hoursEN}:${String(minutesEN).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;

  const enDate = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const en = `${enDate}, ${enTime}`;

 

  return {
  cn,
  en
};

}

function formatDateCNFull(date?: string) {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const weekdays = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  const weekday = weekdays[d.getDay()];

  return `${year} 年${month} 月${day} 日, ${weekday}`;
}


const christianBg = "/bg-christian.png";
const floralBg = "/bg-buddhist.png";


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

function formatLunarCN(
  lunar?: string,
  weekday?: string,
  withPrefix = true
) {
  if (!lunar && !weekday) return "-";

  const cleanLunar = lunar?.replace(/^(農曆)+/, "") || "";
  const prefix = withPrefix ? "農曆" : "";

  if (cleanLunar && weekday) {
    return `${prefix}${cleanLunar}，${weekday}`;
  }

  if (cleanLunar) return `${prefix}${cleanLunar}`;
  if (weekday) return weekday;

  return "-";
}

function formatTimeOnlyCN(date?: string) {
  if (!date) return "";

  const d = new Date(date);

  let hours = d.getHours();
  const minutes = d.getMinutes();

  const period = hours >= 12 ? "下午" : "上午";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return minutes === 0
    ? `${period}${hours}时`
    : `${period}${hours}时${minutes}分`;
}

function formatDateEN(date?: string) {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const isPM = hours >= 12;

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const time =
    minutes === 0
      ? `${hours} ${isPM ? "PM" : "AM"}`
      : `${hours}:${String(minutes).padStart(2, "0")} ${
          isPM ? "PM" : "AM"
        }`;

  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${datePart}, ${time}`;
}

function smartClamp(text: string = "", maxChars: number = 80) {
  if (!text) return "";

  const isChinese = /[\u4e00-\u9fff]/.test(text);
  const limit = isChinese ? maxChars : maxChars + 20;

  if (text.length <= limit) return text;

  return text.slice(0, limit).trim() + "...";
}

function splitVenue(text = "") {
  if (!text) return { cn: "", en: "" };

  const clean = text.replace(/\s+/g, " ").trim();
  const hasChinese = /[\u4e00-\u9fff]/.test(clean);

  if (!hasChinese) return { cn: clean, en: "" };

  const index = clean.search(/[A-Za-z0-9]/);

  if (index === -1) return { cn: clean, en: "" };

  return {
    cn: clean.slice(0, index).trim(),
    en: clean.slice(index).trim(),
  };
}




/* ------------------ ROW ------------------ */
const RowCNEN = ({ labelCn, labelEn, valueCn, valueEn }: any) => (
  <View style={styles.row}>
    <View style={styles.left}>
      <Text style={styles.labelCn}>{labelCn}</Text>
      <Text style={styles.labelEn}>{labelEn}</Text>
    </View>

    <View style={styles.right}>
      <Text style={styles.valueCn}>
  {valueCn || valueEn || "-"}
</Text>
{valueEn && valueCn && (
  <Text style={styles.valueEn}>{valueEn}</Text>
)}
    </View>
  </View>
);


/* ------------------ MAIN ------------------ */
export default function ChristianPDF({ data }: { data: any }) {
  if (!data) return null;

  const record = data; // ✅ FIRST

      console.log("IMAGE BASE64:", record.image_base64);
  console.log("IMAGE URL:", record.image_url);
  console.log("RELIGION:", record.religion);

  // 1️⃣ normalize religion

const background = christianBg;
    

  // 4️⃣ SAFE photo
const photoSrc =
  typeof record.image_url === "string" &&
  record.image_url.startsWith("http")
    ? record.image_url
    : undefined;

  // rest of your logic...


  let venueCn = "";
  let venueEn = "";

  if (record.venue_type === "parlour") {
    venueCn = record.venue_cn || "";
    venueEn = record.venue_en || "";
  } else {
    venueCn = record.venue_full || record.venue || "";
  }

  const isBurial = record?.burialtype === "burial";

  const rawLocation = isBurial
    ? record?.burial_place
    : record?.cremation_place;

  const locationSplit = splitVenue(rawLocation);

  const deathStr = formatDateCNEN(record.death_datetime);

const [deathCn, deathEn] =
  typeof deathStr === "string"
    ? deathStr.split("\n")
    : ["-", ""];

  const funeralDt = formatDateTimeCNEN(record.funeral_datetime);

  const memorialDt =
  record.memorial_service_date && record.memorial_service_time
    ? formatDateTimeCNEN(
        `${record.memorial_service_date} ${record.memorial_service_time}`
      )
    : null;

    const familyDt =
  record.family_date && record.family_time
    ? formatDateTimeCNEN(
        `${record.family_date} ${record.family_time}`
      )
    : null;

  return (
  <Document>
  <Page size="A4" style={styles.page}>
   <Image src={background} style={styles.background} fixed />

        <View style={styles.content}>

          

          {/* HEADER */}
          <View style={styles.header}>
{photoSrc ? (
  <View style={styles.photoWrapper}>
    <Image
      src={photoSrc}
      style={{ width: "100%", height: "100%", borderRadius: 12,}}

    />
  </View>
) : (
  <View style={styles.photoWrapper} />
)}

            <Text style={styles.nameCn}>{record.name_cn || ""}</Text>
            <Text style={styles.nameEn}>{record.name_ic || ""}</Text>

            <View style={styles.ageRow}>
              <View style={styles.line} />
              <Text style={styles.age}>Age {record.age || ""}</Text>
              <View style={styles.line} />
            </View>

          </View>

          {/* DETAILS */}
          <View style={styles.section} wrap>


<RowCNEN
  labelCn="蒙主恩召"
  labelEn="Called Home"
  valueCn={deathCn || "-"}
  valueEn={deathEn}
/>

            <RowCNEN
              labelCn="地點"
              labelEn="Venue"
              valueCn={smartClamp(venueCn, 80)}
              valueEn={venueEn}
            />

<RowCNEN
  labelCn="追思礼拜"
  labelEn="Memorial Service"
  valueCn={memorialDt?.cn || "-"}
  valueEn={memorialDt?.en}
/>



<RowCNEN
  labelCn="出殯礼拜"
  labelEn="Funeral Service"
  valueCn={funeralDt.cn}
  valueEn={funeralDt.en}
/>
            
{/*
         <RowCNEN
  labelCn="入殮仪式"
  labelEn="Encoffin"
  valueEn={
  record.encoffin_date && record.encoffin_start
    ? (() => {
        const start = `${record.encoffin_date} ${record.encoffin_start}`;
        const end = record.encoffin_end
          ? `${record.encoffin_date} ${record.encoffin_end}`
          : null;

        if (!end) return formatDateTimeCNEN(start);

        // ---- CN ----
        const cnDate = formatDateCNFull(start);

        const cnStart = formatTimeOnlyCNChars(start);
        const cnEnd = formatTimeOnlyCNChars(end);

        // ---- EN ----
        const enDate = new Date(start).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const formatTimeEN = (dStr: string) => {
          const d = new Date(dStr);
          let h = d.getHours();
          const m = d.getMinutes();
          const isPM = h >= 12;

          h = h % 12;
          if (h === 0) h = 12;

          return m === 0
            ? `${h} ${isPM ? "PM" : "AM"}`
            : `${h}:${String(m).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
        };

        const enStart = formatTimeEN(start);
        const enEnd = formatTimeEN(end);

        return `${cnDate} ${cnStart} 至 ${cnEnd}\n${enDate}, ${enStart} – ${enEnd}`;
      })()
    : "-"
}
/>*/}

<RowCNEN
  labelCn="親屬集合時間"
  labelEn="Family Assembly"
  valueCn={familyDt?.cn || "-"}
  valueEn={familyDt?.en}
/>

            <RowCNEN
              labelCn={isBurial ? "安葬於" : "火化於"}
              labelEn={isBurial ? "Burial" : "Cremation"}
              valueCn={smartClamp(locationSplit.cn, 40)}
              valueEn={locationSplit.en}
            />

          </View>

        </View>

        {/* FOOTER */}
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
    fontSize: 11,
    fontFamily: "NotoSansSC",
  },


  background: {
    position: "absolute",
    width: 595,
    height: 842,
  },

  content: {
    paddingTop: 10,
    paddingBottom: 110,
    paddingHorizontal: 80,
  },

  header: {
    alignItems: "center",
  },


  photoWrapper: {
    width: 125,
    height: 150,
    borderWidth: 1.5,
    borderColor: "#C8A96A",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 150,
    marginBottom: 11,
  },

  nameCn: {
    fontSize: 28,
    letterSpacing: 1,
    fontWeight: "bold",
  },

  nameEn: {
    fontSize: 15,
    marginBottom: 6,
  },

  ageRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  line: {
    width: 40,
    height: 0.7,
    //opacity: 0.8,
    backgroundColor: "#D8C18A",
    marginHorizontal: 6,
  },

  age: {
    fontSize: 13,
  },

  section: {
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.6,
    borderColor: "#E6F0F7",
  },

  left: {
    width: 130,
  },

  right: {
    flex: 1,
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