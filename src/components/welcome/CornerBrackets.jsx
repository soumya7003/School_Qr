import { StyleSheet } from "react-native";
import { Path, Svg } from "react-native-svg";

export const CornerBrackets = ({ size, color = "rgba(255,59,48,0.55)", thickness = 1.5, arm = 14 }) => (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Path d={`M${arm} 0 L0 0 L0 ${arm}`} stroke={color} strokeWidth={thickness} fill="none" />
        <Path d={`M${size - arm} 0 L${size} 0 L${size} ${arm}`} stroke={color} strokeWidth={thickness} fill="none" />
        <Path d={`M0 ${size - arm} L0 ${size} L${arm} ${size}`} stroke={color} strokeWidth={thickness} fill="none" />
        <Path d={`M${size} ${size - arm} L${size} ${size} L${size - arm} ${size}`} stroke={color} strokeWidth={thickness} fill="none" />
    </Svg>
);