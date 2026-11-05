import React, { useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetScrollContext } from "./SheetContext";
import { Text } from "./Type";
import { sand, line, typography } from "./diary-theme";
import PaperTexture from "./PaperTexture";
type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  opacity?: Animated.Value | number;
  footer?: React.ReactNode;
};
export default function Sheet({
  visible,
  onClose,
  children,
  opacity = 1,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.overlay}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="시트 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          testID="bottom-sheet"
          accessibilityViewIsModal
          style={[s.panel, { opacity, paddingBottom: insets.bottom + 24 }]}
        >
          <PaperTexture />
          <View style={s.top}>
            <View style={s.handle} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={s.close}
            >
              <Text style={typography.action}>닫기</Text>
            </Pressable>
          </View>
          <SheetScrollContext.Provider value={scroll}>
            <ScrollView
              ref={scroll}
              style={s.scroll}
              contentContainerStyle={s.content}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
            >
              {children}
            </ScrollView>
          </SheetScrollContext.Provider>
          {footer && (
            <View style={s.footer} testID="sheet-footer">
              {footer}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(52,75,60,.28)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    alignSelf: "center",
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: sand,
    overflow: "hidden",
    elevation: 0,
  },
  top: { height: 60, paddingTop: 16, alignItems: "center" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: line },
  close: {
    position: "absolute",
    right: 12,
    top: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 24, gap: 32 },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: line,
    gap: 12,
  },
});
