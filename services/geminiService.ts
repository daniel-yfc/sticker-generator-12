import { GoogleGenAI } from "@google/genai";
import { StyleOption, VariationOptions, VariationStrength } from "../types";

const processEnvApiKey = process.env.API_KEY;

const MAX_BASE64_BYTES = 10 * 1024 * 1024;
const MIN_BASE64_BYTES = 200;
const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
const VARIATION_REQUEST_TIMEOUT_MS = 65000;
const MAX_RETRIES = 1;
const RETRY_BACKOFF_MS = 1500;

export class GenerationCancelledError extends Error {
  constructor() {
    super("error_cancelled");
    this.name = "GenerationCancelledError";
  }
}

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number; message?: string };
  if (e.name === "AbortError" || e.name === "GenerationCancelledError") return true;
  if (e.code === 20) return true;
  if (typeof e.message === "string" && /aborted|cancelled|canceled/i.test(e.message)) {
    return true;
  }
  return false;
};

const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  signal?: AbortSignal
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error("error_timeout")),
      ms
    );
  });
  const abortPromise = signal
    ? new Promise<T>((_, reject) => {
        if (signal.aborted) {
          reject(new GenerationCancelledError());
          return;
        }
        signal.addEventListener(
          "abort",
          () => reject(new GenerationCancelledError()),
          { once: true }
        );
      })
    : undefined;
  return Promise.race([promise, timeoutPromise, ...(abortPromise ? [abortPromise] : [])])
    .finally(() => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }) as Promise<T>;
};

const assertValidBase64Image = (imageBase64: string): string => {
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    throw new Error("error_process");
  }
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(imageBase64)) {
    throw new Error("error_process");
  }
  const payload = imageBase64.split(",")[1] ?? "";
  if (payload.length === 0) {
    throw new Error("error_process");
  }
  const approxBytes = Math.floor((payload.length * 3) / 4);
  if (approxBytes < MIN_BASE64_BYTES) {
    throw new Error("error_process");
  }
  if (approxBytes > MAX_BASE64_BYTES) {
    throw new Error("validation_file_size");
  }
  return payload;
};

const classifyError = (err: unknown): "retryable" | "safety" | "invalid" | "unknown" => {
  if (isAbortError(err)) return "invalid";
  const msg = (err as { message?: string })?.message ?? "";
  if (msg === "error_safety" || msg === "error_no_image") return "safety";
  if (
    msg === "error_timeout" ||
    /network|fetch|5\d\d|overloaded|unavailable/i.test(msg)
  ) {
    return "retryable";
  }
  return "unknown";
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GenerationCancelledError());
      return;
    }
    const handle = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(handle);
        reject(new GenerationCancelledError());
      },
      { once: true }
    );
  });

const logSafe = (code: string): void => {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(`[geminiService] ${code}`);
  }
};

const buildClient = () => {
  if (!processEnvApiKey) {
    throw new Error("error_process");
  }
  return new GoogleGenAI({ apiKey: processEnvApiKey });
};

const extractImageDataUrl = (response: any): string => {
  if (!response?.candidates || response.candidates.length === 0) {
    throw new Error("error_safety");
  }
  const candidate = response.candidates[0];
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    if (candidate.finishReason === "SAFETY") {
      throw new Error("error_safety");
    }
    throw new Error("error_process");
  }
  const parts = candidate.content?.parts;
  if (!parts) {
    throw new Error("error_no_image");
  }
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("error_no_image");
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (isAbortError(err)) throw err;
      const kind = classifyError(err);
      if (kind !== "retryable" || attempt >= MAX_RETRIES) {
        throw err;
      }
      attempt += 1;
      await sleep(RETRY_BACKOFF_MS, signal);
    }
  }
};

