"use client";

import Lottie from "lottie-react";
import { pulseRingAnimation } from "./lottie-data";

export default function LottiePulse() {
  return (
    <Lottie
      animationData={pulseRingAnimation}
      loop
      autoplay
      style={{ width: 16, height: 16 }}
    />
  );
}
