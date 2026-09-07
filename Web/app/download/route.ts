import { redirect } from "next/navigation";

const androidApkUrl =
  "https://github.com/imshubham07/LenDen/releases/download/v1.0.0/lenden.apk";

export function GET() {
  redirect(androidApkUrl);
}
