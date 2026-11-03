import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
export async function saveTextFile(name: string, text: string, mime: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw Error("이 기기에서는 파일 공유를 사용할 수 없습니다.");
  const file = new File(Paths.cache, name);
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    mimeType: mime,
    UTI:
      mime === "application/json"
        ? "public.json"
        : mime === "image/svg+xml"
          ? "public.svg-image"
          : "public.plain-text",
  });
}
export async function pickBackupText() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  if (file.size > 20_000_000) throw Error("백업이 너무 큽니다.");
  return file.text();
}
