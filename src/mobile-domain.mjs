/** Native extensions of the unmodified original pure domain. No SDK or network. */
import { validateDiary } from "./diary.mjs";
import {
  createInitialState,
  finishTask,
  postponeTask,
  restoreTask,
  registerFlower as originalRegister,
  FLOWERS,
  SEASONS,
  RARE_VARIANTS,
  getActiveSeason,
  todayLocal,
} from "./logic.mjs";
import {
  migrateState as readPreviousMobile,
  flowerInfo as previousFlowerInfo,
} from "./legacy-mobile.mjs";
import { chuseokAt, CHUSEOK_FLOWER } from "./seasonal.mjs";
import { validateJournals } from "./journal.mjs";
export { FLOWERS, SEASONS, RARE_VARIANTS };
export const SEASONAL = [...SEASONS.map((s) => s.flower), CHUSEOK_FLOWER];
export const SCHEMA_VERSION = 4;
export const localDate = todayLocal;
const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const initialState = () => ({
  ...createInitialState(),
  version: 4,
  journals: {},
  settings: { reduceMotion: false },
});
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
export function eventAt(day, calendar) {
  return (
    getActiveSeason(new Date(`${day}T12:00:00`)) || chuseokAt(day, calendar)
  );
}
export function addTasks(state, titles, { original = titles.join("\n") } = {}) {
  const clean = titles.map((t) => t.trim()).filter(Boolean);
  if (
    clean.length > 100 ||
    clean.some((t) => t.length > 500) ||
    original.length > 10000
  )
    throw Error("할 일은 한 번에 100개, 각 500자 이내로 입력해 주세요.");
  if (!clean.length) return state;
  const thoughtId = uid(),
    createdAt = new Date().toISOString();
  const order = Math.max(-1, ...state.tasks.map((t) => t.order)) + 1;
  return {
    ...state,
    thoughts: [...state.thoughts, { id: thoughtId, original, createdAt }],
    tasks: [
      ...state.tasks,
      ...clean.map((title, i) => ({
        id: uid(),
        thoughtId,
        title,
        createdAt,
        status: "active",
        order: order + i,
      })),
    ],
  };
}
export function editTask(state, id, title) {
  if (typeof title !== "string" || !title.trim() || title.trim().length > 500)
    throw Error("할 일을 1~500자로 적어 주세요.");
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id && t.status !== "done" ? { ...t, title: title.trim() } : t,
    ),
  };
}
export function reorderTask(state, id, direction) {
  const active = state.tasks
    .filter((t) => t.status === "active")
    .sort((a, b) => a.order - b.order);
  const index = active.findIndex((t) => t.id === id),
    target = index + direction;
  if (index < 0 || target < 0 || target >= active.length) return state;
  [active[index], active[target]] = [active[target], active[index]];
  const orders = new Map(active.map((t, i) => [t.id, i]));
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      orders.has(t.id) ? { ...t, order: orders.get(t.id) } : t,
    ),
  };
}
export function changeTask(state, id, action, parts = []) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || task.status === "done") return state;
  const ids = descendants(state.tasks, id);
  if (action === "restore")
    for (const ancestor of taskPath(state.tasks, id)) ids.add(ancestor.id);
  if (action === "delete") {
    const kept = state.tasks.filter(
      (t) => !ids.has(t.id) || t.status === "done",
    );
    const keptIds = new Set(kept.map((t) => t.id));
    return settleParents({
      ...state,
      tasks: kept.map((t) => {
        if (t.parentId && !keptIds.has(t.parentId)) {
          const { parentId, ...record } = t;
          return record;
        }
        return t;
      }),
    });
  }
  if (action === "restore" || action === "archive" || action === "later") {
    const status = action === "restore" ? "active" : "postponed";
    const offset = Math.max(-1, ...state.tasks.map((t) => t.order)) + 1;
    return {
      ...state,
      tasks: state.tasks.map((t) =>
        ids.has(t.id) && t.status !== "done"
          ? {
              ...t,
              status,
              ...(action === "restore" ? { order: offset + t.order } : {}),
            }
          : t,
      ),
    };
  }
  if (task.status !== "active") return state;
  if (action === "split") {
    if (state.tasks.some((t) => t.parentId === id))
      throw Error("기존 하위 행동을 먼저 살펴주세요.");
    const clean = parts.map((t) => t.trim()).filter(Boolean);
    if (
      !clean.length ||
      clean.length > 100 ||
      clean.some((t) => t.length > 500)
    )
      throw Error("작은 단계를 1~500자로 한 줄씩 적어 주세요.");
    if (taskPath(state.tasks, id).length >= 8)
      throw Error("단계는 8단계까지 나눌 수 있어요.");
    const order = Math.max(-1, ...state.tasks.map((t) => t.order)) + 1;
    return {
      ...state,
      tasks: [
        ...state.tasks,
        ...clean.map((title, i) => ({
          ...task,
          id: uid(),
          title,
          originalTitle: task.originalTitle || task.title,
          parentId: id,
          order: order + i,
        })),
      ],
    };
  }
  throw Error("지원하지 않는 작업입니다.");
}
export function completeTask(
  state,
  id,
  { day, random = Math.random, calendar, date = new Date() } = {},
) {
  if (!actionableTasks(state).some((t) => t.id === id)) return state;
  date = day ? new Date(`${day}T12:00:00`) : date;
  day = localDate(date);
  const checkedRandom = () => {
    const n = random();
    if (!(n >= 0 && n < 1)) throw Error("난수는 0 이상 1 미만이어야 합니다.");
    return n;
  };
  const event =
    state.progress === 3 && !getActiveSeason(date)
      ? chuseokAt(day, calendar)
      : null;
  const special = event && checkedRandom() < 0.24;
  const rewarded = finishTask(state, id, checkedRandom, date);
  const next = settleParents(rewarded);
  const tasks = [
    ...next.tasks.filter((t) => t.id !== id),
    next.tasks.find((t) => t.id === id),
  ];
  if (next.flowers.length === state.flowers.length) return { ...next, tasks };
  let bloom = next.flowers[0];
  if (special)
    bloom = {
      ...bloom,
      speciesId: CHUSEOK_FLOWER.id,
      name: CHUSEOK_FLOWER.name,
      emoji: CHUSEOK_FLOWER.emoji,
      baseColor: CHUSEOK_FLOWER.color,
      quote: CHUSEOK_FLOWER.quote,
      color: bloom.variantId === "normal" ? CHUSEOK_FLOWER.color : bloom.color,
      seasonId: "chuseok",
    };
  const achievements = state.tasks
    .filter((t) => t.status === "done" && !t.aggregate)
    .slice(-3)
    .map((t) => t.title);
  achievements.push(state.tasks.find((t) => t.id === id).title);
  return {
    ...next,
    tasks,
    flowers: [{ ...bloom, achievements }, ...next.flowers.slice(1)],
  };
}
export const flowerInfo = (f) => ({
  id: f.speciesId,
  name: f.name,
  meaning: f.quote,
  color: { id: f.variantId, name: f.variantName, hex: f.color },
});
export const registerFlower = (state, id, { reward = "unavailable" } = {}) =>
  originalRegister(state, id, { rewardVerified: reward === "earned-test" });
