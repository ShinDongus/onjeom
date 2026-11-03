// Frozen migration reader for the earlier mobile v1/v2 format. Never use its old growth/calendar rules for new actions.
/** Pure domain layer; no timers, network, storage, or entitlement-dependent odds. */
export const FLOWERS = [
  ["daisy", "데이지", "작은 기쁨"],
  ["cosmos", "코스모스", "조화"],
  ["tulip", "튤립", "따뜻한 마음"],
  ["rose", "장미", "사랑"],
  ["lavender", "라벤더", "평온"],
  ["sunflower", "해바라기", "응원"],
  ["hydrangea", "수국", "진심"],
  ["lily", "백합", "새로운 시작"],
  ["poppy", "양귀비", "위로"],
  ["violet", "제비꽃", "소박한 행복"],
  ["camellia", "동백", "기다림"],
  ["forgetmenot", "물망초", "기억"],
].map(([id, name, meaning]) => ({ id, name, meaning }));
export const SEASONAL = [
  { id: "christmas", name: "크리스마스 로즈", meaning: "겨울의 위로" },
  { id: "halloween", name: "달빛 금잔화", meaning: "다정한 용기" },
  { id: "newyear", name: "새해 수선화", meaning: "새로운 출발" },
  { id: "chuseok", name: "한가위 구절초", meaning: "넉넉한 마음" },
];
export const COLORS = [
  { id: "cream", name: "크림", hex: "#f1d9a4" },
  { id: "pink", name: "분홍", hex: "#d89caa" },
  { id: "violet", name: "희귀 보랏빛", hex: "#a694ce" },
];
export const SCHEMA_VERSION = 2;
const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const localDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function seasonAt(day) {
  const month = Number(day.slice(5, 7));
  return month >= 3 && month <= 5
    ? "봄"
    : month >= 6 && month <= 8
      ? "여름"
      : month >= 9 && month <= 11
        ? "가을"
        : "겨울";
}
export function eventAt(day) {
  const md = day.slice(5);
  if (md >= "12-20" && md <= "12-26") return SEASONAL[0];
  if (md >= "10-25" && md <= "10-31") return SEASONAL[1];
  if (md >= "01-01" && md <= "01-07") return SEASONAL[2];
  // Lunar 8/15; ICU's Chinese calendar shares these modern Korean lunar dates.
  const lunar = new Intl.DateTimeFormat("en-u-ca-chinese", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(`${day}T12:00:00+09:00`));
  if (
    lunar.find((p) => p.type === "month")?.value === "8" &&
    ["14", "15", "16"].includes(lunar.find((p) => p.type === "day")?.value)
  )
    return SEASONAL[3];
  return null;
}
export function initialState() {
  return {
    version: 2,
    tasks: [],
    flowers: [],
    completed: 0,
    settings: { reduceMotion: false, plusTest: false },
  };
}
export function splitThoughts(text) {
  const items = text
    .split(/\n|[.!?。]+|[,;]|(?:그리고|그다음|다음으로)\s*/u)
    .map((s) => s.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "").trim())
    .filter(Boolean);
  if (items.length > 100)
    throw Error("한 번에 100개 이하의 생각을 나눠 주세요.");
  return items;
}
export function addTasks(state, titles) {
  const clean = titles.map((t) => t.trim()).filter(Boolean);
  if (clean.length > 100 || clean.some((t) => t.length > 500))
    throw Error("할 일은 한 번에 100개, 각 500자 이내로 입력해 주세요.");
  return {
    ...state,
    tasks: [
      ...state.tasks,
      ...clean.map((title) => ({
        id: uid(),
        title,
        status: "active",
        completedAt: null,
      })),
    ],
  };
}
export function changeTask(state, id, action, parts = []) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || task.status === "done") return state;
  if (action === "restore")
    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: "active" } : t,
      ),
    };
  if (task.status !== "active") return state;
  if (action === "archive")
    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: "seed" } : t,
      ),
    };
  if (action === "later")
    return {
      ...state,
      tasks: [...state.tasks.filter((t) => t.id !== id), task],
    };
  if (action === "split") {
    if (!parts.some((t) => t.trim()))
      throw Error("작은 단계 하나를 적어 주세요.");
    const added = addTasks(state, parts).tasks.slice(state.tasks.length);
    return {
      ...state,
      tasks: state.tasks.flatMap((t) => (t.id === id ? added : [t])),
    };
  }
  throw Error("지원하지 않는 작업입니다.");
}
export function completeTask(
  state,
  id,
  { day = localDate(), random = Math.random } = {},
) {
  if (!state.tasks.some((t) => t.id === id && t.status === "active"))
    return state;
  const completed = state.completed + 1;
  let flowers = state.flowers;
  if (completed % 4 === 0) {
    const pick = random();
    const colorRoll = random();
    if (!(pick >= 0 && pick < 1 && colorRoll >= 0 && colorRoll < 1))
      throw Error("난수는 0 이상 1 미만이어야 합니다.");
    const special = eventAt(day);
    const species = special || FLOWERS[Math.floor(pick * FLOWERS.length)];
    const color =
      colorRoll < 0.05 ? COLORS[2] : colorRoll < 0.525 ? COLORS[0] : COLORS[1];
    const achievements = state.tasks
      .filter((t) => t.status === "done")
      .slice(-3)
      .map((t) => t.title);
    achievements.push(state.tasks.find((t) => t.id === id).title);
    flowers = [
      ...flowers,
      {
        id: uid(),
        species: species.id,
        color: color.id,
        bloomedAt: day,
        registered: false,
        achievements,
      },
    ];
  }
  return {
    ...state,
    completed,
    flowers,
    tasks: [
      ...state.tasks.filter((t) => t.id !== id),
      {
        ...state.tasks.find((t) => t.id === id),
        status: "done",
        completedAt: day,
      },
    ],
  };
}
export const flowerInfo = (f) => ({
  ...[...FLOWERS, ...SEASONAL].find((s) => s.id === f.species),
  color: COLORS.find((c) => c.id === f.color),
});
export function registerFlower(state, id, { reward = "unavailable" } = {}) {
  const flower = state.flowers.find((f) => f.id === id);
  if (!flower || flower.registered) return state;
  const duplicate = state.flowers.some(
    (f) =>
      f.registered && f.species === flower.species && f.color === flower.color,
  );
  if (!state.settings.plusTest && !duplicate && reward !== "earned-test")
    return state;
  return {
    ...state,
    flowers: state.flowers.map((f) =>
      f.id === id ? { ...f, registered: true } : f,
    ),
  };
}
export function migrateState(input) {
  if (!input || typeof input !== "object")
    throw Error("올바른 백업이 아닙니다.");
  const data =
    input.version === 1
      ? {
          ...input,
          version: 2,
          settings: { reduceMotion: false, plusTest: false, ...input.settings },
        }
      : input;
  if (
    data.version !== 2 ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.flowers) ||
    !Number.isSafeInteger(data.completed) ||
    data.completed < 0 ||
    typeof data.settings?.reduceMotion !== "boolean" ||
    typeof data.settings?.plusTest !== "boolean"
  )
    throw Error("지원하지 않거나 손상된 데이터입니다.");
  if (data.tasks.length > 100000 || data.flowers.length > 25000)
    throw Error("백업이 너무 큽니다.");
  const ids = new Set();
  const validId = (id) =>
    typeof id === "string" && id.length > 0 && !ids.has(id) && !!ids.add(id);
  const validDay = (day) =>
    typeof day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day)) &&
    new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
  for (const t of data.tasks)
    if (
      !validId(t.id) ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      t.title.length > 500 ||
      !["active", "seed", "done"].includes(t.status) ||
      (t.status === "done" ? !validDay(t.completedAt) : t.completedAt !== null)
    )
      throw Error("할 일 데이터가 손상되었습니다.");
  for (const f of data.flowers)
    if (
      !validId(f.id) ||
      ![...FLOWERS, ...SEASONAL].some((s) => s.id === f.species) ||
      !COLORS.some((c) => c.id === f.color) ||
      !validDay(f.bloomedAt) ||
      typeof f.registered !== "boolean" ||
      !Array.isArray(f.achievements) ||
      f.achievements.length !== 4 ||
      f.achievements.some((t) => typeof t !== "string" || t.length > 500)
    )
      throw Error("꽃 데이터가 손상되었습니다.");
  if (
    data.tasks.filter((t) => t.status === "done").length !== data.completed ||
    data.flowers.length !== Math.floor(data.completed / 4)
  )
    throw Error("성취 기록이 일치하지 않습니다.");
  return JSON.parse(JSON.stringify(data));
}
export const exportBackup = (state) =>
  JSON.stringify(
    { format: "onjeom-backup", version: 1, data: migrateState(state) },
    null,
    2,
  );
export function importBackup(text) {
  if (text.length > 20_000_000) throw Error("백업이 너무 큽니다.");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Error("백업 JSON을 확인해 주세요.");
  }
  if (parsed.format !== "onjeom-backup" || parsed.version !== 1)
    throw Error("온점. 백업 파일이 아닙니다.");
  return migrateState(parsed.data);
}
