// src/components/profile/icons/index.jsx
import Svg, { Circle, Path } from "react-native-svg";

export const CheckSvg = ({ c = "#fff", s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={c}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevRight = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevLeft = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusSvg = ({ c = "#fff", s = 18 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={c}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const XSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const TrashSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
      stroke={c}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

export const EditSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={c}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={c}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const InfoSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={c}
      strokeWidth={1.7}
    />
    <Path
      d="M12 8h.01M12 12v4"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ✅ Make sure this is exported
export const CameraSvg = ({ c, s = 20 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      stroke={c}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8} />
  </Svg>
);

export const UploadSvg = ({ c, s = 18 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