export const generateSticker = async (
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string,
  signal?: AbortSignal
): Promise<string> => {
  const base64Data = assertValidBase64Image(imageBase64);

  const basePrompt = `Generate a high-quality die-cut sticker of the person in the provided image.

    ART STYLE: ${style.prompt}.

    CRITICAL INSTRUCTIONS:
    1. TRANSFORM the subject into a stylistic illustration matching the Art Style.
    2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.
    3. SIMPLIFY details to match the sticker aesthetic.
    4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).
    5. Use a solid white background.
    `;

  const extraInstruction = variationPrompt
    ? `\nExpression/Action Variation: ${variationPrompt}. Ensure the style remains consistent.`
    : `\nExpression: Expressive and charismatic.`;

  const finalPrompt = basePrompt + extraInstruction;

  try {
    return await withRetry(async () => {
      const ai = buildClient();
      const response: any = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              { text: finalPrompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        }),
        DEFAULT_REQUEST_TIMEOUT_MS,
        signal
      );
      return extractImageDataUrl(response);
    }, signal);
  } catch (error: any) {
    if (isAbortError(error)) {
      throw new GenerationCancelledError();
    }
    logSafe(error?.message ?? "error_process");
    throw new Error(error?.message ?? "error_process");
  }
};

export const generateStickerVariation = async (
  previousStickerBase64: string,
  style: StyleOption,
  options: VariationOptions,
  signal?: AbortSignal
): Promise<string> => {
  const prevStickerData = assertValidBase64Image(previousStickerBase64);

  const getStrengthGuidance = (strength: VariationStrength) => {
    switch (strength) {
      case "low":
        return `VARIATION STRENGTH: SUBTLE (LOW)
- Maintain the exact same head orientation, posture, and composition as the reference sticker.
- Make only subtle, nuanced facial expression shifts (such as a gentle smile, playful wink, slight head tilt, or raised eyebrow).
- Keep character clothing, styling, and geometry almost identical to the reference sticker.`;
      case "high":
        return `VARIATION STRENGTH: CREATIVE (HIGH)
- Maintain the exact same character identity (recognizable facial features, eye shape, hair color/style) and the exact same art style.
- Make dynamic and expressive changes to the pose, action, and emotion (e.g. dramatic celebratory pose, giving double thumbs-up, wearing cool sunglasses, expressive open-mouthed joy, dynamic hand signs).
- Produce a bold, playful companion sticker that clearly belongs in the exact same sticker collection.`;
      case "medium":
      default:
        return `VARIATION STRENGTH: MODERATE (MEDIUM)
- Maintain the exact same character identity and the exact same art style.
- Introduce a clear and distinct new pose and gesture (e.g. big laugh, thumbs up, peace sign, waving hand, or hand resting on chin).
- Balance fresh expression and pose with high recognizable consistency to the original sticker.`;
    }
  };

  const prompt = `You are a master sticker artist and character designer.
TASK: Generate a NEW STICKER VARIATION based on the provided reference sticker of this character.

CRITICAL INSTRUCTIONS:
1. SAME CHARACTER: The person in the new sticker MUST BE THE EXACT SAME PERSON shown in the reference image (same facial structure, hair style, hair color, eye shape, age, and recognizable features).
2. SAME ART STYLE: Strictly maintain the EXACT SAME art style (${style.prompt}). The outline stroke thickness, color palette, shading type, and rendering medium MUST match the reference sticker.
3. VARIATION SPECIFICATIONS:
${getStrengthGuidance(options.strength)}
${options.customPrompt ? `\nUser's Custom Action/Emotion Goal: "${options.customPrompt}". Incorporate this action/expression naturally while following the character and style rules.` : ""}
4. STICKER REQUIREMENTS:
- Add a crisp, clean, thick WHITE DIE-CUT BORDER around the subject.
- Solid clean white background.
- 1:1 aspect ratio.
- Stylized sticker artwork (must not be a realistic photo).`;

  const parts: any[] = [{ text: prompt }];
  parts.push({
    inlineData: {
      mimeType: "image/png",
      data: prevStickerData,
    },
  });

  if (options.sourceImageBase64) {
    const sourceData = assertValidBase64Image(options.sourceImageBase64);
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: sourceData,
      },
    });
  }

  try {
    return await withRetry(async () => {
      const ai = buildClient();
      const response: any = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        }),
        VARIATION_REQUEST_TIMEOUT_MS,
        signal
      );
      return extractImageDataUrl(response);
    }, signal);
  } catch (error: any) {
    if (isAbortError(error)) {
      throw new GenerationCancelledError();
    }
    logSafe(error?.message ?? "error_process");
    throw new Error(error?.message ?? "error_process");
  }
};

export const generateStickerSet = async (
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[],
  signal?: AbortSignal
): Promise<string[]> => {
  const promises = variations.map((v) =>
    generateSticker(sourceImageBase64, style, v, signal)
  );
  return Promise.all(promises);
};
