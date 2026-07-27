import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function fmt$  (val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export function fmtPct(val, decimals = 1) {
  return `${val.toFixed(decimals)}%`;
}

export function fmtNum(val) {
  return new Intl.NumberFormat("en-US").format(val);
}

export function variance(actual, budget) {
  return ((actual - budget) / budget) * 100;
}
