"use client";

import { motion, useReducedMotion } from "motion/react";

type MotionEventCardProperties = Readonly<{
  children: React.ReactNode;
  delay: number;
}>;

type RevealProperties = Readonly<{
  children: React.ReactNode;
  className: string;
  delay: number;
}>;

export function Reveal({ children, className, delay }: RevealProperties): React.ReactNode {
  const reducedMotion = useReducedMotion() === true;

  return <motion.div animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} className={className} initial={reducedMotion ? false : { opacity: 0, y: 24 }} transition={{ delay, duration: 0.45, ease: "easeOut" }}>{children}</motion.div>;
}

export function MotionEventCard({ children, delay }: MotionEventCardProperties): React.ReactNode {
  const reducedMotion = useReducedMotion() === true;

  return <motion.div className="motion-event-card" initial={reducedMotion ? false : { opacity: 0, y: 28 }} layout transition={{ delay, duration: 0.4, ease: "easeOut" }} viewport={{ amount: 0.18, once: true }} whileHover={reducedMotion ? undefined : { rotateX: 1.2, scale: 1.012, y: -5 }} whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }} whileTap={reducedMotion ? undefined : { scale: 0.985 }}>{children}</motion.div>;
}
