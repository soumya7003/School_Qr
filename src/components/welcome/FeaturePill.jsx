import { C } from "@/constants/constants";
import { styles } from "@/styles/welcome.style";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";

export const FeaturePill = ({ lib, icon, label, delay }) => (
    <Animated.View entering={FadeInLeft.duration(500).delay(delay)} style={styles.featurePill}>
        <View style={styles.featurePillIcon}>
            {lib === "feather" ? <Feather name={icon} size={12} color={C.white60} /> : <MaterialCommunityIcons name={icon} size={13} color={C.white60} />}
        </View>
        <Text style={styles.featurePillText} allowFontScaling={false}>{label}</Text>
    </Animated.View>
);