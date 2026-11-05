import { Text, TextInput } from "./src/components/Type";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  Text as SystemText,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { fontAssets } from "./src/font-assets";
import { MotionContext } from "./src/components/Motion";
import ActionButton from "./src/components/ActionButton";
import ReviewList from "./src/components/ReviewList";
import SeasonTitle from "./src/components/SeasonTitle";
import OnboardingCover from "./src/components/OnboardingCover";
import {
  typography,
  fonts,
  ink,
  muted,
  sage,
  paper,
  sand,
  line,
} from "./src/components/diary-theme";
import FlowerPortrait from "./src/components/FlowerPortrait";
import HomeScreen from "./src/components/HomeScreen";
import DiaryPaper from "./src/components/PaperTexture";
import RecordsScreen from "./src/components/RecordsScreen";
import CatalogScreen from "./src/components/CatalogScreen";
import { diaryDay, setDiaryEntry, editThoughtRecord } from "./src/diary.mjs";
import FocusScreen from "./src/components/FocusScreen";
import GardenPager from "./src/components/GardenPager";
import AppIcon from "./src/components/AppIcon";
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
import { groqSeparate } from "./src/groq-client.mjs";
import { saveJournal } from "./src/journal.mjs";
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
  thoughts: { id: string; original: string; createdAt: string }[];
  journals?: Record<
    string,
    { text: string; mood: string | null; updatedAt: string }
  >;
  diary?: Record<string, { draft: string; note: string; updatedAt: string }>;
};
const subject = (name: string) =>
  name + ((name.charCodeAt(name.length - 1) - 0xac00) % 28 === 0 ? "가" : "이");
const flowerDay = (f: Flower) =>
  f.createdAt.length === 10 ? f.createdAt : localDate(new Date(f.createdAt));
const achievementText = (f: Flower) =>
  (f.achievements?.length ? f.achievements : [f.originTask]).join(" · ");