const validDay = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validDate = (value) =>
  validDay(value) ||
  (typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    validDay(value.slice(0, 10)) &&
    !Number.isNaN(Date.parse(value)));
const text = (value, max = 10000) =>
  typeof value === "string" && value.length <= max;
function convertPreviousMobile(input) {
  const old = readPreviousMobile(input);
  return {
    ...initialState(),
    completedTotal: old.completed,
    progress: old.completed % 4,
    premiumDemo: old.settings.plusTest,
    settings: { reduceMotion: old.settings.reduceMotion },
    tasks: old.tasks.map((t, i) => ({
      id: t.id,
      title: t.title,
      status: t.status === "seed" ? "postponed" : t.status,
      order: i,
      createdAt: null,
      ...(t.status === "done" ? { finishedAt: t.completedAt } : {}),
    })),
    flowers: [...old.flowers].reverse().map((f) => {
      const info = previousFlowerInfo(f);
      return {
        id: f.id,
        speciesId: f.species,
        name: info.name,
        emoji: "✿",
        baseColor: info.color.hex,
        quote: info.meaning,
        variantId: `legacy-${f.color}`,
        variantName: `이전 ${info.color.name}`,
        color: info.color.hex,
        seasonId: null,
        createdAt: f.bloomedAt,
        originTask: f.achievements.at(-1),
        registeredAt: f.registered ? f.bloomedAt : null,
        achievements: f.achievements,
        legacyMobile: true,
      };
    }),
  };
}
export function migrateState(input) {
  if (!input || typeof input !== "object")
    throw Error("올바른 백업이 아닙니다.");
  let data;
  if (
    (input.version === 1 || input.version === 2) &&
    Object.hasOwn(input, "completed")
  )
    data = convertPreviousMobile(input);
  else if (input.version === 1)
    data = {
      ...input,
      version: 3,
      settings: { reduceMotion: input.reduceMotion ?? false },
    };
  else data = input;
  if (data.version === 3) data = { ...data, version: 4 };
  // v3 releases did not have dated journal entries. Add them without touching any achievements.
  if (data.journals === undefined) data = { ...data, journals: {} };
  validateJournals(data.journals);
  if (
    data.version !== 4 ||
    !Array.isArray(data.thoughts) ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.flowers) ||
    !Number.isSafeInteger(data.completedTotal) ||
    data.completedTotal < 0 ||
    !Number.isInteger(data.progress) ||
    data.progress !== data.completedTotal % 4 ||
    typeof data.premiumDemo !== "boolean" ||
    typeof data.settings?.reduceMotion !== "boolean"
  )
    throw Error("지원하지 않거나 손상된 데이터입니다.");
  if (
    data.tasks.length > 100000 ||
    data.flowers.length > 25000 ||
    data.thoughts.length > 100000
  )
    throw Error("백업이 너무 큽니다.");
  const ids = new Set();
  const validId = (id) =>
    text(id, 200) && id.length > 0 && !ids.has(id) && !!ids.add(id);
  for (const thought of data.thoughts)
    if (
      !validId(thought.id) ||
      !text(thought.original, 10000) ||
      !validDate(thought.createdAt)
    )
      throw Error("생각 기록이 손상되었습니다.");
  for (const t of data.tasks)
    if (
      !validId(t.id) ||
      !text(t.title, 500) ||
      !t.title.trim() ||
      !["active", "postponed", "done"].includes(t.status) ||
      !Number.isFinite(t.order) ||
      (t.createdAt !== null && !validDate(t.createdAt)) ||
      (t.status === "done" && !validDate(t.finishedAt)) ||
      (t.originalTitle !== undefined && !text(t.originalTitle, 500))
    )
      throw Error("할 일 데이터가 손상되었습니다.");
  const knownSpecies = new Set([...FLOWERS, ...SEASONAL].map((f) => f.id));
  for (const f of data.flowers) {
    const legacy = f.legacyMobile === true;
    if (
      !validId(f.id) ||
      !(
        knownSpecies.has(f.speciesId) ||
        (legacy &&
          [
            "lily",
            "poppy",
            "violet",
            "forgetmenot",
            "christmas",
            "halloween",
            "newyear",
            "chuseok",
          ].includes(f.speciesId))
      ) ||
      !(legacy
        ? ["legacy-cream", "legacy-pink", "legacy-violet"].includes(f.variantId)
        : ["normal", ...RARE_VARIANTS.map((v) => v.id)].includes(
            f.variantId,
          )) ||
      !text(f.name, 100) ||
      !text(f.quote, 1000) ||
      !text(f.variantName, 100) ||
      !/^#[\da-fA-F]{6}$/.test(f.color) ||
      !/^#[\da-fA-F]{6}$/.test(f.baseColor) ||
      !validDate(f.createdAt) ||
      (f.registeredAt !== null && !validDate(f.registeredAt)) ||
      !text(f.originTask, 500) ||
      (f.achievements !== undefined &&
        (!Array.isArray(f.achievements) ||
          f.achievements.length > 4 ||
          f.achievements.some((t) => !text(t, 500))))
    )
      throw Error("꽃 데이터가 손상되었습니다.");
  }
  validateTree(data.tasks);
  validateDiary(data.diary);
  // The original exposes deleteTask, including completed records; do not invent missing history.
  if (
    data.tasks.filter((t) => t.status === "done" && !t.aggregate).length >
      data.completedTotal ||
    data.flowers.length !== Math.floor(data.completedTotal / 4)
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
export function importBackup(value) {
  if (typeof value !== "string" || value.length > 20_000_000)
    throw Error("백업이 너무 큽니다.");
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw Error("백업 JSON을 확인해 주세요.");
  }
  if (parsed.format === "onjeom-backup" && parsed.version === 1)
    return migrateState(parsed.data);
  if (parsed.version === 1 && Array.isArray(parsed.thoughts))
    return migrateState(parsed);
  throw Error("온점. 백업 파일이 아닙니다.");
}

