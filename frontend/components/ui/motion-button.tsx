"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buttonHover, transition } from "@/components/ui/calendar/animations";

export const MotionButton = motion.create(Button);

export const motionButtonInteraction = {
  variants: buttonHover,
  whileHover: "hover",
  whileTap: "tap",
  transition,
} as const satisfies Pick<HTMLMotionProps<"button">, "variants" | "whileHover" | "whileTap" | "transition">;

export type MotionButtonProps = ButtonProps & HTMLMotionProps<"button">;
