import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { taskPath, taskProgress } from "../mobile-domain.mjs";
import { MOODS } from "../journal.mjs";
import { BotanicalSticker } from "./PaperTexture";
type Props = {
  state: any;
  day: string;
  current?: any;
  busy: boolean;
  thought: string;
  onChange: (s: string) => void;
  onSave: () => void;
  onOrganize: () => void;
  onStart: () => void;
  onManage: () => void;
  onSeeds: () => void;
  onAI?: () => void;
  aiBusy: boolean;
  onCancelAI: () => void;
  onReflect: (text: string, mood: string | null) => Promise<boolean>;
};
function Action({
  title,
  onPress,
  disabled = false,
  quiet = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  quiet?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, quiet && s.quiet, disabled && { opacity: 0.5 }]}
    >
      <Text style={[s.buttonText, quiet && s.text]}>{title}</Text>
    </Pressable>
  );
}
export default function ActionHome(p: Props) {
  const [expanded, setExpanded] = useState<string[]>([]),
    [reflect, setReflect] = useState(false),
    [mood, setMood] = useState<string | null>(null),
    [note, setNote] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setReflect(false);
    setSaved(false);
    setMood(null);
    setNote("");
  }, [p.day]);
  const roots = p.state.tasks.filter(
    (t: any) => !t.parentId && t.status !== "done",
  );
  const path = p.current ? taskPath(p.state.tasks, p.current.id) : [];
  const children = (id: string) =>
    p.state.tasks
      .filter((t: any) => t.parentId === id)
      .sort((a: any, b: any) => a.order - b.order);
  const renderNode = (t: any, depth = 0): React.ReactNode => {
    const kids = children(t.id),
      progress = taskProgress(p.state, t.id),
      open = expanded.includes(t.id);
    return (
      <View key={t.id} style={[s.node, { marginLeft: depth ? 12 : 0 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${t.title}, ${progress.done}/${progress.total} 완료`}
          onPress={() =>
            setExpanded((x) =>
              open ? x.filter((id) => id !== t.id) : [...x, t.id],
            )
          }
          style={s.treeRow}
        >
          <Text style={s.text}>
            {kids.length
              ? open
                ? "− "
                : "+ "
              : t.status === "done"
                ? "✓ "
                : "· "}
            {t.title}
          </Text>
          <Text style={s.small}>
            {progress.done}/{progress.total}
            {t.status === "postponed" ? " · 씨앗" : ""}
          </Text>
        </Pressable>
        {kids.length > 0 && (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: progress.total,
              now: progress.done,
            }}
            style={s.track}
          >
            <View
              style={[
                s.fill,
                {
                  width: `${progress.total ? (100 * progress.done) / progress.total : 0}%`,
                },
              ]}
            />
          </View>
        )}
        {open && kids.map((k: any) => renderNode(k, depth + 1))}
      </View>
    );
  };
  return (
    <View style={s.page} testID="action-home">
      <Text style={s.small}>{p.day} · 온점.</Text>
      <Text accessibilityRole="header" style={s.title}>
        작은 시작이면 충분해요.
      </Text>
      <View style={s.hero}>
        <Text style={s.label}>지금 할 가장 작은 행동</Text>
        {!!path.length && (
          <Text style={s.small}>
            {path
              .slice(0, -1)
              .map((t: any) => t.title)
              .join(" › ") || "내가 고른 목표"}
          </Text>
        )}
        <Text accessibilityRole="header" style={s.action}>
          {p.current?.title || "머릿속 생각부터 꺼내볼까요?"}
        </Text>
        <Text style={s.text}>
          {p.current
            ? "다른 일은 잠시 접어두고, 이것 하나만."
            : "정리되지 않은 말도 괜찮아요. 다음 행동을 함께 골라요."}
        </Text>
        {p.current && (
          <Action
            title="한 걸음 시작하기"
            onPress={p.onStart}
            disabled={p.busy}
          />
        )}
      </View>
      <View style={s.garden}>
        <BotanicalSticker size={110} stage={p.state.progress} color="#c599a8" />
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={s.label}>
            {
              [
                "씨앗이 기다려요",
                "새싹이 올라왔어요",
                "잎이 자라고 있어요",
                "꽃봉오리가 열려요",
              ][p.state.progress]
            }
          </Text>
          <Text style={s.text}>
            실제 행동 {p.state.progress}/4 · 다음 꽃까지 {4 - p.state.progress}
            개
          </Text>
          <Text style={s.small}>쉬어도 정원은 그대로 기다려요.</Text>
        </View>
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.label}>
          생각 꺼내기
        </Text>
        <Text style={s.small}>목표 · 해야 할 일 · 떠오른 생각을 자유롭게</Text>
        <TextInput
          accessibilityLabel="머릿속 생각"
          multiline
          maxLength={4000}
          value={p.thought}
          onChangeText={p.onChange}
          placeholder="예: 방 정리도 해야 하고 발표 준비도 막막해"
          placeholderTextColor="#637267"
          style={s.input}
        />
        <Action
          quiet
          title="생각만 보관하기"
          onPress={p.onSave}
          disabled={p.busy || !p.thought.trim()}
        />
        <Action
          title="생각 정리하기 →"
          onPress={p.onOrganize}
          disabled={p.busy || !p.thought.trim()}
        />
        {p.onAI && (
          <Action
            quiet
            title={p.aiBusy ? "AI 요청 취소" : "연결한 AI로 정리하기 · 선택"}
            onPress={p.aiBusy ? p.onCancelAI : p.onAI}
            disabled={!p.aiBusy && (p.busy || !p.thought.trim())}
          />
        )}
        <Text style={s.small}>
          기본 정리는 기기 안에서 동작해요. 제안은 저장 전 검토해요.
        </Text>
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.label}>
          목표까지 한 걸음씩
        </Text>
        {roots.length ? (
          roots.map((t: any) => renderNode(t))
        ) : (
          <Text style={s.text}>새 목표는 준비되었을 때 만들어도 괜찮아요.</Text>
        )}
        <Action quiet title="할 일 살펴보기·수정" onPress={p.onManage} />
        <Action quiet title="씨앗 보관함 열기" onPress={p.onSeeds} />
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.label}>
          하루 마무리 · 선택
        </Text>
        <Text style={s.text}>
          해낸 날도, 멈춘 날도, 오랜만에 돌아온 날도 괜찮아요.
        </Text>
        {!reflect ? (
          <Action
            quiet
            title="지금 기분 돌아보기"
            onPress={() => {
              setMood(p.state.journals?.[p.day]?.mood || null);
              setNote(p.state.journals?.[p.day]?.text || "");
              setReflect(true);
              setSaved(false);
            }}
          />
        ) : (
          <>
            <View style={s.moods}>
              {MOODS.map((m: string) => (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mood === m }}
                  onPress={() => {
                    setMood(mood === m ? null : m);
                    setSaved(false);
                  }}
                  style={[
                    s.quiet,
                    s.mood,
                    mood === m && { borderColor: "#49664d", borderWidth: 2 },
                  ]}
                >
                  <Text style={s.text}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="선택적 하루 회고"
              multiline
              maxLength={2000}
              value={note}
              onChangeText={(v) => {
                setNote(v);
                setSaved(false);
              }}
              placeholder="한 줄을 남겨도, 기분만 골라도 좋아요."
              style={s.input}
            />
            <Action
              title="기분 남기기"
              disabled={p.busy}
              onPress={() => {
                void p.onReflect(note, mood).then((ok) => setSaved(ok));
              }}
            />
            <Action
              quiet
              title="오늘은 건너뛰기"
              onPress={() => setReflect(false)}
            />
            {saved && (
              <Text accessibilityLiveRegion="polite" style={s.text}>
                오늘의 기분을 보관했어요.
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { gap: 20 },
  title: { fontSize: 27, lineHeight: 38, fontWeight: "700", color: "#283e34" },
  label: { fontSize: 17, lineHeight: 26, fontWeight: "600", color: "#283e34" },
  action: { fontSize: 25, lineHeight: 36, fontWeight: "600", color: "#283e34" },
  hero: { backgroundColor: "#e4ecdc", borderRadius: 22, padding: 22, gap: 14 },
  card: {
    backgroundColor: "#fffdf6",
    borderColor: "#d6ddcf",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  garden: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: "#eee8d9",
    padding: 16,
    borderRadius: 22,
  },
  text: { fontSize: 16, lineHeight: 25, color: "#334b3b", flexShrink: 1 },
  small: { fontSize: 13, lineHeight: 21, color: "#52634f" },
  button: {
    minHeight: 48,
    backgroundColor: "#49664d",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fffef7",
    fontWeight: "600",
  },
  quiet: {
    backgroundColor: "#edf0e5",
    borderRadius: 12,
    minHeight: 48,
    padding: 12,
  },
  input: {
    minHeight: 110,
    borderColor: "#9eaf98",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: "#283e34",
    fontSize: 16,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  node: { gap: 6 },
  treeRow: {
    minHeight: 48,
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  track: { height: 6, backgroundColor: "#dce3d4", borderRadius: 4 },
  fill: { height: 6, backgroundColor: "#49664d", borderRadius: 4 },
  moods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mood: { justifyContent: "center" },
});
