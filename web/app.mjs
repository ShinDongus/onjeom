import {
  initialState,
  addTasks,
  changeTask,
  completeTask,
  registerFlower,
  flowerInfo,
  FLOWERS,
  SEASONAL,
  localDate,
  seasonAt,
  exportBackup,
  importBackup,
  migrateState,
} from "/src/logic.mjs";
import { ruleSeparator } from "/src/separator.mjs";
const app = document.querySelector("#app"),
  notice = document.querySelector("#notice");
let state = initialState(),
  tab = "오늘",
  draft = null,
  thought = "",
  locked = false;
try {
  const saved = localStorage.getItem("onjeom-v2");
  if (saved) state = migrateState(JSON.parse(saved));
} catch (e) {
  locked = true;
  notice.textContent =
    "저장 데이터를 읽지 못했습니다. 원본을 덮어쓰지 않도록 편집을 잠갔습니다. 백업으로 복원해 주세요. " +
    e.message;
  tab = "설정";
}
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const b = (text, action, id = "", secondary = false) =>
  `<button data-action="${action}" data-id="${escape(id)}" class="${secondary ? "secondary" : ""}">${text}</button>`;
const flower = (f) =>
  `<div class="flower" aria-hidden="true" style="--petal:${flowerInfo(f).color.hex}"><span class="petals">✿</span></div>`;
