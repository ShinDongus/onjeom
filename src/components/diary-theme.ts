import { StyleSheet } from "react-native";
export const ink = "#344b3c",
  sage = "#61785c",
  paper = "#faf6eb",
  muted = "#76816f",
  line = "#dedfcd";
export const diary = StyleSheet.create({
  page: { gap: 20, paddingTop: 4 },
  eyebrow: { color: muted, fontSize: 11, letterSpacing: 1.3 },
  title: {
    color: ink,
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "600",
    letterSpacing: -1,
  },
  heading: { color: ink, fontSize: 17, lineHeight: 26, fontWeight: "500" },
  body: { color: ink, fontSize: 15, lineHeight: 27 },
  small: { color: muted, fontSize: 12, lineHeight: 21 },
  section: { paddingTop: 16, borderTopWidth: 1, borderTopColor: line, gap: 12 },
  primary: {
    backgroundColor: sage,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fffef5", fontSize: 15, fontWeight: "600" },
  quiet: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
});
