import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import DiaryPaper from "./DiaryPaper";
import PlantGrowth from "./PlantGrowth";
import { diaryForDay } from "../journal.mjs";
type Props = {
  day: string;
  season: string;
  state: any;
  current?: { title: string };
  remaining: number;
  progress: number;
  reduceMotion: boolean;
  onSave: (day: string, text: string, mood: string | null) => void;
  onCompose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onGarden: () => void;
  onHistory: () => void;
};
export default function DiaryHome({
  day,
  season,
  state,
  current,
  remaining,
  progress,
  reduceMotion,
  onSave,
  onCompose,
  onStart,
  onComplete,
  onGarden,
  onHistory,
}: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const record = diaryForDay(state, day);
  const completed = record.tasks.length;
  const dateLabel = day.slice(5, 7) + "월 " + day.slice(8, 10) + "일";
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.kicker}>{dateLabel} · 오늘의 온점.</Text>
          <Text accessibilityRole="header" style={s.title}>
            하루의 한 페이지
          </Text>
        </View>
        <Pressable
          onPress={onHistory}
          accessibilityRole="button"
          style={s.history}
        >
          <Text style={s.historyText}>지난 기록 ›</Text>
        </Pressable>
      </View>
      <View style={[s.columns, wide && s.wide]}>
        <View style={s.diary}>
          <DiaryPaper day={day} entry={record.journal} onSave={onSave} />
          <View style={s.paperFooter}>
            <Text style={s.meta}>✿ 오늘 {completed}개의 작은 행동</Text>
            <Text style={s.meta}>나의 페이스로</Text>
          </View>
        </View>
        <View style={s.side}>
          <PlantGrowth
            progress={progress}
            reduceMotion={reduceMotion}
            season={season}
          />
          <View style={s.tasks}>
            <View style={s.taskTitle}>
              <Text style={s.subheading}>오늘의 한 걸음</Text>
              <Text style={s.counter}>{remaining}개 남았어요</Text>
            </View>
            {current ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={onStart}
                  style={s.taskRow}
                >
                  <View style={s.circle} />
                  <Text style={s.taskText} numberOfLines={2}>
                    {current.title}
                  </Text>
                  <Text style={s.go}>›</Text>
                </Pressable>
                <View style={s.actions}>
                  <Pressable
                    onPress={onComplete}
                    style={s.complete}
                    accessibilityRole="button"
                  >
                    <Text style={s.completeText}>✓ 완료했어요</Text>
                  </Pressable>
                  <Pressable
                    onPress={onStart}
                    style={s.start}
                    accessibilityRole="button"
                  >
                    <Text style={s.startText}>한 걸음 모드</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={s.empty}>
                아직 할 일이 없어요. 떠오르는 생각을 적어보세요.
              </Text>
            )}
            <Pressable
              onPress={onCompose}
              style={s.add}
              accessibilityRole="button"
            >
              <Text style={s.addText}>＋ 생각 꺼내어 정리하기</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onGarden}
            accessibilityRole="button"
            style={s.toGarden}
          >
            <Text style={s.gardenLink}>기억의 정원 살펴보기 ↗</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 18, paddingBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 0.3,
    color: "#84907F",
    marginBottom: 5,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    color: "#2E4836",
    fontWeight: "700",
    letterSpacing: -1,
  },
  history: { minHeight: 44, justifyContent: "center" },
  historyText: { fontSize: 13, color: "#59725E" },
  columns: { gap: 14 },
  wide: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  diary: { flex: 1, minWidth: 0, gap: 8 },
  paperFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  meta: { fontSize: 11, color: "#7F8C78" },
  side: { flex: 1, minWidth: 0, gap: 13 },
  tasks: { paddingTop: 3, gap: 13 },
  taskTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subheading: { fontSize: 16, fontWeight: "600", color: "#385240" },
  counter: { fontSize: 12, color: "#91A08F" },
  taskRow: {
    borderBottomWidth: 1,
    borderColor: "#DEDCCF",
    paddingVertical: 11,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    minHeight: 48,
  },
  circle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#849B86",
  },
  taskText: { fontSize: 15, color: "#3B5542", lineHeight: 22, flex: 1 },
  go: { fontSize: 23, color: "#98A593" },
  actions: { flexDirection: "row", gap: 9 },
  complete: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#5C8164",
    alignItems: "center",
    justifyContent: "center",
  },
  completeText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  start: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B6C7B2",
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { fontSize: 13, color: "#51745A" },
  empty: { fontSize: 13, color: "#879380", lineHeight: 22 },
  add: {
    minHeight: 49,
    borderRadius: 15,
    backgroundColor: "#E9EDDF",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { fontSize: 14, color: "#4F6F55", fontWeight: "600" },
  toGarden: { paddingVertical: 9, alignItems: "center" },
  gardenLink: { fontSize: 12, color: "#7A9277" },
});
