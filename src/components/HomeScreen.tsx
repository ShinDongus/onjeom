import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import GardenScene from "./GardenScene";
type Props = {
  season: string;
  day: string;
  progress: number;
  completed: number;
  flowers: number;
  current?: { title: string };
  remaining: number;
  onCompose: () => void;
  onStart: () => void;
  onManage: () => void;
  onGarden: () => void;
};
export default function HomeScreen({
  season,
  day,
  progress,
  flowers,
  current,
  remaining,
  onCompose,
  onStart,
  onManage,
  onGarden,
}: Props) {
  const { height } = useWindowDimensions();
  return (
    <View style={s.page}>
      <View style={s.heading}>
        <Text style={s.date}>
          {Number(day.slice(5, 7))}월 {Number(day.slice(8))}일, 나의 작은 온실
        </Text>
        <Text accessibilityRole="header" style={s.title}>
          {current
            ? "오늘도, 나의 속도로."
            : "생각을 내려놓으면,\n하루가 피어나요."}
        </Text>
      </View>
      <GardenScene
        season={season}
        progress={progress}
        height={Math.max(160, Math.min(340, height - 510))}
      />
      <View style={s.dock}>
        <View style={s.dockTop}>
          <View style={s.growth} accessibilityLabel={`현재 성장 ${progress}/4`}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[s.pip, i < progress && s.pipDone]} />
            ))}
            <Text style={s.stage}>
              {["씨앗", "새싹", "잎사귀", "봉오리"][progress]}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="오늘의 정원 보기"
            onPress={onGarden}
            style={s.quiet}
          >
            <Text style={s.gardenLink}>
              나의 정원 {flowers ? `· ${flowers}` : ""} ›
            </Text>
          </Pressable>
        </View>
        {current ? (
          <>
            <View style={s.taskRow}>
              <View style={s.taskMark}>
                <Text style={s.markText}>01</Text>
              </View>
              <View style={s.taskBody}>
                <Text style={s.kicker}>지금의 한 가지</Text>
                <Text numberOfLines={2} style={s.task}>
                  {current.title}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="지금 할 일 이어서 하기"
              onPress={onStart}
              style={({ pressed }) => [s.primary, pressed && s.pressed]}
            >
              <Text style={s.primaryText}>이 한 걸음 시작하기</Text>
              <Text style={s.arrow}>→</Text>
            </Pressable>
            <View style={s.links}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="생각 꺼내놓기"
                onPress={onCompose}
                style={s.quiet}
              >
                <Text style={s.gardenLink}>＋ 생각 꺼내놓기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="할 일 살펴보기·수정"
                onPress={onManage}
                style={s.quiet}
              >
                <Text style={s.gardenLink}>남은 일 {remaining}개 ›</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={s.emptyTitle}>지금, 어떤 생각이 있나요?</Text>
            <Text style={s.description}>여기에 두고, 하나씩 꺼내 보아요.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="생각 꺼내놓기"
              onPress={onCompose}
              style={({ pressed }) => [s.primary, pressed && s.pressed]}
            >
              <Text style={s.primaryText}>＋ 생각 꺼내놓기</Text>
              <Text style={s.arrow}>→</Text>
            </Pressable>
            {!!remaining && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="할 일 살펴보기·수정"
                onPress={onManage}
                style={s.quiet}
              >
                <Text style={s.gardenLink}>남은 일 {remaining}개</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { marginHorizontal: -20, paddingBottom: 4 },
  heading: {
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 9,
    backgroundColor: "#f4f3e9",
  },
  date: { fontSize: 11, color: "#7d8a74", letterSpacing: 0.4 },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: "600",
    letterSpacing: -1.1,
    color: "#334b3a",
  },
  dock: {
    marginHorizontal: 16,
    marginTop: -18,
    padding: 20,
    paddingTop: 8,
    borderRadius: 28,
    gap: 10,
    backgroundColor: "#fffdf5",
    shadowColor: "#53654a",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  dockTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeede",
    marginBottom: 6,
  },
  growth: { flexDirection: "row", alignItems: "center", gap: 4 },
  pip: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#e4e8d8" },
  pipDone: { backgroundColor: "#6c8962" },
  stage: { marginLeft: 5, fontSize: 11, color: "#74816a" },
  quiet: { minHeight: 44, justifyContent: "center" },
  gardenLink: { fontSize: 12, color: "#63765c" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
  },
  taskMark: {
    width: 38,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e1e5d7",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5eb",
  },
  markText: { fontSize: 12, color: "#879378" },
  taskBody: { flex: 1, gap: 5 },
  kicker: { fontSize: 11, color: "#8a957f" },
  task: { fontSize: 18, lineHeight: 27, fontWeight: "600", color: "#344c3b" },
  primary: {
    backgroundColor: "#4b6b50",
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#38593c",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  primaryText: { fontSize: 16, fontWeight: "600", color: "#fffef3" },
  arrow: { color: "#d9e3cb", fontSize: 21 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#344c3b" },
  description: {
    fontSize: 13,
    color: "#85917a",
    lineHeight: 22,
    marginBottom: 8,
  },
});
