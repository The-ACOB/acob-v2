const LATEX_OR_NUMBER =
  /(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$\\n]+\\$|\\\\\\([\\s\\S]*?\\\\\\)|\\\\\\[[\\s\\S]*?\\\\\\]|\\\\[a-zA-Z]+(?:\\{[^{}]*\\})?|\\b\\d+(?:[.,]\\d+)*\\b)/g;

async function translateChunk(text: string): Promise<string> {
  if (!text.trim()) return text;

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=" +
    encodeURIComponent(text);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Translation service unavailable.");
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Invalid translation response.");
  }

  return data[0]
    .filter((part: unknown) => Array.isArray(part) && typeof part[0] === "string")
    .map((part: [string, string]) => part[0])
    .join("");
}

export async function translateEnglishToBangla(text: string): Promise<string> {
  if (!text.trim()) return "";

  const parts = text.split(LATEX_OR_NUMBER);

  const translated: string[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (LATEX_OR_NUMBER.test(part)) {
      translated.push(part);
    } else {
      translated.push(await translateChunk(part));
    }

    LATEX_OR_NUMBER.lastIndex = 0;
  }

  return translated.join("");
}
