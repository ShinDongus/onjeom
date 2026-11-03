import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
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
import FlowerArt from "./src/components/FlowerArt";
import GardenScene from "./src/components/GardenScene";
import Sheet from "./src/components/Sheet";
import InstallHint from "./src/components/InstallHint";
import { flowerCardSvg } from "./src/flower-card.mjs";
import { openPlatformStore, recoverPlatformStore } from "./src/platform-store";
import { pickBackupText, saveTextFile } from "./src/device-files";
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
  editTask,
  reorderTask,
} from "./src/mobile-domain.mjs";
import { ruleSeparator } from "./src/separator.mjs";

type Task = { id: string; title: string; status: string; order: number };
type Flower = {
  id: string;
  speciesId: string;
  variantId: string;
  color: string;
  createdAt: string;
  registeredAt: string | null;
  name: string;
  quote: string;
  variantName: string;
  originTask: string;
  achievements?: string[];
};
type State = {
  version: number;
  tasks: Task[];
  flowers: Flower[];
  completedTotal: number;
  progress: number;
  premiumDemo: boolean;
  settings: { reduceMotion: boolean };
};
const subject = (name: string) =>
  name + ((name.charCodeAt(name.length - 1) - 0xac00) % 28 === 0 ? "가" : "이");
const flowerDay = (f: Flower) =>
  f.createdAt.length === 10 ? f.createdAt : localDate(new Date(f.createdAt));
