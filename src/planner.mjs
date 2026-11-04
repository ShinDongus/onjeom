import { splitThought } from "./logic.mjs";
import { addTasks } from "./mobile-domain.mjs";
/** Suggestions only. Indentation is reviewed before any task is saved. */
export function rulePlan(text) {
  return splitThought(text).flatMap((title) => [
    title,
    `  ${title}에 필요한 것 하나 확인하기`,
    `  ${title}`,
  ]);
}
export function addPlan(state, lines, options) {
  if (!Array.isArray(lines) || lines.length > 100)
    throw Error("한 번에 100개 단계까지 정리할 수 있어요.");
  let next = state;
  const stack = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const spaces = line.match(/^ */)[0].length;
    if (spaces % 2 || spaces > 14)
      throw Error("하위 단계는 공백 두 칸씩 들여써 주세요.");
    const depth = spaces / 2;
    if (depth > stack.length) throw Error("상위 목표를 먼저 적어 주세요.");
    const before = next.tasks.length;
    next = addTasks(next, [line.trim()], { original: "" });
    const task = next.tasks[before];
    if (depth) {
      task.parentId = stack[depth - 1];
    }
    stack[depth] = task.id;
    stack.length = depth + 1;
  }
  // One source record per reviewed capture, including the empty-plan case.
  const newIds = new Set(
    next.thoughts.slice(state.thoughts.length).map((t) => t.id),
  );
  const source = next.thoughts[state.thoughts.length];
  if (!source) return state;
  return {
    ...next,
    thoughts: [
      ...state.thoughts,
      { ...source, original: options?.original || lines.join("\n") },
    ],
    tasks: next.tasks.map((t) =>
      newIds.has(t.thoughtId) ? { ...t, thoughtId: source.id } : t,
    ),
  };
}
export function flattenPlan(tasks, depth = 0) {
  if (!tasks.length) return [];
  if (depth > 7) throw Error("AI 단계가 너무 깊습니다.");
  return tasks.flatMap((t) => [
    "  ".repeat(depth) + t.title,
    ...flattenPlan(t.children || [], depth + 1),
  ]);
}
export function planDepth(line) {
  return Math.floor((line.match(/^ */)?.[0].length || 0) / 2);
}
function branchEnd(lines, index) {
  let end = index + 1;
  while (end < lines.length && planDepth(lines[end]) > planDepth(lines[index]))
    end++;
  return end;
}
export function removePlanBranch(lines, index) {
  return [...lines.slice(0, index), ...lines.slice(branchEnd(lines, index))];
}
export function shiftPlanBranch(lines, index, direction) {
  const depth = planDepth(lines[index]),
    end = branchEnd(lines, index);
  if (direction < 0 && depth > 0) {
    let parent = index - 1;
    while (parent >= 0 && planDepth(lines[parent]) >= depth) parent--;
    const parentEnd = branchEnd(lines, parent);
    const lifted = lines
      .slice(index, end)
      .map((line) => "  ".repeat(planDepth(line) - 1) + line.trim());
    return [
      ...lines.slice(0, index),
      ...lines.slice(end, parentEnd),
      ...lifted,
      ...lines.slice(parentEnd),
    ];
  }
  if (
    depth + direction < 0 ||
    depth + direction > 7 ||
    (direction > 0 && (!index || planDepth(lines[index - 1]) < depth))
  )
    return lines;
  return lines.map((line, i) =>
    i >= index && i < end
      ? "  ".repeat(planDepth(line) + direction) + line.trim()
      : line,
  );
}
export function movePlanBranch(lines, index, direction) {
  const depth = planDepth(lines[index]),
    end = branchEnd(lines, index);
  if (direction < 0) {
    let prev = index - 1;
    while (prev >= 0 && planDepth(lines[prev]) > depth) prev--;
    if (prev < 0 || planDepth(lines[prev]) !== depth) return lines;
    return [
      ...lines.slice(0, prev),
      ...lines.slice(index, end),
      ...lines.slice(prev, index),
      ...lines.slice(end),
    ];
  }
  if (end >= lines.length || planDepth(lines[end]) !== depth) return lines;
  const nextEnd = branchEnd(lines, end);
  return [
    ...lines.slice(0, index),
    ...lines.slice(end, nextEnd),
    ...lines.slice(index, end),
    ...lines.slice(nextEnd),
  ];
}
