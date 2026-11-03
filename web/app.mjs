import {
  addTasks as addReviewed,
  editTask,
  reorderTask,
} from "./mobile-domain.mjs";
import {
  GROWTH_STEPS,
  FLOWERS,
  SEASONS,
  createInitialState,
  addThought,
  splitThought,
  activeTask,
  finishTask,
  postponeTask,
  restoreTask,
  addSmallStep,
  getCatalog,
  getActiveSeason,
  isNewEntry,
  registerFlower,
  flowerKey,
  validateState,
} from "./logic.mjs";
const STORAGE = "onjeom.local.v1";
let state = load(),
  tab = "today",
  modal = null,
  showAllTasks = false,
  toaster = null,
  lastBlooms = state.flowers.length;
const root = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const formattedDate = (d = new Date()) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
const dayName = (str) => {
  try {
    return new Date(str).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || "null");
    return validateState(v)
      ? { ...createInitialState(), ...v }
      : createInitialState();
  } catch {
    return createInitialState();
  }
}
function persist() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {
    toast("기기 저장 공간에 접근할 수 없어요.");
  }
}
function update(next, notice = "") {
  const before = state.flowers.length;
  state = next;
  persist();
  render();
  if (notice) toast(notice);
  if (state.flowers.length > before)
    toast("새로운 꽃이 피어났어요. 정원에서 만나보세요! 🌷");
}
function toast(message) {
  const stamp = Date.now();
  toaster = stamp;
  toastRoot.innerHTML = `<div class="toast">${esc(message)}</div>`;
  setTimeout(() => {
    if (toaster === stamp) toastRoot.innerHTML = "";
  }, 3300);
}
function icon(name, size = 20) {
  const paths = {
    seed: '<path d="M12 21v-8m0 0c-6 1-8-2-8-7 6 0 8 3 8 7Zm0 0c6 1 8-2 8-7-6 0-8 3-8 7Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    inbox:
      '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 13h5l2 3h4l2-3h5"/>',
    book: '<path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1Zm0 0v13"/>',
    heart:
      '<path d="M20.8 5.7c-2.5-2.4-5.6-1.4-7.1.3L12 7.5 10.3 6C7.7 3.5 4.5 4.2 3.1 6.7c-1.8 3.2 1.2 6.4 3.1 8.2L12 20l5.8-5.1c2.9-2.6 5.3-5.8 3-9.2Z"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    spark: '<path d="m12 2 2 7 7 3-7 2-2 8-3-8-7-2 7-3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    close: '<path d="M5 5l14 14M19 5 5 19"/>',
    edit: '<path d="m4 17-1 4 4-1 12-12-3-3L4 17Zm11-11 3 3"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-1-10 7 7 0 0 1 13 3 4 4 0 0 1 0 7H7Z"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    leaf: '<path d="M20 4C6 4 3 12 4 20c8 1 16-2 16-16ZM4 20c4-7 8-10 13-12"/>',
    archive:
      '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 13h4"/>',
    palette:
      '<path d="M12 3a9 9 0 0 0 0 18h2a2 2 0 0 0 1-4 2 2 0 0 1 0-4h2a4 4 0 0 0 4-4 9 9 0 0 0-9-6Z"/><circle cx="7" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.leaf}</svg>`;
}
function flowerArt(color = "#d19caa", stage = 4, small = false) {
  const petals = Array.from(
    { length: 7 },
    (_, i) =>
      `<ellipse cx="80" cy="52" rx="17" ry="30" transform="rotate(${(i * 360) / 7} 80 80)" fill="${color}" opacity=".94"/>`,
  ).join("");
  return `<svg class="plant-art ${small ? "small" : ""}" viewBox="0 0 160 210" role="img" aria-label="꽃과 새싹 일러스트"><defs><radialGradient id="petalGlow"><stop stop-color="#faf5e7"/><stop offset="1" stop-color="#f3df9e"/></radialGradient></defs><path d="M78 185 C80 151 76 116 80 80" fill="none" stroke="#6d9277" stroke-width="5" stroke-linecap="round"/>${stage >= 1 ? '<path d="M80 148Q38 151 34 114Q69 113 80 148" fill="#9cb99e"/><path d="M78 164Q110 169 124 137Q92 134 78 164" fill="#bed2b8"/>' : ""}${stage >= 2 ? '<path d="M79 115Q44 115 44 87Q72 87 79 115" fill="#84a88b"/>' : ""}${stage >= 3 ? `<circle cx="80" cy="78" r="23" fill="${color}" opacity=".93"/>` : ""}${stage >= 4 ? `<g transform="translate(0,-2)">${petals}<circle cx="80" cy="80" r="15" fill="url(#petalGlow)"/><circle cx="76" cy="76" r="2" fill="#bca36c"/><circle cx="84" cy="83" r="2" fill="#bca36c"/></g>` : ""}<ellipse cx="80" cy="188" rx="34" ry="7" fill="#b5c5ab" opacity=".38"/><path d="M56 182h48l-5 20H61Z" fill="#bd9376"/><path d="M56 182h48" stroke="#ad816a" stroke-width="4" stroke-linecap="round"/></svg>`;
}
function navigation() {
  const tabs = [
    ["today", "오늘", "sun"],
    ["garden", "정원", "seed"],
    ["catalog", "도감", "book"],
    ["archive", "보관함", "inbox"],
  ];
  return `<nav class="bottom-nav" aria-label="화면 이동">${tabs.map(([id, label, ico]) => `<button type="button" class="nav-item ${tab === id ? "active" : ""}" data-action="tab" data-tab="${id}" aria-current="${tab === id ? "page" : "false"}">${icon(ico, 21)}<span>${label}</span></button>`).join("")}</nav>`;
}
function shell(content) {
  return `<div class="app-top"><div class="brand"><span class="brand-mark">✿</span> 온점<span class="brand-dot">.</span></div><div class="top-date">${formattedDate()}</div></div><main class="content">${content}</main>${navigation()}`;
}
function home() {
  const task = activeTask(state),
    remaining = state.tasks.filter((t) => t.status === "active").length;
  const pending = state.flowers.filter((f) => !f.registeredAt).length;
  const progress = (state.progress / GROWTH_STEPS) * 100;
  return `<div class="kicker">A LITTLE PEACE, ONE STEP AT A TIME</div><header class="hero-title"><h1>복잡한 마음은 내려놓고,<br/><em>하나씩 해봐요.</em></h1><p>오늘도 서두르지 않아도 괜찮아요.</p></header>
 <section class="garden-preview"><div class="garden-sun"></div><div class="garden-cloud cloud-left"></div><div class="garden-cloud cloud-right"></div><div class="garden-hills hill-left"></div><div class="garden-hills hill-right"></div><div class="plant-wrap">${flowerArt("#d9aaa4", Math.max(1, state.progress), false)}</div><div class="growth-tag">${icon("seed", 15)} 씨앗을 돌보는 중 · ${state.progress}/${GROWTH_STEPS}</div><div class="progress-track"><span style="width:${progress}%"></span></div></section>
 <section class="primary-card"><div class="card-overline"><span>${icon("spark", 15)} 지금의 한 걸음</span><span>${remaining ? `${remaining}개의 할 일` : "마음 정리 완료"}</span></div>
 ${
   task
     ? `<h2>${esc(task.title)}</h2><p class="subtle">지금은 이 한 가지만 생각해요.</p><button class="primary-action" data-action="finish" data-id="${esc(task.id)}">${icon("check", 21)} 끝냈어요 <span>↗</span></button><div class="secondary-actions"><button data-action="breakdown">${icon("edit", 16)} 더 작게</button><button data-action="postpone" data-id="${esc(task.id)}">${icon("clock", 16)} 나중에</button></div>`
     : `<h2>지금은 쉬어가도 좋아요.</h2><p class="subtle">새로운 생각이 떠오르면 편하게 적어보세요.</p><button class="primary-action" data-action="compose">${icon("plus", 21)} 생각 꺼내놓기</button>`
 }</section>
 <button class="thought-entry" data-action="compose"><div class="entry-icon">${icon("plus", 22)}</div><span><strong>머릿속을 비워볼까요?</strong><small>여러 가지를 한 번에 적어도 괜찮아요.</small></span>${icon("arrow", 18)}</button>
 <div class="section-label"><strong>오늘의 작은 기록</strong><span>쌓여가는 발자국</span></div><div class="stats-row"><div><strong>${state.completedTotal}</strong><small>지금까지 완료</small></div><div><strong>${getCatalog(state).length}</strong><small>등록한 꽃</small></div><div><strong>${state.tasks.filter((x) => x.status === "postponed").length}</strong><small>쉬어가는 씨앗</small></div></div>
 ${pending ? `<button class="pending-banner" data-action="tab" data-tab="garden"><span>🌷</span><span>등록을 기다리는 꽃 ${pending}송이가 있어요.</span>${icon("chevron", 18)}</button>` : ""}
 ${
   remaining > 1
     ? `<button class="inline-link" data-action="toggle-tasks">${showAllTasks ? "목록 접기" : "다음 할 일 살펴보기"} ${icon("chevron", 15)}</button>${
         showAllTasks
           ? `<div class="task-list">${state.tasks
               .filter((t) => t.status === "active")
               .sort((a, b) => a.order - b.order)
               .map(
                 (t, i) =>
                   `<div class="task-row"><span class="task-number">${i + 1}</span><span>${esc(t.title)}</span><button data-action="edit-task" data-id="${esc(t.id)}">수정</button><button data-action="move-task" data-id="${esc(t.id)}" data-direction="-1">위로</button><button data-action="move-task" data-id="${esc(t.id)}" data-direction="1">아래로</button><button data-action="delete-task" data-id="${esc(t.id)}">삭제</button></div>`,
               )
               .join("")}</div>`
           : ""
       }`
     : ""
 }
 `;
}
function garden() {
  const pending = state.flowers.filter((f) => !f.registeredAt),
    registered = state.flowers.filter((f) => f.registeredAt),
    season = getActiveSeason(new Date());
  return `<div class="page-heading"><div class="kicker">MY QUIET GARDEN</div><h1>나만의 작은 정원</h1><p>오늘의 작은 걸음이 천천히 피어나요.</p></div><section class="garden-big"><div class="floating-light light1"></div><div class="floating-light light2"></div><div class="garden-big-art">${flowerArt("#dfa7a1", Math.max(1, state.progress), false)}</div><div class="garden-big-message"><strong>${state.progress === 0 ? "새 씨앗이 기다리고 있어요" : state.progress === 1 ? "작은 새싹이 인사해요" : state.progress === 2 ? "잎사귀가 한 뼘 자랐어요" : "곧 꽃이 피어날 것 같아요"}</strong><span>한 걸음씩, 서두르지 않게</span></div><div class="step-dots">${Array.from({ length: GROWTH_STEPS }, (_, i) => `<span class="${i < state.progress ? "filled" : ""}"></span>`).join("")}</div></section>
 <div class="season-strip">${icon("sun", 19)} <span>${season ? `${esc(season.name)} · 특별한 꽃을 만날 수 있어요.` : "계절이 바뀌면 정원의 풍경도 달라져요."}</span></div>
 <div class="section-label"><strong>도감을 기다리는 꽃</strong><span>${pending.length}송이</span></div>
 ${pending.length ? `<div class="pending-list">${pending.map((f) => `<div class="pending-flower"><div class="flower-thumb" style="--petal:${esc(f.color)}">${flowerArt(f.color, 4, true)}</div><div class="flower-info"><strong>${esc(f.variantId === "normal" ? f.name : `${f.variantName} ${f.name}`)}</strong><small>${esc(f.quote)}</small><span>${f.seasonId ? "계절 한정 · " : ""}${f.variantId !== "normal" ? "특별한 색 · " : ""}${dayName(f.createdAt)} 개화</span></div><button class="register-btn" data-action="flower-detail" data-id="${esc(f.id)}">꽃말 카드 · 무료</button><button class="register-btn" data-action="register" data-id="${esc(f.id)}">${isNewEntry(state, f) ? "등록" : "간직"}</button></div>`).join("")}</div>` : `<div class="empty-state"><span>🍃</span><strong>아직 등록을 기다리는 꽃이 없어요.</strong><p>할 일을 ${GROWTH_STEPS}번 완료할 때마다 꽃이 피어나요.</p></div>`}
 <div class="section-label"><strong>이미 피어난 꽃</strong><span>${registered.length}송이</span></div>${
   registered.length
     ? `<div class="mini-flower-field">${registered
         .slice(0, 8)
         .map(
           (f) =>
             `<div style="--petal:${esc(f.color)}">${flowerArt(f.color, 4, true)}</div>`,
         )
         .join("")}</div>`
     : `<p class="subtle bottom-note">첫 꽃이 피면 이 자리에 머물게 됩니다.</p>`
 }`;
}
function catalog() {
  const found = getCatalog(state);
  return `<div class="page-heading"><div class="kicker">A BOOK OF SMALL MOMENTS</div><h1>꽃말을 간직하는 곳</h1><p>피워낸 꽃마다, 작은 이야기가 남아요.</p></div><div class="catalog-summary"><span>${icon("book", 20)} 내 꽃 도감</span><strong>${found.length}<small>종류의 꽃말</small></strong></div>
 ${found.length ? `<div class="catalog-grid">${found.map((f) => `<button class="catalog-item" data-action="flower-detail" data-id="${esc(f.id)}"><div class="catalog-flower" style="--petal:${esc(f.color)}">${flowerArt(f.color, 4, true)}</div><strong>${esc(f.variantId === "normal" ? f.name : `${f.variantName} ${f.name}`)}</strong><small>${esc(f.quote)}</small></button>`).join("")}</div>` : `<div class="catalog-blank"><div class="blank-flower">✿</div><h3>첫 번째 꽃말을 기다리고 있어요.</h3><p>아직 빈 페이지지만, 작은 걸음이 이곳을 채워줄 거예요.</p><button class="quiet-button" data-action="tab" data-tab="today">한 걸음 시작하기 ${icon("arrow", 16)}</button></div>`}
 <div class="catalog-note"><strong>작은 안내</strong><p>꽃말 카드는 온점.이 만든 창작 문장입니다. 전통적인 꽃말과는 다를 수 있어요.</p></div>`;
}
function archive() {
  const postponed = state.tasks.filter((t) => t.status === "postponed"),
    done = state.tasks
      .filter((t) => t.status === "done")
      .slice(-8)
      .reverse();
  return `<div class="page-heading"><div class="kicker">NOTHING IS EVER LOST</div><h1>아직 피지 않은 씨앗</h1><p>오늘 못한 일도 괜찮아요. 이곳에 잠시 머물러요.</p></div>
 <div class="archive-hero"><div>🌱</div><h2>서두를 필요 없어요.</h2><p>씨앗은 시들지 않고, 언제든 다시 시작할 수 있어요.</p></div>
 <div class="section-label"><strong>쉬어가는 씨앗</strong><span>${postponed.length}개</span></div>
 ${postponed.length ? `<div class="archive-list">${postponed.map((t) => `<div class="archive-item"><span class="little-seed">♧</span><span>${esc(t.title)}</span><button data-action="restore" data-id="${esc(t.id)}">이어하기</button></div>`).join("")}</div>` : `<div class="empty-state compact"><span>🌿</span><p>잠시 보관한 일이 없어요.</p></div>`}
 <div class="section-label"><strong>지나온 발자국</strong><span>최근 완료</span></div>${done.length ? `<div class="archive-list">${done.map((t) => `<div class="archive-item complete"><span>✓</span><span>${esc(t.title)}</span><small>${dayName(t.finishedAt)}</small></div>`).join("")}</div>` : `<p class="subtle bottom-note">완료한 일들이 여기에 차곡차곡 남아요.</p>`}
 <section class="settings"><h3>설정</h3><label><input type="checkbox" id="reduce-motion" ${state.reduceMotion ? "checked" : ""}/> 모션 줄이기</label><p><a href="/transfer/">백업 내보내기 · 모바일로 옮기기</a></p><div class="setting-line"><div><strong>PLUS 광고 제거 미리보기</strong><small>실제 결제 기능은 아닙니다.</small></div><label class="switch"><input type="checkbox" id="premium-demo" ${state.premiumDemo ? "checked" : ""}/><span></span></label></div><p>이 프로토타입은 개인정보를 브라우저에만 저장하며, AI·광고·결제 서버에는 연결되어 있지 않습니다.</p><button class="text-danger" data-action="reset">모든 로컬 데이터 초기화</button></section>`;
}
function render() {
  document.body.classList[state.reduceMotion ? "add" : "remove"](
    "reduce-motion",
  );
  root.innerHTML = shell(
    tab === "today"
      ? home()
      : tab === "garden"
        ? garden()
        : tab === "catalog"
          ? catalog()
          : archive(),
  );
  renderModal();
}
function renderModal() {
  if (!modal) {
    modalRoot.innerHTML = "";
    document.body.classList.remove("dialog-open");
    return;
  }
  document.body.classList.add("dialog-open");
  let content = "";
  if (modal.type === "compose")
    content = `<div class="modal-header"><div><div class="kicker">CLEAR YOUR MIND</div><h2>머릿속을 비워볼까요?</h2></div><button class="close-button" data-action="close" aria-label="닫기">${icon("close", 21)}</button></div><p class="modal-helper">해야 할 일, 생각나는 것들을 그대로 적어보세요. 완벽한 문장일 필요 없어요.</p><textarea id="thought-input" rows="5" placeholder="예) 세탁기 돌려야 하고, 서류도 내야 하고, 엄마한테 전화해야 해…">${esc(modal.draft || "")}</textarea><div class="hint">${icon("leaf", 16)} 입력 내용은 이 브라우저에만 저장됩니다.</div><button class="primary-action" data-action="save-thought">할 일로 정돈하기 ${icon("arrow", 18)}</button><button class="quiet-demo" data-action="demo-thought">예시 문장 채워보기</button><p class="modal-disclaimer">현재 버전은 AI가 아니라 간단한 문장 분리 규칙을 사용합니다. 저장 후 목록을 확인할 수 있습니다.</p>`;
  else if (modal.type === "review") {
    content = `<div class="modal-header"><h2>내가 할 일을 직접 골라요</h2><button data-action="close" aria-label="닫기">닫기</button></div><p>규칙 기반 분리 결과입니다. 수정·제외·순서 변경 후 확정해 주세요.</p>${modal.drafts.map((title, i) => `<label>${i + 1}번 할 일<input class="text-input" maxlength="500" data-review-index="${i}" aria-label="할 일 ${i + 1} 수정" value="${esc(title)}"/></label><div class="secondary-actions"><button data-action="remove-draft" data-index="${i}">제외</button><button data-action="move-draft" data-index="${i}" data-direction="-1" ${i === 0 ? "disabled" : ""}>위로</button><button data-action="move-draft" data-index="${i}" data-direction="1" ${i === modal.drafts.length - 1 ? "disabled" : ""}>아래로</button></div>`).join("")}<button class="quiet-button" data-action="add-draft">항목 더 적기</button><button class="primary-action" data-action="confirm-thought">검토한 할 일 추가</button>`;
  } else if (modal.type === "edit") {
    content = `<h2>할 일 제목 수정</h2><input class="text-input" id="edit-title" maxlength="500" aria-label="할 일 제목 수정" value="${esc(modal.title)}"/><button class="primary-action" data-action="save-edit" data-id="${esc(modal.id)}">수정 저장</button><button class="quiet-button" data-action="close">돌아가기</button>`;
  } else if (modal.type === "breakdown") {
    const t = activeTask(state);
    content = `<div class="modal-header"><div><div class="kicker">ONE SMALL STEP</div><h2>조금 더 작게 나눠볼까요?</h2></div><button class="close-button" data-action="close">${icon("close", 20)}</button></div><p class="modal-helper">현재 할 일: <strong>${esc(t?.title || "")}</strong></p><input id="small-step-input" class="text-input" placeholder="예) 이메일 앱만 열기"/><button class="primary-action" data-action="save-step">작은 단계로 바꾸기</button><p class="modal-disclaimer">원래 작업명은 기록에 남습니다. 자동으로 내용을 추정하지 않아요.</p>`;
  } else if (modal.type === "ad") {
    const f = state.flowers.find((x) => x.id === modal.id);
    content = `<div class="modal-header"><div><div class="kicker">KEEP THIS MOMENT</div><h2>꽃을 도감에 간직할까요?</h2></div><button class="close-button" data-action="close">${icon("close", 20)}</button></div><div class="ad-flower">${flowerArt(f?.color, 4, true)}<strong>${esc(f?.variantId === "normal" ? f?.name : `${f?.variantName} ${f?.name}`)}</strong></div><p class="modal-helper">첫 번째 도감 등록은 보상형 광고 1회로 열 수 있어요. 광고를 보지 않아도 꽃은 사라지지 않습니다.</p><div class="ad-placeholder">${icon("play", 18)} <span>실제 광고 SDK 미연동 · 테스트 모드</span></div><button class="primary-action" data-action="simulate-ad" data-id="${esc(f?.id)}">테스트: 광고 완료로 등록</button><button class="quiet-demo" data-action="close">나중에 등록하기</button><button class="quiet-demo" data-action="ad-unavailable">테스트: 광고 제공 안 됨</button><p class="modal-disclaimer">출시 시에는 광고 SDK의 실제 보상 검증이 성공한 경우에만 도감에 등록합니다.</p>`;
  } else if (modal.type === "flower") {
    const f = state.flowers.find((x) => x.id === modal.id);
    content = `<div class="modal-header"><div><div class="kicker">MY FLOWER STORY</div><h2>${esc(f?.name)}</h2></div><button class="close-button" data-action="close">${icon("close", 20)}</button></div><div class="flower-detail-art" style="--petal:${esc(f?.color)}">${flowerArt(f?.color, 4, false)}</div><div class="flower-detail"><small>${esc(f?.variantName || "기본")} · ${dayName(f?.createdAt)}</small><h3>“${esc(f?.quote)}”</h3><p>꽃을 피운 날의 작은 걸음: ${esc(f?.originTask || "내가 해낸 일")}</p><p class="modal-disclaimer">온점. 창작 문구 · 실제 식물학적 꽃말이 아닙니다.</p></div><button class="primary-action" data-action="copy-flower" data-id="${esc(f?.id)}">꽃말 문구 복사</button>`;
  } else if (modal.type === "reset")
    content = `<div class="modal-header"><div><h2>정말 처음으로 돌아갈까요?</h2></div><button class="close-button" data-action="close">${icon("close", 20)}</button></div><p class="modal-helper">생각 기록, 꽃, 도감, 미완료 씨앗이 이 브라우저에서 모두 지워집니다. 되돌릴 수 없어요.</p><button class="primary-action danger" data-action="confirm-reset">모든 데이터 삭제</button><button class="quiet-demo" data-action="close">취소</button>`;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close"><div class="modal-sheet" role="dialog" aria-modal="true" aria-label="온점. 대화상자"><div class="modal-grab"></div>${content}</div></div>`;
  if (modal.type === "compose") {
    setTimeout(() => document.getElementById("thought-input")?.focus(), 80);
  }
}
function register(id) {
  const f = state.flowers.find((x) => x.id === id);
  if (!f) return;
  if (!isNewEntry(state, f) || state.premiumDemo) {
    update(registerFlower(state, id), "꽃말 도감에 간직했어요.");
    return;
  }
  modal = { type: "ad", id };
  renderModal();
}
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.classList?.contains("modal-backdrop") && e.target !== el) return;
  const a = el.dataset.action,
    id = el.dataset.id;
  if (a === "tab") {
    tab = el.dataset.tab;
    modal = null;
    window.scrollTo({ top: 0, behavior: "auto" });
    render();
  }
  if (a === "finish") {
    update(finishTask(state, id), "한 걸음 해냈어요. 새싹이 기뻐하고 있어요.");
  }
  if (a === "postpone") {
    update(postponeTask(state, id), "씨앗을 보관함에 잠시 쉬게 했어요.");
  }
  if (a === "restore") {
    update(restoreTask(state, id), "씨앗을 다시 꺼냈어요.");
  }
  if (a === "compose") {
    modal = { type: "compose", draft: "" };
    renderModal();
  }
  if (a === "save-thought") {
    const val = document.getElementById("thought-input")?.value || "";
    const fragments = splitThought(val);
    if (!fragments.length) {
      toast("생각을 한 줄만 적어주세요.");
      return;
    }
    modal = { type: "review", original: val, drafts: fragments };
    renderModal();
  }
  if (a === "confirm-thought") {
    try {
      const drafts = modal.drafts;
      if (!drafts.some((t) => t.trim())) {
        toast("한 가지 할 일을 적어 주세요.");
        return;
      }
      update(
        addReviewed(state, drafts, { original: modal.original }),
        "검토한 할 일을 저장했어요.",
      );
      modal = null;
      tab = "today";
      render();
    } catch (e) {
      toast(e.message);
    }
  }
  if (a === "remove-draft") {
    modal.drafts.splice(Number(el.dataset.index), 1);
    renderModal();
  }
  if (a === "move-draft") {
    const i = Number(el.dataset.index),
      j = i + Number(el.dataset.direction);
    if (j >= 0 && j < modal.drafts.length) {
      [modal.drafts[i], modal.drafts[j]] = [modal.drafts[j], modal.drafts[i]];
      renderModal();
    }
  }
  if (a === "add-draft" && modal.drafts.length < 100) {
    modal.drafts.push("");
    renderModal();
  }
  if (a === "edit-task") {
    const task = state.tasks.find((t) => t.id === id);
    modal = { type: "edit", id, title: task.title };
    renderModal();
  }
  if (a === "save-edit") {
    try {
      update(editTask(state, id, document.getElementById("edit-title").value));
      modal = null;
      render();
    } catch (e) {
      toast(e.message);
    }
  }
  if (a === "move-task") {
    update(reorderTask(state, id, Number(el.dataset.direction)));
  }
  if (a === "delete-task") {
    update({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
  }

  if (a === "demo-thought") {
    const input = document.getElementById("thought-input");
    if (input)
      input.value =
        "세탁기 돌려야 하고\n엄마한테 전화해야 하고\n내일 제출할 서류 확인해야 해\n방 정리하기";
  }
  if (a === "toggle-tasks") {
    showAllTasks = !showAllTasks;
    render();
  }
  if (a === "breakdown") {
    modal = { type: "breakdown" };
    renderModal();
  }
  if (a === "save-step") {
    const text = document.getElementById("small-step-input")?.value || "";
    const task = activeTask(state);
    if (task && text.trim()) {
      update(
        addSmallStep(state, task.id, text),
        "좋아요. 더 작은 시작으로 바꿨어요.",
      );
      modal = null;
      render();
    } else toast("시작할 수 있는 작은 행동을 입력해 주세요.");
  }
  if (a === "close") {
    modal = null;
    renderModal();
  }
  if (a === "register") {
    register(id);
  }
  if (a === "ad-unavailable") {
    modal = null;
    renderModal();
    toast("광고가 없어요. 꽃은 그대로 보관됩니다.");
  }
  if (a === "simulate-ad") {
    update(
      registerFlower(state, id, { rewardVerified: true }),
      "꽃말 도감에 간직했어요.",
    );
    modal = null;
    render();
  }
  if (a === "flower-detail") {
    modal = { type: "flower", id };
    renderModal();
  }
  if (a === "copy-flower") {
    const f = state.flowers.find((x) => x.id === id);
    try {
      await navigator.clipboard.writeText(`${f?.name}\n${f?.quote}\n온점.`);
      toast("꽃말 문구를 복사했어요.");
    } catch {
      toast("이 브라우저에서는 복사 권한을 사용할 수 없어요.");
    }
  }
  if (a === "reset") {
    modal = { type: "reset" };
    renderModal();
  }
  if (a === "confirm-reset") {
    state = createInitialState();
    persist();
    tab = "today";
    modal = null;
    render();
    toast("처음 상태로 돌아왔어요.");
  }
});
document.addEventListener("input", (e) => {
  if (e.target.dataset?.reviewIndex !== undefined && modal?.type === "review")
    modal.drafts[Number(e.target.dataset.reviewIndex)] = e.target.value;
});
document.addEventListener("change", (e) => {
  if (e.target.id === "reduce-motion")
    update({ ...state, reduceMotion: e.target.checked });
  if (e.target.id === "premium-demo") {
    update(
      { ...state, premiumDemo: e.target.checked },
      "테스트용 설정이 변경됐어요.",
    );
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal) {
    modal = null;
    renderModal();
  }
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
render();
window.__ONJEOM_TEST__ = {
  getState: () => state,
  splitThought,
  createInitialState,
};
