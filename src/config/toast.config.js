import { colors } from "@/theme";
import {
  ErrorToast,
  InfoToast,
  SuccessToast,
} from "react-native-toast-message";

export const toastConfig = {
  success: (props) => (
    <SuccessToast
      {...props}
      style={{ borderLeftColor: colors.ok, backgroundColor: colors.s2 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "700", color: colors.tx }}
      text2Style={{ fontSize: 13, color: colors.tx3 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.red, backgroundColor: colors.s2 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "700", color: colors.tx }}
      text2Style={{ fontSize: 13, color: colors.tx3 }}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: colors.blue, backgroundColor: colors.s2 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "700", color: colors.tx }}
      text2Style={{ fontSize: 13, color: colors.tx3 }}
    />
  ),
};
