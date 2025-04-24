import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicionando utilitários para efeitos visuais
export const shadowEffects = {
  neonBlue: "shadow-[0_0_10px_rgba(59,130,246,0.5)]",
  neonPurple: "shadow-[0_0_10px_rgba(147,51,234,0.5)]",
  neonGreen: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  neonCyan: "shadow-[0_0_10px_rgba(6,182,212,0.5)]",
  neonPink: "shadow-[0_0_10px_rgba(236,72,153,0.5)]",
  neonAmber: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  pulseGlow: "animate-pulse filter brightness-110"
}

export const gradients = {
  blueToIndigo: "bg-gradient-to-r from-blue-500 to-indigo-500",
  indigoToPurple: "bg-gradient-to-r from-indigo-500 to-purple-500",
  purpleToFuchsia: "bg-gradient-to-r from-purple-500 to-fuchsia-500",
  cyanToBlue: "bg-gradient-to-r from-cyan-500 to-blue-500",
  tealToEmerald: "bg-gradient-to-r from-teal-400 to-emerald-500",
  amberToOrange: "bg-gradient-to-r from-amber-400 to-orange-500"
}

export const textGradients = {
  blueToIndigo: "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
  indigoToPurple: "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent",
  purpleToFuchsia: "bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent",
  cyanToBlue: "bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent",
  tealToEmerald: "bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent",
}

export const animations = {
  fadeIn: "animate-fade-in",
  slideIn: "animate-slide-in",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  float: "animate-float"
}
