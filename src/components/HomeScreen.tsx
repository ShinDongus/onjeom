import React, { useState } from "react";
import {
  Pressable,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { BotanicalSticker } from "./PaperTexture";
import { diary, ink, sage, muted, line } from "./diary-theme";
type Props = {
  day: string;
  progress: number;
  current?: { title: string };
  remaining: number;
  completed: { id: string; title: string }[];
  thought: string;
  latestThought?: string;
  mood?: string | null;
  onAI?: () => void;
  onCancelAI?: () => void;
  aiBusy?: boolean;
  saved: boolean;
  busy: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onOrganize: () => void;
  onStart: () => void;
  onManage: () => void;
  onSeeds: () => void;
};
export default function HomeScreen({
  day,
  progress,
  current,
  remaining,
  completed,
  thought,
  latestThought,
  mood,
  onAI,
  onCancelAI,
  aiBusy,
  saved,
  busy,
  onChange,
  onSave,
  onOrganize,
  onStart,
  onManage,
  onSeeds,
}: Props) {
  const { height } = useWindowDimensions();
  const [writingFocus, setWritingFocus] = useState(false);
  const date = new Date(`${day}T12:00:00`),
    weekday = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ][date.getDay()];
  const writingHeight = Math.max(130, Math.min(220, height - 600));
  return (
    <View style={s.page} testID="diary-home">
      <View style={s.dateRow}>
        <View>
          <Text style={diary.eyebrow}>
            {date.getFullYear()} · {date.getMonth() + 1}월의 페이지
          </Text>
          <View style={s.dayRow}>
            <Text accessibilityRole="header" style={s.date}>
              {date.getMonth() + 1}월 {date.getDate()}일
            </Text>
            <Text style={s.weekday}>{weekday}</Text>
          </View>
        </View>
        <BotanicalSticker size={61} species="cosmos" />
      </View>
      <Text style={s.motto}>
        반듯하지 않은 하루도, 나의 한 페이지.{mood ? ` · ${mood}` : ""}
      </Text>
      <View style={s.writing}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {Array.from({ length: Math.floor(writingHeight / 30) }, (_, i) => (
            <View key={i} style={[s.rule, { top: 29 + i * 30 }]} />
          ))}
        </View>
        {!!latestThought && (
          <Text
            accessibilityLabel="오늘 남긴 생각"
            numberOfLines={2}
            style={{ height: 60, fontSize: 15, lineHeight: 30, color: ink }}
          >
            {latestThought}
          </Text>
        )}
        <TextInput
          accessibilityLabel="자유로운 생각 입력"
          placeholder={
            "지금 떠오르는 생각을 적어보세요.\n정리되지 않은 말이어도 괜찮아요."
          }
          placeholderTextColor="#929786"
          multiline
          editable={!busy}
          value={thought}
          onChangeText={onChange}
          maxLength={10000}
          textAlignVertical="top"
          onFocus={() => setWritingFocus(true)}
          onBlur={() => setWritingFocus(false)}
          style={[
            s.input,
            {
              height: latestThought
                ? Math.max(80, writingHeight - 60)
                : writingHeight,
              borderBottomColor: writingFocus ? "#9aab87" : "transparent",
              borderBottomWidth: 1,
            },
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
          ]}
        />
      </View>
      <View style={s.writeTools}>
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={busy || saved}
          accessibilityState={{ disabled: busy || saved }}
          style={diary.quiet}
        >
          <Text style={s.save}>{saved ? "✓ 저장됨" : "생각 저장"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="생각 정리하기"
          onPress={onOrganize}
          disabled={busy || !thought.trim()}
          accessibilityState={{ disabled: busy || !thought.trim() }}
          style={[s.organize, !thought.trim() && { opacity: 0.45 }]}
        >
          <Text style={s.organizeText}>생각 정리하기 →</Text>
        </Pressable>
      </View>
      {!!onAI && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={aiBusy ? "AI 요청 취소" : "연결한 AI로 정리하기"}
          disabled={!aiBusy && (busy || !thought.trim())}
          onPress={aiBusy ? onCancelAI : onAI}
          style={diary.quiet}
        >
          <Text style={s.tinyLink}>
            {aiBusy ? "AI 정리 중…" : "연결한 AI로 정리하기 · 선택"}
          </Text>
        </Pressable>
      )}
      <View style={s.daily}>
        <View style={s.taskArea}>
          <View style={s.sectionHeading}>
            <Text style={diary.heading}>오늘의 작은 일</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="할 일 살펴보기·수정"
              onPress={onManage}
              style={diary.quiet}
            >
              <Text style={s.tinyLink}>모두 보기 ›</Text>
            </Pressable>
          </View>
          {current ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="한 걸음 시작하기"
              onPress={onStart}
              style={s.taskRow}
            >
              <View style={s.checkbox} />
              <Text numberOfLines={2} style={s.taskTitle}>
                {current.title}
              </Text>
              <Text style={s.arrow}>→</Text>
            </Pressable>
          ) : (
            <Text style={diary.small}>
              할 일은 생각을 정리한 뒤 적어둘게요.
            </Text>
          )}
          {completed.slice(-2).map((t) => (
            <View
              key={t.id}
              testID="today-completed"
              accessibilityRole="checkbox"
              accessibilityLabel={t.title}
              accessibilityState={{ checked: true, disabled: true }}
              style={s.doneRow}
            >
              <Text style={s.doneCheck}>✓</Text>
              <Text numberOfLines={1} style={s.doneTitle}>
                {t.title}
              </Text>
            </View>
          ))}
          {current && (
            <Text style={s.remaining}>
              {remaining > 1
                ? "다른 일은 잠시 접어두어요."
                : "이 한 가지만 해도 괜찮아요."}
            </Text>
          )}
        </View>
        <View style={s.plant}>
          <BotanicalSticker size={70} stage={progress} color="#d8b8bd" />
          <Text style={s.stage}>
            {["잠든 씨앗", "작은 새싹", "자라는 잎", "곧 만날 꽃"][progress]}
          </Text>
          <View style={s.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[s.dot, i < progress && { backgroundColor: sage }]}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={s.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="씨앗 보관함 열기"
          onPress={onSeeds}
          style={diary.quiet}
        >
          <Text style={s.tinyLink}>씨앗 보관함 ↗</Text>
        </Pressable>
        <Text style={s.pageNumber}>
          온점. / {String(date.getDate()).padStart(2, "0")}
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { gap: 8 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginTop: 7,
  },
  date: {
    color: ink,
    fontSize: 35,
    lineHeight: 48,
    fontWeight: "500",
    letterSpacing: -1.5,
  },
  weekday: { color: sage, fontSize: 14 },
  motto: { color: muted, fontSize: 13, lineHeight: 23, marginBottom: 12 },
  writing: { position: "relative" },
  rule: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0.7,
    backgroundColor: line,
  },
  input: {
    padding: 0,
    paddingTop: 2,
    fontSize: 16,
    lineHeight: 30,
    color: ink,
    backgroundColor: "transparent",
  },
  writeTools: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  save: { fontSize: 12, color: muted },
  organize: {
    backgroundColor: sage,
    minHeight: 44,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 17,
  },
  organizeText: { color: "#fffef7", fontSize: 14, fontWeight: "500" },
  daily: {
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  taskArea: { flex: 1, minWidth: 0, gap: 8 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  tinyLink: { color: muted, fontSize: 11 },
  taskRow: {
    minHeight: 48,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#a3ad96",
    borderRadius: 3,
  },
  taskTitle: { flex: 1, color: ink, fontSize: 15, lineHeight: 24 },
  arrow: { color: sage, fontSize: 18 },
  doneRow: {
    flexDirection: "row",
    gap: 10,
    minHeight: 28,
    alignItems: "center",
  },
  doneCheck: { color: sage, fontSize: 16 },
  doneTitle: {
    flex: 1,
    color: muted,
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  remaining: { fontSize: 11, color: muted, lineHeight: 18 },
  plant: { width: 75, alignItems: "center", marginTop: 24 },
  stage: { color: muted, fontSize: 10 },
  dots: { flexDirection: "row", gap: 4, marginTop: 8 },
  dot: { width: 4, height: 4, borderRadius: 3, backgroundColor: "#d9deca" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pageNumber: { fontSize: 10, color: "#a1a68f", letterSpacing: 1 },
});
