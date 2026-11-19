"use client";

/**
 * Speak German text with the browser's speech synthesis (de-DE voice).
 * Returns false when the browser has no speech support.
 */
export function speakGerman(text: string, rate = 0.9): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("de"));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
