// src/features/profile/hooks/useProfileSteps.js - SIMPLIFIED
import { useState } from "react";
import { Keyboard } from "react-native";

export function useProfileSteps(initialStep = 0) {
  const [step, setStep] = useState(initialStep);
  const [completed, setCompleted] = useState([]);

  const transitionStep = (newStep) => {
    Keyboard.dismiss();
    setStep(newStep);
  };

  const goNext = (validationFn) => {
    if (validationFn && !validationFn()) return false;
    if (step < 3) {
      setCompleted((p) => (p.includes(step) ? p : [...p, step]));
      transitionStep(step + 1);
      return true;
    }
    return false;
  };

  const goBack = () => {
    if (step > 0) transitionStep(step - 1);
  };

  const markAllCompleted = () => setCompleted([0, 1, 2, 3]);

  return {
    step,
    setStep,
    completed,
    setCompleted,
    transitionStep,
    goNext,
    goBack,
    markAllCompleted,
  };
}
