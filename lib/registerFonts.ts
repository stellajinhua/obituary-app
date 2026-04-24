import { Font } from "@react-pdf/renderer";
import { notoSansSC } from "./fontBase64";

Font.register({
  family: "NotoSansSC",
  src: notoSansSC,
});