import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, TextInput } from "./Type";
import { diary, typography, ink, muted, line } from "./diary-theme";
import AppIcon from "./AppIcon";
import ActionButton from "./ActionButton";
import InkTask from "./InkTask";
import PlantMoment from "./PlantMoment";
type Task = { id: string; title: string };
type Props = {
  day: string;
  progress: number;
  tasks: Task[];
  completed: Task[];
  thought: string;
  latestThought?: string;
  saved: boolean;
  busy: boolean;
  aiBusy?: boolean;
  onAI?: () => void;
  onCancelAI?: () => void;
  onChange: (text: string) => void;
  onSave: () => void;
  onOrganize: () => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onManage: () => void;
  onSeeds: () => void;
  onSettings: () => void;
  bloom?: any;
  onFlower: () => void;
};
export default function HomeScreen({
  day,
  progress,
  tasks,
  completed,
  thought,
  latestThought,
  saved,
  busy,
  aiBusy,
  onAI,
  onCancelAI,
  onChange,
  onSave,
  onOrganize,
  onStart,
  onComplete,
  onManage,
  onSeeds,
  onSettings,
  bloom,
  onFlower,
}: Props) {
  const { fontScale } = useWindowDimensions(),
    step = 28 * Math.min(fontScale, 1.35);
  const [contentHeight, setContentHeight] = useState(140);
  const inputHeight = Math.max(140, Math.ceil(contentHeight / step) * step);
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
  return (
    <View style={diary.page} testID="diary-home">
      <View style={s.header}>
        <Text accessibilityRole="header" style={[typography.date, { flex: 1 }]}>
          {date.getMonth() + 1}월 {date.getDate()}일 {weekday}
        </Text>
        <View style={s.tools}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="씨앗 보관함 열기"
            onPress={onSeeds}
            style={s.seed}
          >
            <AppIcon name="씨앗" color={ink} />
            <Text style={typography.caption}>씨앗 보관함</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정 열기"
            onPress={onSettings}
            style={s.icon}
          >
            <AppIcon name="설정" color={muted} />
          </Pressable>
        </View>
      </View>
      <Text style={typography.caption}>지금은 이 작은 일 하나면 충분해요</Text>
      <View style={{ gap: 16 }}>
        {!!latestThought && (
          <Text accessibilityLabel="오늘 남긴 생각" style={typography.body}>
            {latestThought}
          </Text>
        )}
        <View style={{ position: "relative" }}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: Math.ceil(inputHeight / step) }, (_, i) => (
              <View key={i} style={[s.rule, { top: (i + 1) * step - 1 }]} />
            ))}
          </View>
          <TextInput
            accessibilityLabel="자유로운 생각 입력"
            placeholder="오늘 머릿속에 떠다니는 생각을 편하게 적어보세요"
            placeholderTextColor={muted}
            multiline
            editable={!busy}
            value={thought}
            onChangeText={onChange}
            maxLength={10000}
            textAlignVertical="top"
            onContentSizeChange={(e) =>
              setContentHeight(e.nativeEvent.contentSize.height)
            }
            style={[
              s.input,
              { height: inputHeight },
              Platform.OS === "web" && ({ outlineStyle: "none" } as any),
            ]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="원문 저장"
          disabled={busy || saved}
          accessibilityState={{ disabled: busy || saved }}
          onPress={onSave}
          style={[diary.quiet, { alignSelf: "flex-start" }]}
        >
          <Text style={typography.action}>
            {saved ? "✓ 저장됨" : "원문 저장"}
          </Text>
        </Pressable>
        <ActionButton
          title="생각 정리하기"
          disabled={!thought.trim() || busy}
          loading={busy && !aiBusy}
          onPress={onOrganize}
        />
        {!!onAI && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              aiBusy ? "AI 요청 취소" : "연결한 AI로 정리하기"
            }
            onPress={aiBusy ? onCancelAI : onAI}
            style={diary.quiet}
          >
            <Text style={typography.action}>
              {aiBusy ? "AI 요청 취소" : "연결한 AI로 정리하기 · 선택"}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Text style={typography.heading}>오늘의 작은 일</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="할 일 살펴보기·수정"
            onPress={onManage}
            style={diary.quiet}
          >
            <Text style={typography.action}>수정</Text>
          </Pressable>
        </View>
        {tasks.length === 0 && completed.length === 0 && (
          <Text style={typography.caption}>
            지금은 이 작은 일 하나면 충분해요
          </Text>
        )}
        {tasks.map((t) => (
          <InkTask
            key={t.id}
            title={t.title}
            onOpen={() => onStart(t.id)}
            onComplete={() => onComplete(t.id)}
            disabled={busy}
          />
        ))}
        {completed.map((t) => (
          <InkTask key={t.id} title={t.title} checked />
        ))}
      </View>
      <PlantMoment progress={progress} bloom={bloom} onFlower={onFlower} />
    </View>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tools: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  seed: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: line,
  },
  input: {
    ...typography.body,
    padding: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  section: { borderTopWidth: 1, borderTopColor: line, paddingTop: 32, gap: 12 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
