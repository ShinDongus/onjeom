import React, { createContext, useContext } from "react";
export const MotionContext = createContext(false);
export const useReducedMotion = () => useContext(MotionContext);