function save(next) {
  if (locked) throw Error("저장 오류를 복원한 후 다시 시도해 주세요.");
  localStorage.setItem("onjeom-v2", JSON.stringify(next));
  state = next;
  render();
}
function dialog(content) {
  const el = document.createElement("dialog");
  el.innerHTML = content + b("닫기", "close");
  el.addEventListener("click", handle);
  el.addEventListener("close", () => el.remove());
  document.body.append(el);
  el.showModal();
}
function render() {
  document.body.classList.toggle("reduce-motion", state.settings.reduceMotion);
  document.querySelector("nav").innerHTML = [
    "오늘",
    "실행",
    "정원",
    "씨앗",
    "설정",
  ]
    .map(
      (t) =>
        `<button data-tab="${t}" ${tab === t ? 'aria-current="page"' : ""}>${t}</button>`,
    )
    .join("");
  const active = state.tasks.filter((t) => t.status === "active"),
    current = active[0];
  if (tab === "오늘")
    app.innerHTML = `<small>${localDate()} · ${seasonAt(localDate())}의 한 페이지</small><h1>마음에 있는 것부터<br>가볍게 내려놓아요.</h1><p>잘 정리하지 않아도 괜찮아요. 떠오르는 생각을 자유롭게 적어 주세요.</p><textarea id="thought" aria-label="자유로운 생각 입력" maxlength="10000" placeholder="빨래하기, 메일 답장하기…">${escape(thought)}</textarea>${b("할 일로 나눠 보기", "separate")}<small>규칙 기반 분리 · 줄바꿈과 문장 부호를 기준으로 나눠요.</small>${draft ? `<article><h2>내가 할 일을 직접 골라요</h2>${draft.map((x, i) => `<input type="text" maxlength="500" data-draft="${i}" value="${escape(x)}" aria-label="할 일 ${i + 1} 수정">${b("제외", "remove", i, true)}`).join("")}${b("항목 더 적기", "add-draft", "", true)}${b("검토한 할 일 추가", "accept")}</article>` : ""}<article>완료한 일 ${state.completed}개 · 피어난 꽃 ${state.flowers.length}송이<p>쉬어도 사라지지 않아요.</p></article>`;
  if (tab === "실행")
    app.innerHTML = `<small>지금은 하나만</small>${current ? `<article><h1>${escape(current.title)}</h1>${b("이만큼 해냈어요 · 완료", "complete", current.id)}${b("나중에 하기", "later", current.id, true)}${b("작은 단계로 나누기", "split", current.id, true)}${b("씨앗 보관함에 두기", "archive", current.id, true)}</article>` : "<h1>지금은 여백으로 두어도 좋아요.</h1><p>생각을 적거나 씨앗 보관함에서 다시 시작해 보세요.</p>"}<small>다음 꽃까지 작은 행동 ${4 - (state.completed % 4)}개 · 시간은 재지 않아요.</small>`;
  if (tab === "씨앗")
    app.innerHTML = `<h1>씨앗 보관함</h1><p>다음을 기다리는 씨앗이에요.</p>${
      state.tasks
        .filter((t) => t.status === "seed")
        .map(
          (t) =>
            `<article><h2>${escape(t.title)}</h2>${b("다시 꺼내기", "restore-task", t.id)}</article>`,
        )
        .join("") || "<p>아직 보관한 씨앗이 없어요.</p>"
    }`;
  if (tab === "정원") {
    const backgrounds = {
      봄: "#edf2e5",
      여름: "#e4eee7",
      가을: "#f2e8d7",
      겨울: "#edf0f2",
    };
    app.innerHTML = `<section class="garden" style="--season:${backgrounds[seasonAt(localDate())]}"><small>${seasonAt(localDate())}의 정원</small><h1>어느새, 피어났네요.</h1><div class="flower-row">${state.flowers.slice(-6).map(flower).join("")}</div></section><h2>기억의 정원</h2><p>미등록 꽃도 영구 보관해요.</p>${[
      ...state.flowers,
    ]
      .reverse()
      .map(
        (f) =>
          `<article>${flower(f)}<h2>${flowerInfo(f).name} · ${flowerInfo(f).color.name}</h2><p>“${flowerInfo(f).meaning}”</p><small>${f.bloomedAt} · ${f.achievements.map(escape).join(" · ")}</small>${f.registered ? "<p>도감에 담았어요</p>" : b("도감에 담기", "register", f.id)}</article>`,
      )
      .join("")}<h2>꽃 도감 · 기본 12종과 시즌 4종</h2>${[
      ...FLOWERS,
      ...SEASONAL,
    ]
      .map((spec) => {
        const found = state.flowers.filter(
          (f) => f.registered && f.species === spec.id,
        );
        return `<article><h2>${found.length ? spec.name : "아직 만나지 않은 꽃"}</h2>${found.length ? `<p>${spec.meaning}</p>` : ""}${found.map((f) => `<p>${flowerInfo(f).color.name} · ${f.bloomedAt}</p><small>${f.achievements.map(escape).join(" · ")}</small>`).join("")}</article>`;
      })
      .join("")}`;
  }
  if (tab === "설정")
    app.innerHTML = `<h1>나에게 편안하게</h1><label><input type="checkbox" id="motion" ${state.settings.reduceMotion ? "checked" : ""}> 모션 줄이기</label><article><h2>수익화 · 테스트 모드</h2><p>실제 광고·결제는 연결되지 않았고 비용이 청구되지 않습니다. 희귀 색상 확률은 모두 5%입니다.</p><label><input type="checkbox" id="plus" ${state.settings.plusTest ? "checked" : ""}> PLUS 테스트</label></article><article><h2>데이터 관리</h2><p>이 웹 프로토타입은 localStorage에 저장합니다. 모바일은 SQLite를 사용합니다. 백업 파일은 암호화되지 않으므로 안전하게 보관해 주세요.</p>${b("백업 내보내기", "backup")}${b("전체 삭제", "clear", "", true)}<label>백업에서 복원<input type="file" id="restore" accept=".json,application/json"></label></article>`;
}
async function handle(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const action = target.dataset.action,
    id = target.dataset.id;
  try {
    if (target.dataset.tab) {
      tab = target.dataset.tab;
      render();
      return;
    }
    if (action === "close") {
      target.closest("dialog").close();
      return;
    }
    if (action === "separate") {
      thought = document.querySelector("#thought").value;
      if (!thought.trim()) return;
      draft = await ruleSeparator.separate(thought);
      render();
    }
    if (action === "remove") {
      draft.splice(Number(id), 1);
      render();
    }
    if (action === "add-draft" && draft.length < 100) {
      draft.push("");
      render();
    }
    if (action === "accept") {
      if (!draft.some((t) => t.trim()))
        throw Error("할 일을 하나 적어 주세요.");
      const next = addTasks(state, draft);
      save(next);
      draft = null;
      thought = "";
      tab = "실행";
      render();
    }
    if (["later", "archive"].includes(action))
      save(changeTask(state, id, action));
    if (action === "restore-task") save(changeTask(state, id, "restore"));
    if (action === "split")
      dialog(
        `<h2>더 작아도 괜찮아요.</h2><label>한 줄에 한 단계씩<textarea id="steps" maxlength="10000"></textarea></label>${b("작은 단계로 바꾸기", "confirm-split", id)}`,
      );
    if (action === "confirm-split") {
      save(
        changeTask(
          state,
          id,
          "split",
          document.querySelector("#steps").value.split("\n"),
        ),
      );
      target.closest("dialog").close();
    }
    if (action === "complete") {
      const before = state.flowers.length;
      save(completeTask(state, id));
      if (state.flowers.length > before) {
        const f = state.flowers.at(-1);
        dialog(
          `<section class="bloom">${flower(f)}<h2>${flowerInfo(f).name}이 피었어요.</h2><p>“${flowerInfo(f).meaning}”</p><small>${f.bloomedAt}</small><p>꽃은 기억의 정원에 보관했어요.</p></section>`,
        );
      }
    }
    if (action === "register") {
      const f = state.flowers.find((x) => x.id === id);
      const duplicate = state.flowers.some(
        (x) => x.registered && x.species === f.species && x.color === f.color,
      );
      if (state.settings.plusTest || duplicate) save(registerFlower(state, id));
      else
        dialog(
          `<h2>보상형 광고 · 테스트 모드</h2><p>실제 광고는 재생되지 않아요. 취소해도 꽃은 정원에 영구 보관됩니다.</p>${b("테스트: 보상 완료", "reward", id)}${b("테스트: 광고 제공 안 됨", "unavailable")}`,
        );
    }
    if (action === "reward") {
      save(registerFlower(state, id, { reward: "earned-test" }));
      target.closest("dialog").close();
    }
    if (action === "unavailable") {
      target.closest("dialog").close();
      notice.textContent = "광고가 없어요. 꽃은 정원에서 기다릴게요.";
    }
    if (action === "backup") {
      const url = URL.createObjectURL(
        new Blob([exportBackup(state)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "onjeom-backup.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    if (
      action === "clear" &&
      confirm(
        "꽃과 기록을 모두 삭제할까요? 내보낸 백업 파일은 별도로 삭제해 주세요.",
      )
    ) {
      localStorage.removeItem("onjeom-v2");
      state = initialState();
      locked = false;
      thought = "";
      draft = null;
      notice.textContent = "삭제했습니다.";
      render();
    }
  } catch (e) {
    notice.textContent = e.message;
    const dlg = target.closest("dialog");
    if (dlg) {
      const p = document.createElement("p");
      p.setAttribute("role", "alert");
      p.textContent = e.message;
      dlg.append(p);
    }
  }
}
document.querySelector("nav").addEventListener("click", handle);
app.addEventListener("click", handle);
app.addEventListener("input", (e) => {
  if (e.target.dataset.draft !== undefined)
    draft[Number(e.target.dataset.draft)] = e.target.value;
  if (e.target.id === "thought") thought = e.target.value;
});
app.addEventListener("change", async (e) => {
  try {
    if (e.target.id === "motion")
      save({
        ...state,
        settings: { ...state.settings, reduceMotion: e.target.checked },
      });
    if (e.target.id === "plus")
      save({
        ...state,
        settings: { ...state.settings, plusTest: e.target.checked },
      });
    if (e.target.id === "restore" && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20_000_000) throw Error("백업이 너무 큽니다.");
      const next = importBackup(await file.text());
      if (confirm("현재 기록을 백업으로 교체할까요?")) {
        localStorage.setItem("onjeom-v2", JSON.stringify(next));
        state = next;
        locked = false;
        draft = null;
        thought = "";
        notice.textContent = "복원했습니다.";
        render();
      }
    }
  } catch (err) {
    notice.textContent = err.message;
  }
});
render();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/web/sw.js", { scope: "/" }).catch(() => {
    notice.textContent = "오프라인 캐시는 이 브라우저에서 사용할 수 없습니다.";
  });
