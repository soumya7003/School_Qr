// src/features/profile/hooks/useProfileSteps.js
import { useRef, useState } from "react";
import { Animated, Keyboard } from "react-native";

export function useProfileSteps(initialStep = 0) {
  const [step, setStep] = useState(initialStep);
  const [completed, setCompleted] = useState([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transitionStep = (newStep) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
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
    fadeAnim,
    slideAnim,
    transitionStep,
    goNext,
    goBack,
    markAllCompleted,
  };
}
