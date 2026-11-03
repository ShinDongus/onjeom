import {
  migrateState,
  exportBackup,
  importBackup,
} from "/src/mobile-domain.mjs";
const summary = document.getElementById("summary"),
  error = document.getElementById("error");
let converted = null;
const describe = (s) =>
  `생각 ${s.thoughts.length}개 · 할 일 ${s.tasks.length}개 · 완료 ${s.completedTotal}개 · 꽃 ${s.flowers.length}송이 (미등록 ${s.flowers.filter((f) => !f.registeredAt).length}송이)`;
function current() {
  const raw = localStorage.getItem("onjeom.local.v1");
  if (!raw) throw Error("이 브라우저에는 원본 웹 기록이 없습니다.");
  return importBackup(raw);
}
function download(state) {
  const url = URL.createObjectURL(
    new Blob([exportBackup(state)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "onjeom-mobile-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
try {
  summary.textContent = describe(current());
} catch (e) {
  summary.textContent = e.message;
}
document.getElementById("export").onclick = () => {
  try {
    download(current());
    error.textContent = "";
  } catch (e) {
    error.textContent = e.message;
  }
};
document.getElementById("file").onchange = async (e) => {
  converted = null;
  document.getElementById("download").hidden = true;
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20_000_000) throw Error("백업이 너무 큽니다.");
    converted = importBackup(await file.text());
    summary.textContent = describe(converted);
    document.getElementById("download").hidden = false;
    error.textContent = "";
  } catch (e) {
    error.textContent = e.message;
  }
};
document.getElementById("download").onclick = () => {
  if (converted) download(converted);
};
