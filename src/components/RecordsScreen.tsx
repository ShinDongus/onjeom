import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  calendarCells,
  diaryDay,
  recordedDays,
  shiftMonth,
} from "../diary.mjs";
import { MOODS } from "../journal.mjs";
import { BotanicalSticker } from "./PaperTexture";
import { diary, ink, line, muted, sage } from "./diary-theme";
export default function RecordsScreen({
  state,
  today,
  busy,
  notes,
  onNoteChange,
  onPageChange,
  onSave,
  onSaveJournal,
  onFlower,
  onSeeds,
}: {
  state: any;
  today: string;
  busy: boolean;
  notes: Record<string, string>;
  onNoteChange: (day: string, value: string) => void;
  onPageChange: () => void;
  onSave: (day: string, note: string) => void;
  onSaveJournal: (day: string, text: string, mood: string | null) => void;
  onFlower: (id: string) => void;
  onSeeds: () => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7)),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    onPageChange();
  }, [selected]);
  const [journalEdits, setJournalEdits] = useState<Record<string, string>>({});
  const marked = recordedDays(state),
    record = selected ? diaryDay(state, selected) : null;
  if (record && selected) {
    const note = notes[selected] ?? record.note;
    const journalText = journalEdits[selected] ?? record.journal.text;
    return (
      <View style={diary.page} testID="record-page">
        <View style={s.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(null)}
            style={diary.quiet}
          >
            <Text style={s.back}>‹ 달력으로</Text>
          </Pressable>
          <Text style={diary.eyebrow}>하루의 조각들</Text>
        </View>
        <View>
          <Text style={diary.eyebrow}>{selected.slice(0, 4)}년</Text>
          <Text accessibilityRole="header" style={diary.title}>
            {Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일의
            페이지
          </Text>
        </View>
        {!record.journal.text &&
          !record.journal.mood &&
          !record.draft &&
          !record.thoughts.length &&
          !record.completed.length &&
          !record.flowers.length &&
          !record.note && (
            <Text style={diary.small}>
              아직 여백인 페이지예요. 짧은 문장 하나를 남겨도 좋아요.
            </Text>
          )}
        {(record.thoughts.length > 0 || record.draft) && (
          <View style={diary.section}>
            <Text style={diary.heading}>생각 한 조각</Text>
            {record.thoughts.map((t: any) => (
              <Text key={t.id} style={diary.body}>
                {t.original}
              </Text>
            ))}
            {!!record.draft && <Text style={diary.body}>{record.draft}</Text>}
          </View>
        )}
        {!!record.completed.length && (
          <View style={diary.section}>
            <Text style={diary.heading}>작은 완료 표시</Text>
            {record.completed.map((t: any) => (
              <View key={t.id} style={s.done}>
                <Text style={s.check}>✓</Text>
                <Text style={[diary.body, { flex: 1 }]}>{t.title}</Text>
              </View>
            ))}
          </View>
        )}
        {!!record.flowers.length && (
          <View style={diary.section}>
            <Text style={diary.heading}>그날 피어난 꽃</Text>
            <View style={s.flowers}>
              {record.flowers.map((f: any) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.name} 기록 보기`}
                  onPress={() => onFlower(f.id)}
                  style={s.flower}
                >
                  <BotanicalSticker
                    species={f.speciesId}
                    color={f.color}
                    size={74}
                  />
                  <Text style={diary.small}>{f.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {!!record.journal.text && (
          <View style={diary.section}>
            <Text style={diary.heading}>이어온 일기</Text>
            <TextInput
              accessibilityLabel="이전 일기 수정"
              value={journalText}
              onChangeText={(value) =>
                setJournalEdits((s) => ({ ...s, [selected]: value }))
              }
              multiline
              maxLength={10000}
              style={s.note}
              textAlignVertical="top"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 일기 저장"
              disabled={busy || journalText === record.journal.text}
              onPress={() =>
                onSaveJournal(selected, journalText, record.journal.mood)
              }
              style={diary.quiet}
            >
              <Text style={s.back}>
                {journalText === record.journal.text ? "✓ 저장됨" : "일기 저장"}
              </Text>
            </Pressable>
          </View>
        )}
        <View style={diary.section}>
          <Text style={diary.small}>
            그날의 기분 · 선택해도, 비워두어도 괜찮아요.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {MOODS.map((mood: string) => (
              <Pressable
                key={mood}
                accessibilityRole="checkbox"
                accessibilityLabel={`그날의 기분 ${mood}`}
                aria-checked={record.journal.mood === mood}
                accessibilityState={{
                  checked: record.journal.mood === mood,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() =>
                  onSaveJournal(
                    selected,
                    journalText,
                    record.journal.mood === mood ? null : mood,
                  )
                }
                style={[
                  diary.quiet,
                  record.journal.mood === mood && {
                    backgroundColor: "#e6ebd8",
                    borderRadius: 12,
                  },
                ]}
              >
                <Text style={diary.small}>{mood}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={diary.section}>
          <Text style={diary.heading}>오늘을 붙잡는 한 문장</Text>
          <TextInput
            accessibilityLabel="짧은 기록"
            value={note}
            onChangeText={(v) => onNoteChange(selected, v)}
            multiline
            maxLength={500}
            placeholder="오늘 기억하고 싶은 작은 순간은…"
            placeholderTextColor="#9b9f8f"
            textAlignVertical="top"
            style={s.note}
          />
          <View style={s.row}>
            <Text style={diary.small}>{note.length} / 500</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="짧은 기록 저장"
              disabled={busy || note === record.note}
              accessibilityState={{ disabled: busy || note === record.note }}
              onPress={() => onSave(selected, note)}
              style={diary.quiet}
            >
              <Text style={s.back}>
                {note === record.note ? "✓ 저장됨" : "기록 저장"}
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="씨앗 보관함 열기"
          onPress={onSeeds}
          style={diary.quiet}
        >
          <Text style={diary.small}>다음을 기다리는 씨앗 보관함 ↗</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[diary.page, { gap: 14 }]} testID="record-calendar">
      <Text style={diary.eyebrow}>차곡차곡, 나의 날들</Text>
      <Text accessibilityRole="header" style={diary.title}>
        지난 페이지
      </Text>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => setMonth(shiftMonth(month, -1))}
          style={diary.quiet}
        >
          <Text style={s.chevron}>‹</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={diary.heading}>
          {Number(month.slice(0, 4))}년 {Number(month.slice(5))}월
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => setMonth(shiftMonth(month, 1))}
          style={diary.quiet}
        >
          <Text style={s.chevron}>›</Text>
        </Pressable>
      </View>
      <View style={s.calendar}>
        <View style={s.week}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <View key={d} style={s.cell}>
              <Text style={s.weekday}>{d}</Text>
            </View>
          ))}
        </View>
        {Array.from({ length: calendarCells(month).length / 7 }, (_, row) => (
          <View key={row} style={s.week}>
            {calendarCells(month)
              .slice(row * 7, row * 7 + 7)
              .map((day: string | null, i: number) =>
                day ? (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} 기록 열기${marked.has(day) ? ", 기록 있음" : ""}`}
                    onPress={() => setSelected(day)}
                    style={[s.cell, day === today && s.today]}
                  >
                    <Text
                      style={[
                        s.day,
                        day === today && { color: sage, fontWeight: "700" },
                      ]}
                    >
                      {Number(day.slice(8))}
                    </Text>
                    <View
                      style={[
                        s.dot,
                        marked.has(day) && { backgroundColor: sage },
                      ]}
                    />
                  </Pressable>
                ) : (
                  <View key={i} style={s.cell} />
                ),
              )}
          </View>
        ))}
      </View>
      <View style={s.invitation}>
        <BotanicalSticker species="babybreath" size={72} color="#e4dcc3" />
        <Text style={diary.small}>어느 날의 페이지를 펼쳐볼까요?</Text>
        <Text style={s.caption}>기록한 날에만 작은 점을 남겨요.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMonth(today.slice(0, 7));
          setSelected(today);
        }}
        style={diary.quiet}
      >
        <Text style={s.back}>오늘의 기록 펼치기 →</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="씨앗 보관함 열기"
        onPress={onSeeds}
        style={diary.quiet}
      >
        <Text style={diary.small}>씨앗 보관함 ↗</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: sage, fontSize: 13 },
  chevron: { fontSize: 28, color: sage },
  calendar: {
    marginHorizontal: -20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: line,
    paddingVertical: 10,
  },
  week: { flexDirection: "row" },
  cell: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 24,
  },
  weekday: { fontSize: 11, color: muted },
  day: { fontSize: 15, color: ink },
  dot: { height: 3, width: 3, borderRadius: 2, backgroundColor: "transparent" },
  today: { backgroundColor: "#edf0df" },
  invitation: { alignItems: "center", gap: 6, paddingTop: 8 },
  caption: { fontSize: 10, color: "#999e89" },
  done: { flexDirection: "row", alignItems: "center", gap: 12 },
  check: { color: sage, fontSize: 19 },
  note: {
    minHeight: 110,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: line,
    fontSize: 15,
    lineHeight: 28,
    color: ink,
  },
  flowers: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  flower: { minWidth: 85, alignItems: "center", paddingBottom: 10 },
});
