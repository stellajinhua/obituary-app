"use client";

import { pdf } from "@react-pdf/renderer";
import ObituaryPDF from "@/app/pdf/ObituaryPDF";

export async function generateObituaryPDF(data: any) {
  const blob = await pdf(
    <ObituaryPDF form={data} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  window.open(url);
}