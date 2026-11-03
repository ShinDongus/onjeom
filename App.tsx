import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Animated,
  AppState,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SQLite from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  addTasks,
  changeTask,
  completeTask,
  flowerInfo,
  FLOWERS,
  SEASONAL,
  initialState,
  localDate,
  registerFlower,
  seasonAt,
} from "./src/logic.mjs";
import { ruleSeparator } from "./src/separator.mjs";
import { createStore } from "./src/storage.mjs";

type Task = { id: string; title: string; status: string };
type Flower = {
  id: string;
  species: string;
  color: string;
  bloomedAt: string;
  registered: boolean;
  achievements: string[];
};
type State = {
  version: number;
  tasks: Task[];
  flowers: Flower[];
  completed: number;
  settings: { reduceMotion: boolean; plusTest: boolean };
};
const palette = {
  ink: "#283e34",
  muted: "#65776b",
  sage: "#627e65",
  cream: "#fbf8ef",
  sand: "#eee6d5",
  line: "#d8dfd0",
};
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: palette.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function Botanical({
  color = "#efcf97",
  size = 100,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size * 1.3, alignSelf: "center" }}
    >
      <View
        style={{
          position: "absolute",
          left: size * 0.48,
          top: size * 0.35,
          width: 3,
          height: size * 0.9,
          backgroundColor: "#688368",
          borderRadius: 3,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: size * 0.5,
          top: size * 0.82,
          width: size * 0.3,
          height: size * 0.14,
          backgroundColor: "#8fa687",
          borderTopRightRadius: 30,
          borderBottomLeftRadius: 30,
          transform: [{ rotate: "-28deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: size * 0.22,
          top: size * 0.97,
          width: size * 0.28,
          height: size * 0.13,
          backgroundColor: "#a7b89a",
          borderTopLeftRadius: 30,
          borderBottomRightRadius: 30,
          transform: [{ rotate: "25deg" }],
        }}
      />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <View
          key={a}
          style={{
            position: "absolute",
            left: size * 0.33 + Math.cos((a * Math.PI) / 180) * size * 0.21,
            top: size * 0.23 + Math.sin((a * Math.PI) / 180) * size * 0.21,
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.94,
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          left: size * 0.4,
          top: size * 0.3,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size,
          backgroundColor: "#b18a4a",
        }}
      />
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Onjeom />
    </SafeAreaProvider>
  );
}
function Onjeom() {
  const [state, setState] = useState<State>(initialState());
  const stateRef = useRef(state);
  const store = useRef<any>(null);
  const busyRef = useRef(false);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("오늘"),
    [thought, setThought] = useState(""),
    [draft, setDraft] = useState<string[] | null>(null);
  const [splitId, setSplitId] = useState<string | null>(null),
    [steps, setSteps] = useState("");
  const [bloom, setBloom] = useState<Flower | null>(null),
    [adFlower, setAdFlower] = useState<Flower | null>(null);
  const [systemReduce, setSystemReduce] = useState(false),
    [day, setDay] = useState(localDate());
  const fade = useRef(new Animated.Value(1)).current;
  const load = async () => {
    try {
      if (Platform.OS === "web")
        throw Error(
          "모바일 앱의 SQLite 저장은 iOS·Android에서 사용해 주세요. 브라우저에서는 별도 웹 프로토타입을 실행할 수 있습니다.",
        );
      if (!store.current)
        store.current = await createStore(
          await SQLite.openDatabaseAsync("onjeom.db"),
        );
      const loaded = await store.current.load();
      stateRef.current = loaded;
      setState(loaded);
      setReady(true);
      setError("");
    } catch (e) {
      setError(message(e));
    }
  };
  useEffect(() => {
    void load();
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduce);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReduce,
    );
    const app = AppState.addEventListener("change", (value) => {
      if (value === "active") setDay(localDate());
    });
    return () => {
      listener.remove();
      app.remove();
    };
  }, []);
  useEffect(() => {
    if (!bloom || state.settings.reduceMotion || systemReduce) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [bloom, state.settings.reduceMotion, systemReduce]);
  function message(e: unknown) {
    return e instanceof Error
      ? e.message
      : "처리하지 못했습니다. 다시 시도해 주세요.";
  }
  const commit = async (transform: (s: State) => State) => {
    if (busyRef.current || !ready) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const next = transform(stateRef.current);
      await store.current.save(next);
      stateRef.current = next;
      setState(next);
      setError("");
      return next;
    } catch (e) {
      setError(message(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const active = state.tasks.filter((t) => t.status === "active");
  const current = active[0];
  const season = seasonAt(day);
  const backgrounds: Record<string, string> = {
    봄: "#edf2e5",
    여름: "#e4eee7",
    가을: "#f2e8d7",
    겨울: "#edf0f2",
  };
  const register = async (f: Flower) => {
    const duplicate = state.flowers.some(
      (x) => x.registered && x.species === f.species && x.color === f.color,
    );
    if (state.settings.plusTest || duplicate)
      await commit((s) => registerFlower(s, f.id));
    else setAdFlower(f);
  };
  const complete = async () => {
    if (!current) return;
    const before = stateRef.current.flowers.length;
    const next = await commit((s) => completeTask(s, current.id));
    if (next && next.flowers.length > before) setBloom(next.flowers.at(-1)!);
  };
  const backup = async () => {
    if (busyRef.current) return;
    try {
      const text = await store.current.backup();
      if (!(await Sharing.isAvailableAsync()))
        throw Error("이 기기에서는 파일 공유를 사용할 수 없습니다.");
      const file = new File(Paths.cache, "onjeom-backup.json");
      file.write(text);
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        UTI: "public.json",
      });
    } catch (e) {
      setError(message(e));
    }
  };
  const restore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = new File(result.assets[0].uri);
      if (file.size > 20_000_000) throw Error("백업이 너무 큽니다.");
      const text = await file.text();
      Alert.alert(
        "백업으로 복원할까요?",
        "현재 기기 데이터 전체를 선택한 백업으로 바꿉니다. 먼저 현재 데이터를 백업해 주세요.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "복원",
            onPress: () => void replaceData(() => store.current.restore(text)),
          },
        ],
      );
    } catch (e) {
      setError(message(e));
    }
  };
  const replaceData = async (operation: () => Promise<State>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const next = await operation();
      stateRef.current = next;
      setState(next);
      setReady(true);
      setDraft(null);
      setThought("");
      setBloom(null);
      setAdFlower(null);
      setSplitId(null);
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Text accessibilityRole="header" style={s.brand}>
          온점.
        </Text>
        <Text style={s.small}>하루를 조금씩, 나의 속도로</Text>
      </View>
      {error ? (
        <View accessibilityRole="alert" style={s.error}>
          <Text>{error}</Text>
          {!ready && (
            <>
              <Button title="다시 불러오기" onPress={() => void load()} />
              {store.current && (
                <Button title="백업에서 복구" onPress={() => void restore()} />
              )}
            </>
          )}
        </View>
      ) : null}
      {!ready ? (
        <View style={s.content}>
          <Text>정원을 불러오는 중입니다.</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {tab === "오늘" && (
              <>
                <Text style={s.eyebrow}>
                  {day} · {season}의 한 페이지
                </Text>
                <Text accessibilityRole="header" style={s.title}>
                  마음에 있는 것부터{"\n"}가볍게 내려놓아요.
                </Text>
                <Text style={s.body}>
                  잘 정리하지 않아도 괜찮아요. 떠오르는 생각을 자유롭게 적어
                  주세요.
                </Text>
                <TextInput
                  accessibilityLabel="자유로운 생각 입력"
                  multiline
                  placeholder="빨래하기, 메일 답장하기…"
                  value={thought}
                  onChangeText={setThought}
                  maxLength={10000}
                  style={[s.input, { minHeight: 130 }]}
                  textAlignVertical="top"
                />
                <Button
                  title="할 일로 나눠 보기"
                  disabled={busy || !thought.trim()}
                  onPress={() =>
                    void ruleSeparator
                      .separate(thought)
                      .then((items: string[]) => setDraft(items))
                      .catch((e: unknown) => setError(message(e)))
                  }
                />
                <Text style={s.small}>
                  규칙 기반 분리 · 줄바꿈과 문장 부호를 기준으로 나눠요.
                </Text>
                {draft !== null && (
                  <View style={s.card}>
                    <Text style={s.subtitle}>내가 할 일을 직접 골라요</Text>
                    <Text style={s.body}>
                      수정하거나 지운 뒤 추가해 주세요. 빈 항목은 제외됩니다.
                    </Text>
                    {draft.map((text, i) => (
                      <View key={i} style={s.row}>
                        <TextInput
                          accessibilityLabel={`할 일 ${i + 1} 수정`}
                          value={text}
                          onChangeText={(v) =>
                            setDraft(draft.map((x, j) => (j === i ? v : x)))
                          }
                          maxLength={500}
                          style={[s.input, { flex: 1 }]}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`할 일 ${i + 1} 제외`}
                          onPress={() =>
                            setDraft(draft.filter((_, j) => j !== i))
                          }
                        >
                          <Text style={s.link}>제외</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Button
                      title="항목 더 적기"
                      secondary
                      disabled={draft.length >= 100}
                      onPress={() => setDraft([...draft, ""])}
                    />
                    <Button
                      title="검토한 할 일 추가"
                      disabled={busy || !draft.some((x) => x.trim())}
                      onPress={() =>
                        void commit((s) => addTasks(s, draft)).then((next) => {
                          if (next) {
                            setDraft(null);
                            setThought("");
                            setTab("실행");
                          }
                        })
                      }
                    />
                  </View>
                )}
                <View style={s.card}>
                  <Text style={s.subtitle}>오늘의 작은 흔적</Text>
                  <Text style={s.body}>
                    완료한 일 {state.completed}개 · 피어난 꽃{" "}
                    {state.flowers.length}송이
                  </Text>
                  <Text style={s.small}>
                    씨앗은 기다릴 줄 알아요. 쉬어도 사라지지 않아요.
                  </Text>
                </View>
              </>
            )}
            {tab === "실행" && (
              <>
                <Text style={s.eyebrow}>지금은 하나만</Text>
                <Botanical
                  size={100}
                  color={state.completed % 4 === 3 ? "#e6c4a7" : "#bbcba6"}
                />
                {current ? (
                  <View style={s.card}>
                    <Text style={s.small}>다른 일은 잠시 내려두세요.</Text>
                    <Text accessibilityRole="header" style={s.title}>
                      {current.title}
                    </Text>
                    <Button
                      title="이만큼 해냈어요 · 완료"
                      disabled={busy}
                      onPress={() => void complete()}
                    />
                    <Button
                      title="나중에 하기"
                      secondary
                      disabled={busy}
                      onPress={() =>
                        void commit((s) => changeTask(s, current.id, "later"))
                      }
                    />
                    <Button
                      title="작은 단계로 나누기"
                      secondary
                      onPress={() => {
                        setSplitId(current.id);
                        setSteps("");
                      }}
                    />
                    <Button
                      title="씨앗 보관함에 두기"
                      secondary
                      disabled={busy}
                      onPress={() =>
                        void commit((s) => changeTask(s, current.id, "archive"))
                      }
                    />
                  </View>
                ) : (
                  <View style={s.card}>
                    <Text style={s.subtitle}>
                      지금은 여백으로 두어도 좋아요.
                    </Text>
                    <Text style={s.body}>
                      생각을 적거나 씨앗 보관함에서 다시 시작해 보세요.
                    </Text>
                    <Button
                      title="생각 적으러 가기"
                      onPress={() => setTab("오늘")}
                    />
                  </View>
                )}
                <Text style={s.small}>
                  다음 꽃까지 작은 행동 {4 - (state.completed % 4)}개 · 시간은
                  재지 않아요.
                </Text>
              </>
            )}
            {tab === "정원" && (
              <>
                <View
                  style={[s.garden, { backgroundColor: backgrounds[season] }]}
                >
                  <Text style={s.eyebrow}>{season}의 정원</Text>
                  <Text style={s.title}>어느새, 피어났네요.</Text>
                  <View style={s.wrap}>
                    {state.flowers.slice(-6).map((f) => (
                      <Botanical
                        key={f.id}
                        size={65}
                        color={flowerInfo(f).color.hex}
                      />
                    ))}
                    {!state.flowers.length && (
                      <Botanical size={110} color="#c5d1b7" />
                    )}
                  </View>
                  <Text style={s.small}>작은 행동들이 모여 만든 풍경</Text>
                </View>
                <Text accessibilityRole="header" style={s.subtitle}>
                  기억의 정원 · {state.flowers.length}송이
                </Text>
                <Text style={s.body}>
                  미등록 꽃도 이곳에 계속 남아요. 도감 등록은 언제든 선택할 수
                  있어요.
                </Text>
                {[...state.flowers].reverse().map((f) => {
                  const info = flowerInfo(f);
                  return (
                    <View style={s.card} key={f.id}>
                      <View style={s.row}>
                        <Botanical size={60} color={info.color.hex} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.subtitle}>{info.name}</Text>
                          <Text style={s.small}>
                            {info.color.name} · {f.bloomedAt}
                          </Text>
                          <Text style={s.body}>“{info.meaning}”</Text>
                        </View>
                      </View>
                      <Text style={s.small}>{f.achievements.join(" · ")}</Text>
                      {f.registered ? (
                        <Text style={s.link}>도감에 담았어요</Text>
                      ) : (
                        <Button
                          title="도감에 담기"
                          disabled={busy}
                          onPress={() => void register(f)}
                        />
                      )}
                    </View>
                  );
                })}
                <Text style={s.subtitle}>꽃 도감</Text>
                <Text style={s.small}>
                  기본 12종 · 계절의 선물 4종 · 색상별로 기록해요.
                </Text>
                {[...FLOWERS, ...SEASONAL].map((species: any) => {
                  const found = state.flowers.filter(
                    (f) => f.registered && f.species === species.id,
                  );
                  return (
                    <View key={species.id} style={s.card}>
                      <Text style={s.subtitle}>
                        {found.length ? species.name : "아직 만나지 않은 꽃"}
                      </Text>
                      <Text style={s.small}>
                        {found.length
                          ? `${species.meaning} · ${new Set(found.map((f) => f.color)).size}가지 색상`
                          : "일상을 정리하다 보면 만날 수 있어요."}
                      </Text>
                      {found.map((f) => (
                        <Text key={f.id} style={s.body}>
                          {flowerInfo(f).color.name} · {f.bloomedAt}
                          {"\n"}
                          {f.achievements.join(" · ")}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </>
            )}
            {tab === "씨앗" && (
              <>
                <Text style={s.eyebrow}>다시 시작할 수 있도록</Text>
                <Text style={s.title}>씨앗 보관함</Text>
                <Text style={s.body}>
                  끝내지 못한 일이 아니라, 다음을 기다리는 씨앗이에요.
                </Text>
                {state.tasks
                  .filter((t) => t.status === "seed")
                  .map((t) => (
                    <View key={t.id} style={s.card}>
                      <Text style={s.subtitle}>{t.title}</Text>
                      <Button
                        title="다시 꺼내기"
                        disabled={busy}
                        onPress={() =>
                          void commit((s) => changeTask(s, t.id, "restore"))
                        }
                      />
                    </View>
                  ))}
                {!state.tasks.some((t) => t.status === "seed") && (
                  <Text style={s.small}>아직 보관한 씨앗이 없어요.</Text>
                )}
              </>
            )}
            {tab === "설정" && (
              <>
                <Text style={s.title}>나에게 편안하게</Text>
                <View style={s.card}>
                  <View style={s.row}>
                    <Text style={[s.body, { flex: 1 }]}>모션 줄이기</Text>
                    <Switch
                      accessibilityLabel="모션 줄이기"
                      value={state.settings.reduceMotion}
                      disabled={busy}
                      onValueChange={(v) =>
                        void commit((s) => ({
                          ...s,
                          settings: { ...s.settings, reduceMotion: v },
                        }))
                      }
                    />
                  </View>
                  <Text style={s.small}>
                    기기 모션 감소 설정도 함께 존중해요.
                  </Text>
                </View>
                <View style={s.card}>
                  <Text style={s.subtitle}>수익화 기능 · 테스트 모드</Text>
                  <Text style={s.body}>
                    실제 광고와 결제는 연결되지 않았어요. 비용이 청구되지
                    않습니다. 희귀 색상 확률은 무료와 PLUS 모두 5%입니다.
                  </Text>
                  <View style={s.row}>
                    <Text style={[s.body, { flex: 1 }]}>PLUS 테스트</Text>
                    <Switch
                      accessibilityLabel="PLUS 테스트 모드"
                      value={state.settings.plusTest}
                      disabled={busy}
                      onValueChange={(v) =>
                        void commit((s) => ({
                          ...s,
                          settings: { ...s.settings, plusTest: v },
                        }))
                      }
                    />
                  </View>
                  <Text style={s.small}>
                    새 품종·색상 조합만 선택형 보상 테스트 대상이며, 같은 꽃은
                    광고 없이 담아요.
                  </Text>
                </View>
                <View style={s.card}>
                  <Text style={s.subtitle}>내 기기에만 남는 기록</Text>
                  <Text style={s.body}>
                    SQLite 자동 저장 · 서버 전송 없음. 백업 파일에는 생각과 성취
                    기록이 담기며 암호화되지 않습니다. 안전한 곳에 보관해
                    주세요.
                  </Text>
                  <Button
                    title="백업 파일 내보내기"
                    secondary
                    disabled={busy}
                    onPress={() => void backup()}
                  />
                  <Button
                    title="백업 파일에서 복원"
                    secondary
                    disabled={busy}
                    onPress={() => void restore()}
                  />
                  <Button
                    title="기기 데이터 전체 삭제"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      Alert.alert(
                        "모든 기록을 지울까요?",
                        "꽃, 씨앗과 성취 기록이 모두 삭제됩니다. 내보낸 백업 파일은 별도로 삭제해 주세요.",
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "전체 삭제",
                            style: "destructive",
                            onPress: () =>
                              void replaceData(() => store.current.clear()),
                          },
                        ],
                      )
                    }
                  />
                </View>
              </>
            )}
          </ScrollView>
          <View style={s.nav}>
            {["오늘", "실행", "정원", "씨앗", "설정"].map((name) => (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === name }}
                onPress={() => setTab(name)}
                style={s.navItem}
              >
                <Text
                  style={[
                    s.navText,
                    tab === name && { color: palette.ink, fontWeight: "800" },
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Modal
        visible={splitId !== null}
        transparent
        animationType="none"
        onRequestClose={() => setSplitId(null)}
      >
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={s.dialog}>
            {error ? <Text accessibilityRole="alert">{error}</Text> : null}
            <Text style={s.title}>더 작아도 괜찮아요.</Text>
            <Text style={s.body}>
              한 줄에 한 단계씩 적어 주세요. 원래 할 일을 이 단계들로 바꿉니다.
            </Text>
            <TextInput
              accessibilityLabel="작은 단계 입력"
              multiline
              value={steps}
              onChangeText={setSteps}
              style={[s.input, { minHeight: 120 }]}
              maxLength={10000}
            />
            <Button
              title="작은 단계로 바꾸기"
              disabled={busy || !steps.trim()}
              onPress={() =>
                void commit((s) =>
                  changeTask(s, splitId, "split", steps.split("\n")),
                ).then((next) => {
                  if (next) setSplitId(null);
                })
              }
            />
            <Button
              title="돌아가기"
              secondary
              onPress={() => setSplitId(null)}
            />
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={!!bloom}
        transparent
        animationType="none"
        onRequestClose={() => setBloom(null)}
      >
        <View style={s.overlay}>
          <Animated.View style={[s.dialog, { opacity: fade }]}>
            {bloom && (
              <>
                <Text style={s.eyebrow}>당신의 작은 행동 끝에</Text>
                <Botanical color={flowerInfo(bloom).color.hex} size={135} />
                <Text accessibilityRole="header" style={s.title}>
                  {flowerInfo(bloom).name}이 피었어요.
                </Text>
                <Text style={s.body}>“{flowerInfo(bloom).meaning}”</Text>
                <Text style={s.small}>
                  {bloom.bloomedAt} · {flowerInfo(bloom).color.name}
                  {"\n"}
                  {bloom.achievements.join(" · ")}
                </Text>
                <Button
                  title="기억의 정원에서 만나기"
                  onPress={() => {
                    setBloom(null);
                    setTab("정원");
                  }}
                />
                <Button
                  title="지금은 이 순간만 간직하기"
                  secondary
                  onPress={() => setBloom(null)}
                />
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
      <Modal
        visible={!!adFlower}
        transparent
        animationType="none"
        onRequestClose={() => setAdFlower(null)}
      >
        <View style={s.overlay}>
          <View style={s.dialog}>
            {error ? <Text accessibilityRole="alert">{error}</Text> : null}
            <Text style={s.eyebrow}>보상형 광고 · 테스트 모드</Text>
            <Text style={s.title}>도감에 새 꽃을 담을까요?</Text>
            <Text style={s.body}>
              실제 광고는 재생되지 않습니다. 아래 버튼으로 보상 결과를 테스트할
              수 있어요. 취소하거나 광고가 없어도 꽃은 정원에 영구 보관됩니다.
            </Text>
            <Button
              title="테스트: 보상 완료"
              disabled={busy}
              onPress={() =>
                void commit((s) =>
                  registerFlower(s, adFlower?.id, { reward: "earned-test" }),
                ).then((next) => {
                  if (next) setAdFlower(null);
                })
              }
            />
            <Button
              title="테스트: 광고 제공 안 됨"
              secondary
              onPress={() => {
                setAdFlower(null);
                Alert.alert(
                  "광고가 없어요",
                  "꽃은 정원에서 기다릴게요. 나중에 다시 담아도 좋아요.",
                );
              }}
            />
            <Button
              title="취소하고 꽃 보관"
              secondary
              onPress={() => setAdFlower(null)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: palette.line,
  },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -1,
  },
  small: { fontSize: 13, lineHeight: 21, color: palette.muted },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 16,
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 1,
    color: palette.sage,
    lineHeight: 22,
  },
  title: {
    fontSize: 27,
    lineHeight: 39,
    fontWeight: "600",
    color: palette.ink,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.ink,
    lineHeight: 28,
  },
  body: { fontSize: 16, lineHeight: 27, color: palette.muted },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    lineHeight: 26,
    color: palette.ink,
    backgroundColor: "#fffef9",
  },
  button: {
    backgroundColor: palette.sage,
    borderRadius: 16,
    padding: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  secondary: { backgroundColor: palette.sand },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  card: {
    backgroundColor: "#fffdf7",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 20,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: palette.sage, fontWeight: "600", padding: 10 },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    paddingVertical: 20,
  },
  garden: { padding: 24, borderRadius: 28, gap: 16 },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.cream,
  },
  navItem: {
    flex: 1,
    paddingVertical: 20,
    alignItems: "center",
    minHeight: 56,
  },
  navText: { fontSize: 14, color: palette.muted },
  error: { backgroundColor: "#f4e2d3", padding: 16 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(40,62,52,.38)",
    padding: 24,
  },
  dialog: {
    backgroundColor: palette.cream,
    borderRadius: 28,
    padding: 24,
    gap: 12,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    marginVertical: 32,
  },
});
