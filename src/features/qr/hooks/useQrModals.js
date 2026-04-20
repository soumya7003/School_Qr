// src/features/qr/hooks/useQrModals.js
import { useState } from "react";

export function useQrModals() {
  const [showBlock, setShowBlock] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [showActivate, setShowActivate] = useState(false);

  return {
    showBlock,
    setShowBlock,
    showUnblock,
    setShowUnblock,
    showRevoke,
    setShowRevoke,
    showActivate,
    setShowActivate,
  };
}
