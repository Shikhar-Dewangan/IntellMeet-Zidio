const LANGUAGE_LABELS = {
  en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean",
  zh: "Chinese", ar: "Arabic", bn: "Bengali", ta: "Tamil", te: "Telugu",
  mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi",
  ur: "Urdu", tr: "Turkish", nl: "Dutch", pl: "Polish", sv: "Swedish",
};

export function getLanguageLabel(code) {
  if (!code) return null;
  const key = String(code).toLowerCase().trim().slice(0, 2);
  return LANGUAGE_LABELS[key] || String(code).toUpperCase();
}

export function getLanguageShort(code) {
  if (!code) return null;
  return String(code).toUpperCase().slice(0, 2);
}

export function formatRelativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 3) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}