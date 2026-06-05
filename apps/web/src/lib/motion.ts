export const easeOut = [0.22, 1, 0.36, 1] as const;

export const pageTransition = {
  duration: 0.26,
  ease: easeOut,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 32,
};
