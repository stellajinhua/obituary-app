import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "SourceHanSerif",
  src: "/fonts/SourceHanSerifCN-Regular.otf",
});

export default function ObituaryPDF({ form = {} }: any) {

  const safeForm = form || {};

  // 🔥 CLEAN TEXT (removes weird hidden chars)
  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/[\uFFFD\uFFFE\uFFFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ✅ DATE FORMAT
  const formatDate = (datetime: string) => {
    if (!datetime) return "";
    const date = datetime.includes("T")
      ? datetime.split("T")[0]
      : datetime;
    const [y, m, d] = date.split("-");
    return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
  };

  const formatTimeAMPM = (time: string) => {
    if (!time) return "";
    let [h, m] = time.split(":").map(Number);
    const period = h < 12 ? "AM" : "PM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const getFormattedTime = (datetime: string) => {
    if (!datetime) return "";
    const time = datetime.split("T")[1];
    return formatTimeAMPM(time);
  };

  const zodiacText =
  Array.isArray(safeForm.zodiaclist)
    ? safeForm.zodiaclist
        .map((z: any) => `${z?.zodiac || ""} ${(z?.ages || []).join(",")}岁`)
        .join(" / ")
    : "";

  const burialLabel =
  safeForm.burialtype === "cremation"
    ? "火化于 PLACE OF CREMATION："
    : "安葬于 PLACE OF BURIAL：";

const burialValue =
  safeForm.burialtype === "cremation"
    ? cleanText(safeForm.cremation_place)
    : cleanText(safeForm.burial_place);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

       {/* BACKGROUND */}
       {/* <Image
  src={`${window.location.origin}/backgrounds/obituary-bg.png`}
  style={styles.background}
  fixed
/> */}
  
        <View style={styles.content}>

          {/* HEADER */}
          <View style={styles.headerRow}>
            <Text style={styles.titleText}>讣</Text>
            <Text style={styles.titleText}>告</Text>
          </View>

          {/* PHOTO */}
          {safeForm.image_url && (
            <View style={styles.imageWrapper}>
              
              <Image src={safeForm.image_url} style={styles.image} />
            </View>
          )}

          {/* PARAGRAPH */}
          <Text style={styles.paragraph}>
            我們最敬愛的至親：{cleanText(safeForm.name_cn)}，慟於公元
            {formatDate(safeForm.death_datetime)}（{cleanText(safeForm.death_lunar_date)}）
            {safeForm.death_lunar_day ? `星期${safeForm.death_lunar_day}` : ""}，
            壽終正寢，享壽積閏{safeForm.age || ""} 有 {safeForm.age || ""} 歲。
          </Text>

          <Text style={styles.paragraph}>
            淚涓於公元{formatDate(safeForm.funeral_datetime)}（
            {cleanText(safeForm.funeral_lunar_date)}）
            {safeForm.funeral_lunar_day ? `星期${safeForm.funeral_lunar_day}` : ""}，
            由喪居舉殯扶柩至古晉{burialValue}。
          </Text>

          {/* TABLE */}
          <View style={styles.table}>
            {[
              ["喪居 VENUE:", cleanText(safeForm.venue)],

              [
                "出殡时日 DATE OF FUNERAL：",
                `${formatDate(safeForm.funeral_datetime)}, ${getFormattedTime(safeForm.funeral_datetime)}`,
              ],

              [
                "入殓时日 DATE OF ENCOFFIN：",
                `${formatDate(safeForm.encoffin_date)}${
                  safeForm.encoffin_start && safeForm.encoffin_end
                    ? `, ${formatTimeAMPM(safeForm.encoffin_start)} - ${formatTimeAMPM(safeForm.encoffin_end)}`
                    : ""
                }`,
              ],

              [
                "亲属集合时间 FAMILY ASSEMBLY TIME：",
               `${formatDate(safeForm.family_date)} ${
  safeForm.family_time ? formatTimeAMPM(safeForm.family_time) : ""
}`
              ],

              [
                "犯冲生肖 CONTRADICTORY ZODIAC SIGN：",
                zodiacText,
              ],

              [burialLabel, burialValue],
            ].map((row, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellLeft}>{row[0]}</Text>
                <Text style={styles.cellRight}>{row[1]}</Text>
              </View>
            ))}
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerCn}>
              金花丧事服务有限公司
            </Text>

            <Text style={styles.footerEn}>
              JIN HUA FUNERAL SERVICES SDN BHD
            </Text>

            <Text style={styles.footerPhone}>
              H/P: 011-4040 7133 , 019-898 0171
            </Text>
          </View>

        </View>

      </Page>
    </Document>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  page: {
    fontFamily: "SourceHanSerif",
    fontSize: 12,
    lineHeight: 1.8,
  },

  background: {
    position: "absolute",
    width: 595,
    height: 842,
  },

  content: {
    paddingTop: 60,
    paddingHorizontal: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 50,
    columnGap: 120,
  },

  titleText: {
    fontSize: 42,
    fontWeight: "bold",
  },

  imageWrapper: {
    alignSelf: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#000",
    padding: 2,
  },

  image: {
    width: 120,
    height: undefined,
  },

  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },

  table: {
    borderWidth: 1,
    marginTop: 20,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },

  // 🔥 FIXED LABEL WIDTH
  cellLeft: {
    width: 270,
    borderRightWidth: 1,
    padding: 6,
    fontSize: 11,
  },

  // 🔥 CLEAN WRAP
  cellRight: {
    width: 265,
    padding: 6,
    fontSize: 11,
    flexWrap: "wrap",
  },

  footer: {
    marginTop: 40,
    textAlign: "center",
  },

  footerCn: {
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 10,
  },

  footerEn: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  footerPhone: {
    fontSize: 16,
  },
});