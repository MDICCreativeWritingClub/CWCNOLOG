// Shared input style helpers for the login and signup pages, so both
// stay visually identical without duplicating the same inline style
// objects twice.
import type { CSSProperties } from "react";
import { colors } from "@/lib/theme";

export const authInputWrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  padding: "0.75rem 1rem",
  borderRadius: "0.85rem",
  border: `1px solid ${colors.gray200}`,
  backgroundColor: "transparent",
};

export const authInputStyle: CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: colors.heading,
  fontSize: "0.9rem",
};
