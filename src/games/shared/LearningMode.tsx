import { createContext, useContext, type ReactNode } from "react";
export type LearningMode = "Explorer" | "Science";
const Context = createContext<{
  level: LearningMode;
  setLevel: (level: LearningMode) => void;
}>({ level: "Science", setLevel: () => {} });
export function GameLearning({
  level,
  setLevel,
  children,
}: {
  level: LearningMode;
  setLevel: (level: LearningMode) => void;
  children: ReactNode;
}) {
  return (
    <Context.Provider value={{ level, setLevel }}>{children}</Context.Provider>
  );
}
export const useLearning = () => useContext(Context);
