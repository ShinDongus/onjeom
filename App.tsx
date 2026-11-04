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
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import FlowerPortrait from "./src/components/FlowerPortrait";
import HomeScreen from "./src/components/HomeScreen";
import DiaryPaper from "./src/components/PaperTexture";
import RecordsScreen from "./src/components/RecordsScreen";
import CatalogScreen from "./src/components/CatalogScreen";
import { diaryDay, setDiaryEntry } from "./src/diary.mjs";
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
import ActionHome from "./src/components/ActionHome";
import { actionableTasks, taskPath } from "./src/mobile-domain.mjs";
import {
  rulePlan,
  addPlan,
  removePlanBranch,
  movePlanBranch,
  shiftPlanBranch,
  planDepth,
} from "./src/planner.mjs";
import { groqSeparate } from "./src/groq-client.mjs";
import { saveJournal } from "./src/journal.mjs";
import { ruleSeparator } from "./src/separator.mjs";

type Task = {
  id: string;
  title: string;
  status: string;
  order: number;
  parentId?: string;
  aggregate?: boolean;
};
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
const palette = {
  ink: "#283e34",
  muted: "#65776b",
  sage: "#61785c",
  cream: "#faf6eb",
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
  const current = actionableTasks(state)[0] as Task | undefined;
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
        setDraft(rulePlan(thought));
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
        structured: true,
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
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <DiaryPaper />
      <View style={s.header}>
        {["설정", "씨앗"].includes(tab) ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab(returnTab)}
            style={s.headerAction}
          >
            <Text style={s.small}>‹ 이전</Text>
          </Pressable>
        ) : (
          <Text style={s.pageMark}>
            {tab === "오늘"
              ? "오늘의 작은 시작"
              : tab === "실행"
                ? ""
                : "온점.의 작은 책장"}
          </Text>
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
                <ActionHome
                  state={state}
                  day={day}
                  current={current}
                  busy={busy || groqBusy}
                  thought={thought}
                  onChange={(value) => {
                    setThought(value);
                    setDraft(null);
                  }}
                  onSave={() => void saveThought()}
                  onOrganize={() => void organize()}
                  onStart={() => setTab("실행")}
                  onManage={() => setManage(true)}
                  onSeeds={() => openAux("씨앗")}
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
                  onReflect={async (text, mood) =>
                    !!(await commit((s) => saveJournal(s, day, { text, mood })))
                  }
                />
              )}
              {tab === "실행" && (
                <FocusScreen
                  current={current}
                  path={
                    current
                      ? taskPath(state.tasks, current.id)
                          .slice(0, -1)
                          .map((t: Task) => t.title)
                          .join(" › ")
                      : ""
                  }
                  progress={state.progress}
                  busy={busy}
                  onComplete={() => void complete()}
                  onLater={() =>
                    current &&
                    void commit((s) => changeTask(s, current.id, "later"))
                  }
                  onSplit={() => {
                    if (current) {
                      setSplitId(current.id);
                      setSteps("");
                    }
                  }}
                  onCompose={() => setTab("오늘")}
                  onBack={() => setTab("오늘")}
                />
              )}
              {tab === "정원" && (
                <>
                  <View style={s.gardenHeading}>
                    <View>
                      <Text style={s.eyebrow}>{season}의 꽃을 모은 페이지</Text>
                      <Text accessibilityRole="header" style={s.title}>
                        기억의 정원
                      </Text>
                    </View>
                  </View>
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
                      새 품종·색상 조합만 선택형 보상 테스트 대상이며, 같은 꽃은
                      광고 없이 담아요.
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
                      할 일과 꽃은 자동 저장해요. 생각과 회고는 저장 버튼으로
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
          <View style={s.nav}>
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
                  color={activeTab === name ? "#49664d" : "#9aa58e"}
                />
                <Text
                  style={[
                    s.navText,
                    activeTab === name && {
                      color: palette.ink,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {name}
                </Text>
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
      <Sheet visible={compose} onClose={() => setCompose(false)}>
        <Text accessibilityRole="header" style={s.title}>
          {draft === null ? "생각을 꺼내놓아요." : "목표와 작은 행동 검토"}
        </Text>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        {draft !== null && (
          <>
            <Text style={s.small}>
              {draftSource === "groq"
                ? "Groq AI가 제안한 메모예요. 입력과 맞는지 직접 검토한 뒤 시작해요."
                : "규칙으로 나눈 메모예요. 직접 다듬은 뒤 시작해요."}
            </Text>
            <Text style={s.small}>지금 할 수 있는 일만 남겨도 좋아요.</Text>
            <Text style={s.body}>
              목표 아래 작은 행동을 확인해요. ‘하위로’로 더 작게 나누고
              ‘상위로’로 꺼낼 수 있어요. 목표를 제외하면 그 아래 행동도 함께
              제외해요.
            </Text>
            {draft.map((text, i) => (
              <View
                key={i}
                style={[
                  s.record,
                  {
                    marginLeft: Math.min(planDepth(text), 3) * 12,
                    borderLeftWidth: planDepth(text) ? 2 : 0,
                    borderLeftColor: palette.line,
                    paddingLeft: 8,
                  },
                ]}
              >
                <View style={s.row}>
                  <Text style={[s.eyebrow, { flex: 1 }]}>
                    {planDepth(text) ? "↳ 하위 행동" : "목표 / 프로젝트"} ·{" "}
                    {i + 1}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`할 일 ${i + 1} 제외`}
                    onPress={() => setDraft(removePlanBranch(draft, i))}
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={s.small}>제외</Text>
                  </Pressable>
                </View>
                <TextInput
                  accessibilityLabel={`할 일 ${i + 1} 수정`}
                  multiline
                  value={text}
                  maxLength={500}
                  onChangeText={(v) =>
                    setDraft(draft.map((x, j) => (j === i ? v : x)))
                  }
                  style={s.input}
                />
                <View
                  style={[
                    s.row,
                    { justifyContent: "flex-end", flexWrap: "wrap" },
                  ]}
                >
                  <Button
                    title="상위로"
                    secondary
                    disabled={!planDepth(text)}
                    onPress={() => setDraft(shiftPlanBranch(draft, i, -1))}
                  />
                  <Button
                    title="하위로"
                    secondary
                    disabled={
                      !i ||
                      planDepth(text) >= 7 ||
                      planDepth(draft[i - 1]) < planDepth(text)
                    }
                    onPress={() => setDraft(shiftPlanBranch(draft, i, 1))}
                  />
                  {[-1, 1].map((direction) => (
                    <Pressable
                      key={direction}
                      accessibilityRole="button"
                      accessibilityLabel={`${i + 1}번 할 일 ${direction < 0 ? "위로" : "아래로"}`}
                      disabled={
                        i + direction < 0 || i + direction >= draft.length
                      }
                      onPress={() => {
                        const next = movePlanBranch(draft, i, direction);
                        setDraft(next);
                      }}
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity:
                          i + direction < 0 || i + direction >= draft.length
                            ? 0.3
                            : 1,
                      }}
                    >
                      <Text style={s.small}>
                        {direction < 0 ? "↑ 위로" : "↓ 아래로"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <Button
              title="항목 더 적기"
              secondary
              disabled={draft.length >= 100}
              onPress={() => setDraft([...draft, ""])}
            />
            <Button
              title="한 걸음 모드 시작"
              disabled={busy || !draft.some((x) => x.trim())}
              onPress={() =>
                void commit((s) =>
                  setDiaryEntry(addPlan(s, draft, { original: thought }), day, {
                    draft: "",
                  }),
                ).then((next) => {
                  if (next) {
                    setDraft(null);
                    setThought("");
                    setCompose(false);
                    setTab("실행");
                  }
                })
              }
            />
          </>
        )}
        <Button
          title="생각으로 돌아가기"
          secondary
          onPress={() => {
            setCompose(false);
            setTab("오늘");
          }}
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
            <Text style={[s.eyebrow, { textAlign: "center", fontSize: 12 }]}>
              당신의 작은 행동 끝에
            </Text>
            <FlowerPortrait
              species={bloom.speciesId}
              color={flowerInfo(bloom).color.hex}
            />
            <Text
              accessibilityRole="header"
              style={[s.title, { textAlign: "center", marginTop: 0 }]}
            >
              {subject(flowerInfo(bloom).name)} 피었어요.
            </Text>
            <Text style={s.quote}>“{flowerInfo(bloom).meaning}”</Text>
            <Text style={[s.small, { textAlign: "center", fontSize: 11 }]}>
              온점. 창작 문구 · 전통 꽃말을 뜻하지 않아요.
            </Text>
            <View style={s.bloomMemory}>
              <Text style={s.small}>
                {flowerDay(bloom)} · {flowerInfo(bloom).color.name}
              </Text>
              <Text
                numberOfLines={2}
                style={[s.small, { textAlign: "center", fontSize: 12 }]}
              >
                {achievementText(bloom)}
              </Text>
            </View>
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
  canvas: { flex: 1, backgroundColor: "#e9eade" },
  safe: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: palette.cream,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageMark: { fontSize: 10, color: "#939983", letterSpacing: 1 },
  brand: {
    fontSize: 23,
    fontWeight: "700",
    color: palette.ink,
    letterSpacing: -1,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  small: { fontSize: 13, lineHeight: 21, color: palette.muted },
  content: {
    padding: 24,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 16,
    width: "100%",
    maxWidth: 480,
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
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: palette.line,
    borderRadius: 0,
    padding: 12,
    fontSize: 16,
    lineHeight: 26,
    color: palette.ink,
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: palette.sage,
    borderRadius: 12,
    padding: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  secondary: { backgroundColor: "#efeddf" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  card: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingVertical: 18,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: palette.sage, fontWeight: "600", padding: 10 },
  nav: {
    flexDirection: "row",
    backgroundColor: palette.cream,
    borderTopWidth: 0.7,
    borderTopColor: palette.line,
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 7,
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    gap: 4,
    alignItems: "center",
    minHeight: 56,
  },
  navText: { fontSize: 11, color: palette.muted },
  navActive: {},
  gardenHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gardenCount: { fontSize: 24, color: palette.sage, fontWeight: "500" },
  gardenNote: {
    fontSize: 12,
    lineHeight: 21,
    textAlign: "center",
    color: "#89977f",
    paddingHorizontal: 12,
  },
  segments: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "#eeebdf",
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#fffdf6",
    shadowColor: "#576649",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segmentText: { fontSize: 13, color: "#8a967f" },
  segmentTextActive: { color: "#49664d", fontWeight: "600" },
  quote: {
    fontSize: 20,
    lineHeight: 31,
    color: palette.sage,
    textAlign: "center",
    marginVertical: 8,
  },
  bloomMemory: { alignItems: "center", paddingVertical: 8, gap: 4 },
  record: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingVertical: 12,
    gap: 8,
  },
  error: { backgroundColor: "#f4e2d3", padding: 16 },
});
