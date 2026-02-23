import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Collapsible } from "@/components/ui/Collapsible";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Fonts } from "@/constants/theme";

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded }}
        >
          Explore
        </ThemedText>
      </ThemedView>

      <ThemedText>
        This app includes example code to help you get started.
      </ThemedText>

      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{" "}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/index.jsx
          </ThemedText>{" "}
          and{" "}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/explore.jsx
          </ThemedText>
        </ThemedText>

        <ThemedText>
          The layout file in{" "}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/_layout.jsx
          </ThemedText>{" "}
          sets up the tab navigator.
        </ThemedText>

        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Images">
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={{ width: 100, height: 100, alignSelf: "center" }}
        />
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});