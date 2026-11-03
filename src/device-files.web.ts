export async function saveTextFile(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackupText() {
  return new Promise<string | null>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json,text/plain";
    input.setAttribute("aria-label", "백업 파일 선택");
    input.style.display = "none";
    document.body.append(input);
    const done = () => input.remove();
    input.addEventListener(
      "cancel",
      () => {
        done();
        resolve(null);
      },
      { once: true },
    );
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        if (file.size > 20_000_000) throw Error("백업이 너무 큽니다.");
        resolve(await file.text());
      } catch (e) {
        reject(e);
      } finally {
        done();
      }
    };
    input.click();
  });
}
