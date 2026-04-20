import { StyleSheet } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

export const GeometricPattern = ({ width, height }) => {
    const cx = width / 2;
    const cy = height * 0.36;
    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {Array.from({ length: 16 }).map((_, i) => (
                <Path key={`dl-${i}`} d={`M${-120 + i * 70} 0 L${i * 70 + 160} ${height}`} stroke="rgba(255,255,255,0.013)" strokeWidth="1" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
                <Path key={`hl-${i}`} d={`M0 ${80 + i * 80} L${width} ${80 + i * 80}`} stroke="rgba(255,255,255,0.012)" strokeWidth="1" />
            ))}
            <Path d={`M${width - 32} 20 L${width - 20} 20 L${width - 20} 32`} stroke="rgba(255,59,48,0.35)" strokeWidth="1.5" fill="none" />
            <Path d={`M20 ${height - 32} L20 ${height - 20} L32 ${height - 20}`} stroke="rgba(255,59,48,0.25)" strokeWidth="1.5" fill="none" />
            <Path d={`M32 20 L20 20 L20 32`} stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
            <Path d={`M${width - 32} ${height - 20} L${width - 20} ${height - 20} L${width - 20} ${height - 32}`} stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
            <Circle cx={cx} cy={cy} r={118} stroke="rgba(255,59,48,0.055)" strokeWidth="1" fill="none" strokeDasharray="3 7" />
            <Circle cx={cx} cy={cy} r={88} stroke="rgba(255,255,255,0.025)" strokeWidth="1" fill="none" strokeDasharray="2 12" />
            <Path d={`M${cx - 128} ${cy} L${cx - 112} ${cy}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
            <Path d={`M${cx + 112} ${cy} L${cx + 128} ${cy}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
            <Path d={`M${cx} ${cy - 128} L${cx} ${cy - 112}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
            <Path d={`M${cx} ${cy + 112} L${cx} ${cy + 128}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
            {Array.from({ length: 6 }).map((_, row) =>
                Array.from({ length: 6 }).map((_, col) => (
                    <Circle key={`dot-${row}-${col}`} cx={width - 52 + col * 10} cy={96 + row * 10} r="1" fill="rgba(255,255,255,0.10)" />
                ))
            )}
            {Array.from({ length: 4 }).map((_, row) =>
                Array.from({ length: 4 }).map((_, col) => (
                    <Circle key={`dot2-${row}-${col}`} cx={32 + col * 10} cy={height - 80 + row * 10} r="0.8" fill="rgba(255,255,255,0.07)" />
                ))
            )}
            <Path d={`M${cx - 60} ${cy + 140} L${cx + 60} ${cy + 140}`} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <Path d={`M${cx - 60} ${cy + 136} L${cx - 60} ${cy + 144}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <Path d={`M${cx + 60} ${cy + 136} L${cx + 60} ${cy + 144}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <Path d={`M${cx} ${cy + 136} L${cx} ${cy + 144}`} stroke="rgba(255,59,48,0.25)" strokeWidth="1" />
            <Path d={`M8 ${height * 0.28} L8 ${height * 0.58}`} stroke="rgba(255,59,48,0.12)" strokeWidth="1" />
            <Path d={`M${width - 8} ${height * 0.32} L${width - 8} ${height * 0.62}`} stroke="rgba(255,59,48,0.09)" strokeWidth="1" />
        </Svg>
    );
};