const palette = { ink, muted, sage, cream: paper, sand, line };
const Button = ActionButton;
export default function App() {
  const [loaded, fontError] = useFonts(fontAssets);
  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: paper,
          justifyContent: "center",
          padding: 24,
        }}
      >
        {fontError && (
          <SystemText style={{ color: ink, fontSize: 16 }}>
            글꼴을 불러오지 못했어요. 앱을 다시 열어주세요.
          </SystemText>
        )}
      </View>
    );
  return (
    <SafeAreaProvider>
      <View style={s.canvas}>
        <Onjeom />
      </View>
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
  const [intro, setIntro] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [tab, setTab] = useState("오늘"),
    [thought, setThought] = useState(""),
    [draft, setDraft] = useState<string[] | null>(null);
  const [groqUrl, setGroqUrl] = useState("");
  const [groqAccess, setGroqAccess] = useState("");
  const [groqBusy, setGroqBusy] = useState(false);
  const [groqConsent, setGroqConsent] = useState(false);
  const [draftSource, setDraftSource] = useState("rules");
  const groqAbortRef = useRef<AbortController | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [returnTab, setReturnTab] = useState("오늘");
  const openAux = (name: string) => {
    setReturnTab(["오늘", "정원", "도감", "기록"].includes(tab) ? tab : "오늘");
    setTab(name);
  };
  const [confirmation, setConfirmation] = useState<{
    title: string;
    body: string;
    label: string;
    action: () => void;
  } | null>(null);
  const [compose, setCompose] = useState(false),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [unknown, setUnknown] = useState(false);
  const [manage, setManage] = useState(false),
    [editingId, setEditingId] = useState<string | null>(null),
    [editingTitle, setEditingTitle] = useState("");
  const [splitId, setSplitId] = useState<string | null>(null),
    [steps, setSteps] = useState("");
  const [bloom, setBloom] = useState<Flower | null>(null),
    [adFlower, setAdFlower] = useState<Flower | null>(null);
  const [systemReduce, setSystemReduce] = useState(false),
    [day, setDay] = useState(localDate());
  const dayRef = useRef(day);
  dayRef.current = day;
  const fade = useRef(new Animated.Value(1)).current;
  const load = async () => {
    try {
      if (!store.current) store.current = await openPlatformStore();
      const loaded = await store.current.load();
      stateRef.current = loaded;
      setState(loaded);
      setThought(loaded.diary?.[localDate()]?.draft || "");
      setIntro(!(await store.current.hasSeenIntro()));
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
      if (value === "active") {
        const today = localDate();
        if (today !== dayRef.current) {
          dayRef.current = today;
          groqAbortRef.current?.abort();
          setGroqBusy(false);
          setGroqConsent(false);
          setDay(today);
          setThought(stateRef.current.diary?.[today]?.draft || "");
          setDraft(null);
          setCompose(false);
        }
      }
    });
    return () => {
      listener.remove();
      app.remove();
    };
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (tab !== "오늘") {
      groqAbortRef.current?.abort();
      setGroqBusy(false);
      setGroqConsent(false);
    }
  }, [tab]);
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (["실행", "씨앗", "설정"].includes(tab)) {
        setTab(tab === "실행" ? "오늘" : returnTab);
        return true;
      }
      return false;
    });
    return () => back.remove();
  }, [tab, returnTab]);
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
  const current = active.find((t) => t.id === focusedId) || active[0];
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
  const selectedFlower = state.flowers.find((f) => f.id === selectedId);
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
  const complete = async (id = current?.id) => {
    if (!id) return;
    const before = stateRef.current.flowers.length;
    const next = await commit((s) => completeTask(s, id));
    if (next) setBloom(next.flowers.length > before ? next.flowers[0] : null);
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
      setThought(next.diary?.[day]?.draft || "");
      setBloom(null);
      setAdFlower(null);
      setSplitId(null);
      setManage(false);
      setCompose(false);
      setSelectedId(null);
      setUnknown(false);
      setEditingId(null);
      groqAbortRef.current?.abort();
      setGroqBusy(false);
      setGroqConsent(false);
      setNoteDrafts({});
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const saveThought = () =>
    commit((s) => setDiaryEntry(s, day, { draft: thought }));
  const organize = async () => {
    if (!thought.trim() || busyRef.current) return;
    const next = await saveThought();
    if (!next) return;
    try {
      if (draft === null) {
        setDraft(await ruleSeparator.separate(thought));
        setDraftSource("rules");
      }
      setCompose(true);
    } catch (e) {
      setError(message(e));
    }
  };
  const organizeWithGroq = async () => {
    if (groqBusy || busyRef.current) return;
    const source = thought;
    const controller = new AbortController();
    groqAbortRef.current = controller;
    setGroqBusy(true);
    try {
      const next = await saveThought();
      if (!next || controller.signal.aborted) return;
      const items = await groqSeparate(source, {
        endpoint: groqUrl.trim(),
        accessToken: groqAccess,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setDraft(items);
      setDraftSource("groq");
      setCompose(true);
      setError("");
    } catch (e) {
      if (!controller.signal.aborted) setError(message(e));
    } finally {
      if (groqAbortRef.current === controller) {
        groqAbortRef.current = null;
        setGroqBusy(false);
      }
    }
  };
  const todayRecord = diaryDay(state, day);
  const activeTab = ["오늘", "정원", "도감", "기록"].includes(tab)
    ? tab
    : tab === "실행"
      ? "오늘"
      : returnTab;
  const reduced = state.settings.reduceMotion || systemReduce;
  if (ready && intro)
    return (
      <MotionContext.Provider value={reduced}>
        <SafeAreaView style={s.safe}>
          <StatusBar style="dark" />
          <DiaryPaper />
          <OnboardingCover
            busy={busy}
            onOpen={() => {
              if (busyRef.current) return;
              setBusy(true);
              busyRef.current = true;
              void store.current
                .markIntroSeen()
                .then(() => setIntro(false))
                .catch((e: unknown) => setError(message(e)))
                .finally(() => {
                  busyRef.current = false;
                  setBusy(false);
                });
            }}
          />
          {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        </SafeAreaView>
      </MotionContext.Provider>
    );
  return (
    <MotionContext.Provider value={reduced}>
      <SafeAreaView style={s.safe}>
        <StatusBar style="dark" />
        <DiaryPaper />
        {tab !== "오늘" && tab !== "실행" && (
          <View style={s.header}>
            {["설정", "씨앗"].includes(tab) ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setTab(returnTab)}
                style={[
                  s.headerAction,
                  { width: 88, flexDirection: "row", gap: 8 },
                ]}
              >
                <AppIcon name="이전" color={ink} />
                <Text style={s.small}>이전</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="설정 열기"
              onPress={() => openAux("설정")}
              style={s.headerAction}
            >
              <AppIcon name="설정" />
            </Pressable>
          </View>
        )}
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
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                ref={scroll}
                contentContainerStyle={s.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets
              >
                {tab === "오늘" && (
                  <HomeScreen
                    day={day}
                    progress={state.progress}
                    tasks={active}
                    completed={todayRecord.completed}
                    thought={thought}
                    latestThought={
                      todayRecord.thoughts.at(-1)?.original ||
                      state.journals?.[day]?.text
                    }
                    onAI={
                      groqUrl && groqAccess
                        ? () => setGroqConsent(true)
                        : undefined
                    }
                    aiBusy={groqBusy}
                    onCancelAI={() => {
                      groqAbortRef.current?.abort();
                      setGroqBusy(false);
                    }}
                    saved={thought === (state.diary?.[day]?.draft || "")}
                    busy={busy || groqBusy}
                    onChange={(value) => {
                      setThought(value);
                      setDraft(null);
                    }}
                    onSave={() => void saveThought()}
                    onOrganize={() => void organize()}
                    onStart={(id) => {
                      setFocusedId(id);
                      setTab("실행");
                    }}
                    onComplete={(id) => void complete(id)}
                    onSettings={() => openAux("설정")}
                    bloom={bloom}
                    onFlower={() => bloom && setSelectedId(bloom.id)}
                    onManage={() => setManage(true)}
                    onSeeds={() => openAux("씨앗")}
                  />
                )}
                {tab === "실행" && (
                  <FocusScreen
                    current={current}
                    progress={state.progress}
                    busy={busy}
                    onComplete={() => void complete()}
                    onLater={() =>
                      current
                        ? commit((s) => changeTask(s, current.id, "later"))
                        : undefined
                    }
                    onSplit={(parts) => {
                      if (current)
                        void commit((s) =>
                          changeTask(s, current.id, "split", parts),
                        );
                    }}
                    bloom={bloom}
                    onFlower={() => bloom && setSelectedId(bloom.id)}
                    onCompose={() => setTab("오늘")}
                    onBack={() => setTab("오늘")}
                  />
                )}
                {tab === "정원" && (
                  <>
                    <SeasonTitle season={season} />
                    <GardenPager
                      season={season}
                      items={state.flowers.map((f) => ({
                        id: f.id,
                        flowerId: f.id,
                        name: f.name,
                        speciesId: f.speciesId,
                        color: f.color,
                        note: f.registeredAt ? "도감에 담김" : "아직 정원에",
                      }))}
                      onSelect={setSelectedId}
                    />
                    <Text style={s.gardenNote}>
                      {state.flowers.length
                        ? "꽃을 누르면 그날의 이야기가 펼쳐져요."
                        : "빈 자리도 다정하게. 작은 행동 끝에 꽃이 찾아와요."}
                    </Text>
                  </>
                )}
                {tab === "도감" && (
                  <CatalogScreen
                    species={catalogSpecies}
                    flowers={state.flowers}
                    onFlower={setSelectedId}
                    onGarden={() => setTab("정원")}
                  />
                )}
                {tab === "기록" && (
                  <RecordsScreen
                    state={state}
                    today={day}
                    busy={busy}
                    notes={noteDrafts}
                    onNoteChange={(date, value) =>
                      setNoteDrafts((s) => ({ ...s, [date]: value }))
                    }
                    onPageChange={() =>
                      scroll.current?.scrollTo({ y: 0, animated: false })
                    }
                    onSaveThought={(id, text) =>
                      void commit((s) => editThoughtRecord(s, id, text))
                    }
                    onSaveDraft={(date, text) =>
                      void commit((s) =>
                        setDiaryEntry(s, date, { draft: text }),
                      )
                    }
                    onSaveJournal={(date, text, mood) =>
                      void commit((s) => saveJournal(s, date, { text, mood }))
                    }
                    onSave={(date, note) =>
                      void commit((s) => setDiaryEntry(s, date, { note }))
                    }
                    onFlower={setSelectedId}
                    onSeeds={() => openAux("씨앗")}
                  />
                )}
                {tab === "씨앗" && (
                  <View style={{ gap: 32, backgroundColor: sand, padding: 24 }}>
                    <Text accessibilityRole="header" style={s.title}>
                      씨앗 보관함
                    </Text>
                    <Text style={s.body}>
                      언제든 준비되었을 때 다시 꺼내보세요
                    </Text>
                    {state.tasks
                      .filter((t) => t.status === "postponed")
                      .sort(
                        (a: any, b: any) =>
                          (a.createdAt || "").localeCompare(
                            b.createdAt || "",
                          ) || a.order - b.order,
                      )
                      .map((t: any) => (
                        <View key={t.id} style={s.card}>
                          <View style={s.row}>
                            <AppIcon name="씨앗" color={muted} />
                            <Text style={[s.body, { flex: 1 }]}>{t.title}</Text>
                          </View>
                          {t.createdAt && (
                            <Text style={s.small}>
                              {localDate(new Date(t.createdAt))}
                            </Text>
                          )}
                          <Button
                            title="오늘로 심기(복원)"
                            secondary
                            disabled={busy}
                            onPress={() =>
                              void commit((s) => changeTask(s, t.id, "restore"))
                            }
                          />
                          <Button
                            title="비우기"
                            secondary
                            disabled={busy}
                            onPress={() =>
                              setConfirmation({
                                title: "씨앗을 비울까요?",
                                body: "준비되었을 때 다시 꺼내도 괜찮아요.",
                                label: "비우기",
                                action: () =>
                                  void commit((s) =>
                                    changeTask(s, t.id, "delete"),
                                  ),
                              })
                            }
                          />
                        </View>
                      ))}
                  </View>
                )}
                {tab === "설정" && (
                  <>
                    <Text style={s.title}>나에게 편안하게</Text>
                    <InstallHint />
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
                        새 품종·색상 조합만 선택형 보상 테스트 대상이며, 같은
                        꽃은 광고 없이 담아요.
                      </Text>
                    </View>
                    <View style={s.card}>
                      <Text style={s.subtitle}>선택형 AI 연결 · Groq</Text>
                      <Text style={s.small}>
                        기본은 기기 안의 규칙 정리예요. 연결하면 오늘 화면에서
                        따로 요청할 수 있어요. 실제 전송 전에 동의를 다시
                        확인합니다. 연결 정보는 이번 실행에만 유지돼요.
                      </Text>
                      <TextInput
                        accessibilityLabel="Groq 백엔드 주소"
                        placeholder="https://내-서버.vercel.app/api/organize"
                        value={groqUrl}
                        onChangeText={setGroqUrl}
                        autoCorrect={false}
                        autoCapitalize="none"
                        style={s.input}
                      />
                      <TextInput
                        accessibilityLabel="온점 서버 접근 코드"
                        placeholder="서버의 온점. 접근 코드"
                        value={groqAccess}
                        onChangeText={setGroqAccess}
                        secureTextEntry
                        autoCorrect={false}
                        autoCapitalize="none"
                        style={s.input}
                      />
                      <Text style={s.small}>
                        Groq API 키는 앱에 입력하지 마세요. 본인 백엔드의 서버
                        전용 키로 설정하세요. 기본 사용에는 연결이 필요하지
                        않습니다.
                      </Text>
                      <Button
                        title="연결 정보 지우기"
                        secondary
                        onPress={() => {
                          setGroqUrl("");
                          setGroqAccess("");
                        }}
                      />
                    </View>
                    <View style={s.card}>
                      <Text style={s.subtitle}>내 기기에만 남는 기록</Text>
                      <Text style={s.body}>
                        할 일과 꽃은 자동 저장해요. 다이어리 글은 저장 버튼으로
                        남겨요. 서버 전송은 없어요. 백업 파일에는 생각과 성취
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
                          setConfirmation({
                            title: "모든 기록을 지울까요?",
                            body: "다이어리, 꽃, 씨앗과 성취 기록이 모두 삭제됩니다. 내보낸 백업 파일은 별도로 삭제해 주세요.",
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
            </KeyboardAvoidingView>
            <View style={s.nav} testID="bottom-tab-bar">
              {["오늘", "정원", "도감", "기록"].map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === name }}
                  aria-selected={activeTab === name}
                  onPress={() => setTab(name)}
                  style={[s.navItem, activeTab === name && s.navActive]}
                >
                  <AppIcon
                    name={name}
                    color={activeTab === name ? ink : muted}
                  />
                  <Text
                    style={[
                      s.navText,
                      activeTab === name && {
                        color: palette.ink,
                      },
                    ]}
                  >
                    {name}
                  </Text>
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 2,
                      backgroundColor:
                        activeTab === name ? sage : "transparent",
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Sheet visible={groqConsent} onClose={() => setGroqConsent(false)}>
          <Text style={s.title}>이번 생각만 AI로 보낼까요?</Text>
          <Text style={s.body}>
            현재 입력한 생각만 본인의 백엔드를 거쳐 Groq로 전송됩니다.
            일기·꽃·기존 기록은 자동 전송하지 않아요. 결과는 직접 검토한 뒤
            확정합니다.
          </Text>
          <Button
            title="이번 생각만 AI로 보내기"
            disabled={groqBusy || busy}
            onPress={() => {
              setGroqConsent(false);
              void organizeWithGroq();
            }}
          />
          <Button
            title="보내지 않고 돌아가기"
            secondary
            onPress={() => setGroqConsent(false)}
          />
        </Sheet>
        <Sheet
          visible={compose}
          onClose={() => setCompose(false)}
          footer={
            <Button
              title="오늘의 작은 일로 확정하기"
              disabled={busy || !draft?.some((t) => t.trim())}
              onPress={() => {
                if (draft)
                  void commit((s) =>
                    setDiaryEntry(
                      addTasks(s, draft, { original: thought }),
                      day,
                      { draft: "" },
                    ),
                  ).then((next) => {
                    if (next) {
                      setDraft(null);
                      setThought("");
                      setCompose(false);
                      setFocusedId(null);
                      setTab("실행");
                    }
                  });
              }}
            />
          }
        >
          <Text accessibilityRole="header" style={s.title}>
            생각 정리
          </Text>
          {error ? <Text accessibilityRole="alert">{error}</Text> : null}
          <Text style={s.small}>
            {draftSource === "groq"
              ? "Groq AI가 제안한 메모예요. 입력과 맞는지 직접 검토한 뒤 시작해요."
              : "규칙으로 나눈 메모예요. 직접 다듬은 뒤 시작해요."}
          </Text>
          {draft && <ReviewList items={draft} onChange={setDraft} />}
          <Button
            title="항목 더 적기"
            secondary
            disabled={!draft || draft.length >= 100}
            onPress={() => draft && setDraft([...draft, ""])}
          />
        </Sheet>
        <Sheet visible={!!selectedFlower} onClose={() => setSelectedId(null)}>
          {selectedFlower && (
            <>
              {error ? <Text accessibilityRole="alert">{error}</Text> : null}
              <Text style={s.eyebrow}>
                {flowerDay(selectedFlower)} · 나의 작은 기록
              </Text>
              <FlowerPortrait
                species={selectedFlower.speciesId}
                color={selectedFlower.color}
              />
              <Text accessibilityRole="header" style={s.title}>
                {selectedFlower.name}
              </Text>
              <Text style={s.small}>{selectedFlower.variantName}</Text>
              <Text style={s.quote}>“{selectedFlower.quote}”</Text>
              <Text style={s.small}>
                온점. 창작 문구 · 전통 꽃말을 뜻하지 않아요.
              </Text>
              <View style={s.record}>
                <Text style={s.eyebrow}>꽃을 피운 행동</Text>
                <Text style={s.body}>{achievementText(selectedFlower)}</Text>
              </View>
              <Button
                title="꽃말 카드 저장·공유 · 무료"
                secondary
                onPress={() => void shareFlower(selectedFlower)}
              />
              {selectedFlower.registeredAt ? (
                <Text style={s.link}>도감에 담았어요</Text>
              ) : (
                <Button
                  title="도감에 담기"
                  disabled={busy}
                  onPress={() => {
                    const f = selectedFlower;
                    setSelectedId(null);
                    void register(f);
                  }}
                />
              )}
              {selectedFlower.registeredAt &&
                state.flowers.filter(
                  (f) =>
                    f.registeredAt && f.speciesId === selectedFlower.speciesId,
                ).length > 1 && (
                  <View style={s.record}>
                    <Text style={s.subtitle}>이 꽃의 기억</Text>
                    {state.flowers
                      .filter(
                        (f) =>
                          f.registeredAt &&
                          f.speciesId === selectedFlower.speciesId,
                      )
                      .map((f) => (
                        <Pressable
                          key={f.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${f.variantName} ${flowerDay(f)} 기록`}
                          onPress={() => setSelectedId(f.id)}
                          style={{ paddingVertical: 12 }}
                        >
                          <Text style={s.small}>
                            {f.variantName} · {flowerDay(f)}
                          </Text>
                          <Text style={s.body}>{achievementText(f)}</Text>
                        </Pressable>
                      ))}
                  </View>
                )}
              <Button
                title="꽃 상세 닫기"
                secondary
                onPress={() => setSelectedId(null)}
              />
            </>
          )}
        </Sheet>
        <Sheet visible={unknown} onClose={() => setUnknown(false)}>
          <Text style={s.title}>아직 빈 페이지예요.</Text>
          <Text style={s.body}>
            하루를 조금씩 정리하다 보면, 나만의 꽃을 만나게 될 거예요.
          </Text>
          <Button title="도감으로 돌아가기" onPress={() => setUnknown(false)} />
        </Sheet>
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
          <Button
            title="취소"
            secondary
            onPress={() => setConfirmation(null)}
          />
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
    </MotionContext.Provider>
  );
}
const s = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: paper },
  safe: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: paper,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageMark: typography.caption,
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  small: typography.caption,
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 32,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  eyebrow: typography.caption,
  title: typography.title,
  subtitle: typography.heading,
  body: typography.body,
  input: {
    ...typography.body,
    borderBottomWidth: 1,
    borderBottomColor: line,
    borderRadius: 0,
    padding: 0,
    backgroundColor: "transparent",
    minHeight: 44,
  },
  card: { borderTopWidth: 1, borderTopColor: line, paddingTop: 32, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: {
    ...typography.action,
    minHeight: 44,
    paddingVertical: 12,
    color: ink,
  },
  nav: {
    height: 64,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: line,
    backgroundColor: paper,
  },
  navItem: {
    flex: 1,
    minHeight: 44,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  navActive: {},
  navText: typography.caption,
  gardenHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gardenNote: { ...typography.caption, textAlign: "center" },
  quote: { ...typography.body, textAlign: "center" },
  record: { borderTopWidth: 1, borderTopColor: line, paddingTop: 32, gap: 16 },
  error: { backgroundColor: sand, padding: 24 },
});