// Additive v3 tree extension: old tasks remain roots; no invented historical links.
export function descendants(tasks, id) {
  const ids = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const t of tasks)
      if (t.parentId && ids.has(t.parentId) && !ids.has(t.id)) {
        ids.add(t.id);
        changed = true;
      }
  }
  return ids;
}
export function taskPath(
  tasks,
  id,
  byId = new Map(tasks.map((t) => [t.id, t])),
) {
  const path = [];
  const seen = new Set();
  for (let t = byId.get(id); t; t = byId.get(t.parentId)) {
    if (seen.has(t.id)) throw Error("작업 계층에 순환이 있습니다.");
    seen.add(t.id);
    path.unshift(t);
  }
  return path;
}
export function actionableTasks(state) {
  const byId = new Map(state.tasks.map((t) => [t.id, t]));
  const paths = new Map();
  const path = (id) => {
    if (!paths.has(id)) paths.set(id, taskPath(state.tasks, id, byId));
    return paths.get(id);
  };
  const parents = new Set(state.tasks.map((t) => t.parentId).filter(Boolean));
  return state.tasks
    .filter(
      (t) =>
        t.status === "active" &&
        !parents.has(t.id) &&
        path(t.id).every((p) => p.status === "active"),
    )
    .sort((a, b) => {
      const ap = path(a.id),
        bp = path(b.id);
      for (let i = 0; i < Math.min(ap.length, bp.length); i++) {
        if (ap[i].order !== bp[i].order) return ap[i].order - bp[i].order;
      }
      return 0;
    });
}
export function taskProgress(state, id) {
  const ids = descendants(state.tasks, id),
    parents = new Set(state.tasks.map((t) => t.parentId));
  const leaves = state.tasks.filter((t) => ids.has(t.id) && !parents.has(t.id));
  return {
    done: leaves.filter((t) => t.status === "done").length,
    total: leaves.length,
  };
}
function settleParents(state) {
  let tasks = state.tasks.map((t) => ({ ...t }));
  const childMap = new Map();
  for (const t of tasks)
    if (t.parentId) {
      if (!childMap.has(t.parentId)) childMap.set(t.parentId, []);
      childMap.get(t.parentId).push(t);
    }
  const parents = tasks.filter((t) => childMap.has(t.id));
  for (let pass = 0; pass < 8; pass++)
    for (const t of parents) {
      const children = childMap.get(t.id);
      if (
        children.length &&
        t.status !== "done" &&
        children.every((c) => c.status === "done")
      ) {
        t.status = "done";
        t.aggregate = true;
        t.finishedAt = children.at(-1).finishedAt;
      }
    }
  return { ...state, tasks };
}
function validateTree(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const childMap = new Map();
  for (const t of tasks)
    if (t.parentId) {
      if (!childMap.has(t.parentId)) childMap.set(t.parentId, []);
      childMap.get(t.parentId).push(t);
    }
  for (const t of tasks) {
    if (
      t.parentId !== undefined &&
      (typeof t.parentId !== "string" || !byId.has(t.parentId))
    )
      throw Error("상위 목표가 없는 작업입니다.");
    let depth = 0;
    const seen = new Set();
    for (let a = t; a; a = byId.get(a.parentId)) {
      if (seen.has(a.id) || ++depth > 8)
        throw Error("작업 계층에 순환이 있거나 너무 깊습니다.");
      seen.add(a.id);
    }
    const children = childMap.get(t.id) || [];
    if (t.aggregate !== undefined && t.aggregate !== true)
      throw Error("잘못된 목표 완료 표시입니다.");
    if (children.length && t.status === "done" && !t.aggregate)
      throw Error("목표 완료 표시가 없습니다.");
    if (t.aggregate && (!children.length || t.status !== "done"))
      throw Error("목표 완료 기록이 손상되었습니다.");
    if (
      children.length &&
      (t.status === "done") !== children.every((c) => c.status === "done")
    )
      throw Error("상하위 완료 상태가 맞지 않습니다.");
  }
}
