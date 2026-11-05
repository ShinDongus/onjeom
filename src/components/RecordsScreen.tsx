import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppIcon from "./AppIcon";
import { Text, TextInput } from "./Type";
import {
  calendarCells,
  diaryDay,
  recordedDays,
  recordDay,
  shiftMonth,
} from "../diary.mjs";
import { MOODS } from "../journal.mjs";
import { BotanicalSticker } from "./PaperTexture";
import {
  diary,
  typography,
  ink,
  muted,
  line,
  sand,
  floral,
} from "./diary-theme";
type Props = {
  state: any;
  today: string;
  busy: boolean;
  notes: Record<string, string>;
  onNoteChange: (day: string, value: string) => void;
  onPageChange: () => void;
  onSave: (day: string, note: string) => void;
  onSaveJournal: (day: string, text: string, mood: string | null) => void;
  onSaveThought: (id: string, text: string) => void;
  onSaveDraft: (day: string, text: string) => void;
  onFlower: (id: string) => void;
  onSeeds: () => void;
};
export default function RecordsScreen({
  state,
  today,
  busy,
  notes,
  onNoteChange,
  onSave,
  onSaveJournal,
  onSaveThought,
  onSaveDraft,
  onFlower,
}: Props) {
  const [month, setMonth] = useState(today.slice(0, 7)),
    [selected, setSelected] = useState<string | null>(null),
    [edits, setEdits] = useState<Record<string, string>>({});
  const marked = useMemo(() => recordedDays(state), [state]),
    blooms = useMemo(
      () => new Set(state.flowers.map((f: any) => recordDay(f.createdAt))),
      [state],
    );
  const record = selected ? diaryDay(state, selected) : null,
    cells = calendarCells(month);
  const field = (id: string, text: string, label: string, save: () => void) => (
    <View key={id} style={{ gap: 8 }}>
      <TextInput
        accessibilityLabel={label}
        value={edits[id] ?? text}
        onChangeText={(value) => setEdits((s) => ({ ...s, [id]: value }))}
        multiline
        maxLength={10000}
        style={s.note}
        textAlignVertical="top"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label.replace(/ 수정$/, " 저장")}
        disabled={busy || (edits[id] ?? text) === text}
        onPress={save}
        style={[diary.quiet, { alignSelf: "flex-end" }]}
      >
        <Text style={typography.action}>
          {(edits[id] ?? text) === text ? "✓ 저장됨" : "저장"}
        </Text>
      </Pressable>
    </View>
  );
  return (
    <View style={diary.page} testID="record-calendar">
      <View style={s.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => setMonth(shiftMonth(month, -1))}
          style={diary.quiet}
        >
          <AppIcon name="이전" color={ink} />
        </Pressable>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={typography.title}
        >
          {Number(month.slice(0, 4))}년 {Number(month.slice(5))}월
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => setMonth(shiftMonth(month, 1))}
          style={diary.quiet}
        >
          <AppIcon name="다음" color={ink} />
        </Pressable>
      </View>
      <View style={s.calendar}>
        <View style={s.week}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <View key={d} style={s.cell}>
              <Text style={typography.caption}>{d}</Text>
            </View>
          ))}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={s.week}>
            {cells
              .slice(row * 7, row * 7 + 7)
              .map((day: string | null, i: number) =>
                day ? (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} 기록 열기${marked.has(day) ? ", 기록 있음" : ""}`}
                    aria-selected={selected === day}
                    onPress={() => setSelected(day)}
                    style={[
                      s.cell,
                      (selected === day || (!selected && day === today)) && {
                        backgroundColor: sand,
                      },
                    ]}
                  >
                    <Text style={typography.caption}>
                      {Number(day.slice(8))}
                    </Text>
                    <View
                      testID={
                        blooms.has(day) ? "calendar-bloom-dot" : undefined
                      }
                      style={[
                        s.dot,
                        {
                          backgroundColor: blooms.has(day)
                            ? floral
                            : marked.has(day)
                              ? muted
                              : "transparent",
                        },
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
      {record && selected && (
        <View style={diary.page} testID="record-page">
          <Text accessibilityRole="header" style={typography.title}>
            {Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일의
            페이지
          </Text>
          {(record.thoughts.length > 0 ||
            record.draft ||
            record.journal.text) && (
            <View style={diary.section}>
              <Text style={typography.heading}>그날의 생각</Text>
              {record.thoughts.map((t: any, index: number) =>
                field(t.id, t.original, `생각 원문 ${index + 1} 수정`, () =>
                  onSaveThought(t.id, edits[t.id] ?? t.original),
                ),
              )}
              {!!record.draft &&
                field(
                  `draft-${selected}`,
                  record.draft,
                  "저장한 생각 수정",
                  () =>
                    onSaveDraft(
                      selected,
                      edits[`draft-${selected}`] ?? record.draft,
                    ),
                )}
              {!!record.journal.text &&
                field(
                  `journal-${selected}`,
                  record.journal.text,
                  "이전 일기 수정",
                  () =>
                    onSaveJournal(
                      selected,
                      edits[`journal-${selected}`] ?? record.journal.text,
                      record.journal.mood,
                    ),
                )}
              {!!(record.journal.text || record.journal.mood) && (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {MOODS.map((mood: string) => (
                    <Pressable
                      key={mood}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`그날의 기분 ${mood}`}
                      aria-checked={record.journal.mood === mood}
                      accessibilityState={{
                        checked: record.journal.mood === mood,
                      }}
                      disabled={busy}
                      onPress={() =>
                        onSaveJournal(
                          selected,
                          record.journal.text,
                          record.journal.mood === mood ? null : mood,
                        )
                      }
                      style={[
                        diary.quiet,
                        record.journal.mood === mood && {
                          backgroundColor: sand,
                        },
                      ]}
                    >
                      <Text style={typography.caption}>{mood}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
          {!!record.completed.length && (
            <View style={diary.section}>
              <Text style={typography.heading}>완료한 작은 일</Text>
              {record.completed.map((t: any) => (
                <View key={t.id} style={s.done}>
                  <Text style={typography.action}>✓</Text>
                  <Text style={[typography.body, { flex: 1 }]}>{t.title}</Text>
                </View>
              ))}
            </View>
          )}
          {!!record.flowers.length && (
            <View style={diary.section}>
              <Text style={typography.heading}>그날 피어난 꽃</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
                {record.flowers.map((f: any) => (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.name} 기록 보기`}
                    onPress={() => onFlower(f.id)}
                    style={s.flower}
                  >
                    <BotanicalSticker
                      size={88}
                      species={f.speciesId}
                      color={f.color}
                    />
                    <Text style={typography.caption}>{f.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={diary.section}>
            <Text style={typography.heading}>짧은 회고 기록</Text>
            <TextInput
              accessibilityLabel="짧은 기록"
              value={notes[selected] ?? record.note}
              onChangeText={(value) => onNoteChange(selected, value)}
              multiline
              maxLength={500}
              placeholder="오늘 기억하고 싶은 작은 순간은…"
              placeholderTextColor={muted}
              textAlignVertical="top"
              style={s.note}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="짧은 기록 저장"
              disabled={
                busy || (notes[selected] ?? record.note) === record.note
              }
              onPress={() => onSave(selected, notes[selected] ?? record.note)}
              style={[diary.quiet, { alignSelf: "flex-end" }]}
            >
              <Text style={typography.action}>
                {(notes[selected] ?? record.note) === record.note
                  ? "✓ 저장됨"
                  : "기록 저장"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  month: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendar: {
    marginHorizontal: -24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: line,
    paddingVertical: 16,
  },
  week: { flexDirection: "row" },
  cell: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 12,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  note: {
    ...typography.body,
    color: ink,
    minHeight: 84,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: line,
    backgroundColor: "transparent",
  },
  done: { flexDirection: "row", alignItems: "center", gap: 12 },
  flower: { minWidth: 88, minHeight: 44, alignItems: "center", gap: 8 },
});
