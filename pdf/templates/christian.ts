import jsPDF from "jspdf";

export function generateChristianPdf(form: any) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("✝ In Loving Memory Of ✝", 105, 20, { align: "center" });

  doc.setFontSize(22);
  doc.text(form.name || "", 105, 35, { align: "center" });

  doc.setFontSize(12);
  doc.text(
    `${form.birth_year || ""} - ${form.death_year || ""}`,
    105,
    45,
    { align: "center" }
  );

  return doc;
}