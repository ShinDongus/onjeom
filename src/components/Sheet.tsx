import React from "react";
import DiaryPaper from "./PaperTexture";
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
type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  opacity?: Animated.Value | number;
};
export default function Sheet({
  visible,
  onClose,
  children,
  opacity = 1,
}: Props) {
  const insets = useSafeAreaInsets();
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
          style={[
            s.panel,
            { opacity, paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <DiaryPaper />
          <View style={s.top}>
            <View style={s.handle} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={s.close}
            >
              <View style={s.crossA} />
              <View style={s.crossB} />
            </Pressable>
          </View>
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(30,49,35,.32)",
    paddingTop: 32,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "94%",
    alignSelf: "center",
    flexShrink: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#faf6eb",
    shadowColor: "#203821",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -8 },
    elevation: 2,
    overflow: "hidden",
  },
  top: { height: 36, alignItems: "center", justifyContent: "center" },
  handle: { width: 32, height: 4, borderRadius: 3, backgroundColor: "#d4dbc9" },
  close: {
    position: "absolute",
    right: 9,
    top: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  crossA: {
    position: "absolute",
    width: 12,
    height: 1.5,
    backgroundColor: "#89967d",
    transform: [{ rotate: "45deg" }],
  },
  crossB: {
    position: "absolute",
    width: 12,
    height: 1.5,
    backgroundColor: "#89967d",
    transform: [{ rotate: "-45deg" }],
  },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 16, gap: 12 },
});