const achievementText = (f: Flower) =>
  (f.achievements?.length ? f.achievements : [f.originTask]).join(" · ");
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
  const scroll = useRef<ScrollView>(null);
  const store = useRef<any>(null);
  const busyRef = useRef(false);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("오늘"),
    [thought, setThought] = useState(""),
    [draft, setDraft] = useState<string[] | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    body: string;
    label: string;
    action: () => void;
  } | null>(null);
  const [gardenView, setGardenView] = useState("기억");
  const [manage, setManage] = useState(false),
    [editingId, setEditingId] = useState<string | null>(null),
    [editingTitle, setEditingTitle] = useState("");
  const [splitId, setSplitId] = useState<string | null>(null),
    [steps, setSteps] = useState("");
  const [bloom, setBloom] = useState<Flower | null>(null),
    [adFlower, setAdFlower] = useState<Flower | null>(null);
  const [systemReduce, setSystemReduce] = useState(false),
    [day, setDay] = useState(localDate());
  const fade = useRef(new Animated.Value(1)).current;
  const load = async () => {
    try {
      if (!store.current) store.current = await openPlatformStore();
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
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);
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
  const active = state.tasks
    .filter((t) => t.status === "active")
    .sort((a, b) => a.order - b.order);
  const current = active[0];
  const catalogSpecies = [
    ...new Map(
      [
        ...FLOWERS,
        ...SEASONAL,
        ...state.flowers.map((f) => ({
          id: f.speciesId,
          name: f.name,
          quote: f.quote,
        })),
      ].map((species) => [species.id, species]),
    ).values(),
  ];
  const season = seasonAt(day);
  const register = async (f: Flower) => {
    const duplicate = state.flowers.some(
      (x) =>
        x.registeredAt &&
        x.speciesId === f.speciesId &&
        x.variantId === f.variantId,
    );
    if (state.premiumDemo || duplicate)
      await commit((s) => registerFlower(s, f.id));
    else setAdFlower(f);
  };
  const complete = async () => {
    if (!current) return;
    const before = stateRef.current.flowers.length;
    const next = await commit((s) => completeTask(s, current.id));
    if (next && next.flowers.length > before) setBloom(next.flowers[0]);
  };
  const shareFlower = async (f: Flower) => {
    try {
      await saveTextFile(
        "onjeom-flower-card.svg",
        flowerCardSvg(f, flowerDay(f)),
        "image/svg+xml",
      );
    } catch (e) {
      setError(message(e));
    }
  };
  const backup = async () => {
    if (busyRef.current) return;
    try {
      await saveTextFile(
        "onjeom-backup.json",
        await store.current.backup(),
        "application/json",
      );
    } catch (e) {
      setError(message(e));
    }
  };
  const restore = async () => {
    try {
      const text = await pickBackupText();
      if (text === null) return;
      setConfirmation({
        title: "백업으로 복원할까요?",
        body: "현재 기기 데이터 전체를 선택한 백업으로 바꿉니다. 먼저 현재 데이터를 백업해 주세요.",
        label: "복원",
        action: () =>
          void replaceData(async () => {
            if (store.current) return store.current.restore(text);
            store.current = await recoverPlatformStore(text);
            return store.current.load();
          }),
      });
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
      setManage(false);
      setEditingId(null);
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
        {Platform.OS === "web" && (
          <Text style={s.small}>웹앱 · 이 브라우저에만 저장돼요.</Text>
        )}
        <InstallHint />
      </View>
      {error ? (
        <View accessibilityRole="alert" style={s.error}>
          <Text>{error}</Text>
          {!ready && (
            <>
              <Button title="다시 불러오기" onPress={() => void load()} />
              <Button title="백업에서 복구" onPress={() => void restore()} />
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
            ref={scroll}
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
                <GardenScene
                  season={season}
                  progress={state.progress}
                  flowers={state.flowers}
                />
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
                  원본의 한국어 규칙 기반 분리 · AI가 아닙니다.
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
                    <Text style={s.small}>
                      순서를 바꾸려면 항목을 선택해 이동해 주세요.
                    </Text>
                    {draft.map((_, i) => (
                      <View key={`order-${i}`} style={s.row}>
                        <Text style={s.small}>{i + 1}번</Text>
                        <Button
                          title="위로"
                          secondary
                          disabled={i === 0}
                          onPress={() => {
                            const next = [...draft];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            setDraft(next);
                          }}
                        />
                        <Button
                          title="아래로"
                          secondary
                          disabled={i === draft.length - 1}
                          onPress={() => {
                            const next = [...draft];
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            setDraft(next);
                          }}
                        />
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
                        void commit((s) =>
                          addTasks(s, draft, { original: thought }),
                        ).then((next) => {
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
                <Button
                  title="할 일 살펴보기·수정"
                  secondary
                  onPress={() => setManage(true)}
                />
                <View style={s.card}>
                  <Text style={s.subtitle}>오늘의 작은 흔적</Text>
                  <Text style={s.body}>
                    완료한 일 {state.completedTotal}개 · 피어난 꽃{" "}
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
                <FlowerArt size={140} stage={state.progress} color="#dfbcb0" />
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
                      title="나중에 하기 · 씨앗에 보관"
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
                  다음 꽃까지 작은 행동 {4 - (state.completedTotal % 4)}개 ·
                  시간은 재지 않아요.
                </Text>
              </>
            )}
            {tab === "정원" && (
              <>
                <Text style={s.eyebrow}>{season}의 작은 정원</Text>
                <Text style={s.title}>어느새, 피어났네요.</Text>
                <GardenScene
                  season={season}
                  progress={state.progress}
                  flowers={state.flowers}
                />
                <View style={s.row}>
                  {["기억", "도감"].map((section) => (
                    <View key={section} style={{ flex: 1 }}>
                      <Button
                        title={section === "기억" ? "기억의 정원" : "꽃 도감"}
                        secondary={gardenView !== section}
                        onPress={() => setGardenView(section)}
                      />
                    </View>
                  ))}
                </View>
                {gardenView === "기억" && (
                  <>
                    <Text accessibilityRole="header" style={s.subtitle}>
                      기억의 정원 · {state.flowers.length}송이
                    </Text>
                    <Text style={s.body}>
                      미등록 꽃도 이곳에 계속 남아요. 도감 등록은 언제든 선택할
                      수 있어요.
                    </Text>
                    {state.flowers.map((f) => {
                      const info = flowerInfo(f);
                      return (
                        <View style={s.card} key={f.id}>
                          <View style={s.row}>
                            <FlowerArt
                              size={60}
                              species={f.speciesId}
                              color={info.color.hex}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={s.subtitle}>{info.name}</Text>
                              <Text style={s.small}>
                                {info.color.name} · {flowerDay(f)}
                              </Text>
                              <Text style={s.body}>“{info.meaning}”</Text>
                              <Text style={s.small}>
                                온점. 창작 문구 · 전통 꽃말을 뜻하지 않아요.
                              </Text>
                            </View>
                          </View>
                          <Text style={s.small}>{achievementText(f)}</Text>
                          <Button
                            title="꽃말 카드 저장·공유 · 무료"
                            secondary
                            onPress={() => void shareFlower(f)}
                          />
                          {f.registeredAt ? (
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
                    {!state.flowers.length && (
                      <View style={s.card}>
                        <Text style={s.subtitle}>아직은, 여백으로 두어요.</Text>
                        <Text style={s.body}>
                          하루를 하나씩 정리하다 보면 이곳에도 나만의 꽃이 남을
                          거예요.
                        </Text>
                      </View>
                    )}
                  </>
                )}
                {gardenView === "도감" && (
                  <>
                    <Text style={s.subtitle}>꽃 도감</Text>
                    <Text style={s.small}>꽃말은 온점.의 창작 문구입니다.</Text>
                    <Text style={s.small}>
                      원본 기본 12종 · 고정일 시즌 3종 · 추석은 공식 연도별 일정
                      등록 후 제공해요.
                    </Text>
                    {catalogSpecies.map((species: any) => {
                      const found = state.flowers.filter(
                        (f) => f.registeredAt && f.speciesId === species.id,
                      );
                      return (
                        <View key={species.id} style={s.card}>
                          <FlowerArt
                            species={species.id}
                            color={found[0]?.color || "#c3cdb8"}
                            stage={found.length ? 4 : 0}
                            size={75}
                          />
                          <Text style={s.subtitle}>
                            {found.length
                              ? species.name
                              : "아직 만나지 않은 꽃"}
                          </Text>
                          <Text style={s.small}>
                            {found.length
                              ? `${species.quote} · ${new Set(found.map((f) => f.variantId)).size}가지 색상`
                              : "일상을 정리하다 보면 만날 수 있어요."}
                          </Text>
                          {found.map((f) => (
                            <Text key={f.id} style={s.body}>
                              {flowerInfo(f).color.name} · {flowerDay(f)} · “
                              {f.quote}”{"\n"}
                              {achievementText(f)}
                            </Text>
                          ))}
                        </View>
                      );
                    })}
                  </>
                )}
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
                  .filter((t) => t.status === "postponed")
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
                {!state.tasks.some((t) => t.status === "postponed") && (
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
                    않습니다. 개발용 확률은 일반 96.5%, 달빛·오로라 합계 3%,
                    금빛 0.5%이며 무료·PLUS가 동일합니다.
                  </Text>
                  <View style={s.row}>
                    <Text style={[s.body, { flex: 1 }]}>PLUS 테스트</Text>
                    <Switch
                      accessibilityLabel="PLUS 테스트 모드"
                      value={state.premiumDemo}
                      disabled={busy}
                      onValueChange={(v) =>
                        void commit((s) => ({
                          ...s,
                          premiumDemo: v,
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
                    이 기기에 자동 저장 · 서버 전송 없음. 백업 파일에는 생각과
                    성취 기록이 담기며 암호화되지 않습니다. 안전한 곳에 보관해
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
                      setConfirmation({
                        title: "모든 기록을 지울까요?",
                        body: "꽃, 씨앗과 성취 기록이 모두 삭제됩니다. 내보낸 백업 파일은 별도로 삭제해 주세요.",
                        label: "전체 삭제",
                        action: () =>
                          void replaceData(() => store.current.clear()),
                      })
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
      <Sheet visible={!!confirmation} onClose={() => setConfirmation(null)}>
        <Text accessibilityRole="header" style={s.title}>
          {confirmation?.title}
        </Text>
        <Text style={s.body}>{confirmation?.body}</Text>
        <Button
          title={confirmation?.label || "확인"}
          disabled={busy}
          onPress={() => {
            const action = confirmation?.action;
            setConfirmation(null);
            action?.();
          }}
        />
        <Button title="취소" secondary onPress={() => setConfirmation(null)} />
      </Sheet>
      <Sheet visible={manage} onClose={() => setManage(false)}>
        <Text style={s.title}>내가 정하는 한 걸음</Text>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        {active.map((t, i) => (
          <View key={t.id} style={s.card}>
            <Text style={s.subtitle}>{t.title}</Text>
            {editingId === t.id ? (
              <>
                <TextInput
                  accessibilityLabel="할 일 제목 수정"
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  maxLength={500}
                  style={s.input}
                />
                <Button
                  title="수정 저장"
                  disabled={busy}
                  onPress={() =>
                    void commit((s) => editTask(s, t.id, editingTitle)).then(
                      (next) => {
                        if (next) setEditingId(null);
                      },
                    )
                  }
                />
              </>
            ) : (
              <Button
                title="제목 수정"
                secondary
                onPress={() => {
                  setEditingId(t.id);
                  setEditingTitle(t.title);
                }}
              />
            )}
            <View style={s.row}>
              <Button
                title="위로"
                secondary
                disabled={busy || i === 0}
                onPress={() => void commit((s) => reorderTask(s, t.id, -1))}
              />
              <Button
                title="아래로"
                secondary
                disabled={busy || i === active.length - 1}
                onPress={() => void commit((s) => reorderTask(s, t.id, 1))}
              />
            </View>
            <Button
              title="할 일 삭제"
              secondary
              disabled={busy}
              onPress={() => (
                setManage(false),
                setConfirmation({
                  title: "할 일을 삭제할까요?",
                  body: "다시 하고 싶은 일은 씨앗 보관함에 둘 수도 있어요.",
                  label: "삭제",
                  action: () =>
                    void commit((s) => changeTask(s, t.id, "delete")),
                })
              )}
            />
          </View>
        ))}
        {!active.length && <Text style={s.body}>지금 할 일은 없어요.</Text>}
        <Button title="돌아가기" secondary onPress={() => setManage(false)} />
      </Sheet>
      <Sheet visible={splitId !== null} onClose={() => setSplitId(null)}>
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
        <Button title="돌아가기" secondary onPress={() => setSplitId(null)} />
      </Sheet>
      <Sheet visible={!!bloom} onClose={() => setBloom(null)} opacity={fade}>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        {bloom && (
          <>
            <Text style={s.eyebrow}>당신의 작은 행동 끝에</Text>
            <FlowerArt
              species={bloom.speciesId}
              color={flowerInfo(bloom).color.hex}
              size={135}
            />
            <Text accessibilityRole="header" style={s.title}>
              {subject(flowerInfo(bloom).name)} 피었어요.
            </Text>
            <Text style={s.body}>“{flowerInfo(bloom).meaning}”</Text>
            <Text style={s.small}>
              온점. 창작 문구 · 전통 꽃말을 뜻하지 않아요.
            </Text>
            <Text style={s.small}>
              {flowerDay(bloom)} · {flowerInfo(bloom).color.name}
              {"\n"}
              {achievementText(bloom)}
            </Text>
            <Button
              title="꽃말 카드 저장·공유 · 무료"
              secondary
              onPress={() => void shareFlower(bloom)}
            />
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
      </Sheet>
      <Sheet visible={!!adFlower} onClose={() => setAdFlower(null)}>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Text style={s.eyebrow}>보상형 광고 · 테스트 모드</Text>
        <Text style={s.title}>도감에 새 꽃을 담을까요?</Text>
        <Text style={s.body}>
          실제 광고는 재생되지 않습니다. 아래 버튼으로 보상 결과를 테스트할 수
          있어요. 취소하거나 광고가 없어도 꽃은 정원에 영구 보관됩니다.
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
            setError(
              "광고가 없어요. 꽃은 정원에서 기다릴게요. 나중에 다시 담아도 좋아요.",
            );
          }}
        />
        <Button
          title="취소하고 꽃 보관"
          secondary
          onPress={() => setAdFlower(null)}
        />
      </Sheet>
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
});
