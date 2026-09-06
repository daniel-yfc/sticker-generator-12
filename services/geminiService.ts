
import { GoogleGenAI } from "@google/genai";
import { StyleOption, VariationOptions, VariationStrength } from "../types";

const processEnvApiKey = process.env.API_KEY;

/**
 * Helper to race a promise against a timeout
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
};

export const generateSticker = async (
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string
): Promise<string> => {
  if (!processEnvApiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  try {
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    
    // Improved Prompt Engineering v2
    // Focus on "Transformation" and "Artistic Medium" to avoid photorealism.
    // Explicitly requesting "Illustration" and "Die-cut sticker".
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

    const response: any = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: finalPrompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      }),
      60000,
      "error_timeout"
    );

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("error_safety");
    }

    const candidate = response.candidates[0];
    
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("error_safety");
      }
      throw new Error(`error_process`);
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

  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const msg = error.message || "error_process";
    throw new Error(msg);
  }
};

/**
 * Generates a sticker variation based on the previous sticker image,
 * preserving the exact same art style and character identity while varying
 * expressions, actions, and details based on the selected variation strength.
 */
export const generateStickerVariation = async (
  previousStickerBase64: string,
  style: StyleOption,
  options: VariationOptions
): Promise<string> => {
  if (!processEnvApiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  const getStrengthGuidance = (strength: VariationStrength) => {
    switch (strength) {
      case 'low':
        return `VARIATION STRENGTH: SUBTLE (LOW)
- Maintain the exact same head orientation, posture, and composition as the reference sticker.
- Make only subtle, nuanced facial expression shifts (such as a gentle smile, playful wink, slight head tilt, or raised eyebrow).
- Keep character clothing, styling, and geometry almost identical to the reference sticker.`;
      case 'high':
        return `VARIATION STRENGTH: CREATIVE (HIGH)
- Maintain the exact same character identity (recognizable facial features, eye shape, hair color/style) and the exact same art style.
- Make dynamic and expressive changes to the pose, action, and emotion (e.g. dramatic celebratory pose, giving double thumbs-up, wearing cool sunglasses, expressive open-mouthed joy, dynamic hand signs).
- Produce a bold, playful companion sticker that clearly belongs in the exact same sticker collection.`;
      case 'medium':
      default:
        return `VARIATION STRENGTH: MODERATE (MEDIUM)
- Maintain the exact same character identity and the exact same art style.
- Introduce a clear and distinct new pose and gesture (e.g. big laugh, thumbs up, peace sign, waving hand, or hand resting on chin).
- Balance fresh expression and pose with high recognizable consistency to the original sticker.`;
    }
  };

  try {
    const prevStickerData = previousStickerBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    
    const prompt = `You are a master sticker artist and character designer.
TASK: Generate a NEW STICKER VARIATION based on the provided reference sticker of this character.

CRITICAL INSTRUCTIONS:
1. SAME CHARACTER: The person in the new sticker MUST BE THE EXACT SAME PERSON shown in the reference image (same facial structure, hair style, hair color, eye shape, age, and recognizable features).
2. SAME ART STYLE: Strictly maintain the EXACT SAME art style (${style.prompt}). The outline stroke thickness, color palette, shading type, and rendering medium MUST match the reference sticker.
3. VARIATION SPECIFICATIONS:
${getStrengthGuidance(options.strength)}
${options.customPrompt ? `\nUser's Custom Action/Emotion Goal: "${options.customPrompt}". Incorporate this action/expression naturally while following the character and style rules.` : ''}
4. STICKER REQUIREMENTS:
- Add a crisp, clean, thick WHITE DIE-CUT BORDER around the subject.
- Solid clean white background.
- 1:1 aspect ratio.
- Stylized sticker artwork (must not be a realistic photo).`;

    const parts: any[] = [{ text: prompt }];

    // Primary reference: previous sticker
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: prevStickerData
      }
    });

    // Optional secondary reference: original portrait photo for face identity
    if (options.sourceImageBase64) {
      const sourceData = options.sourceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: sourceData
        }
      });
    }

    const response: any = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      }),
      65000,
      "error_timeout"
    );

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("error_safety");
    }

    const candidate = response.candidates[0];
    
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("error_safety");
      }
      throw new Error("error_process");
    }

    const respParts = candidate.content?.parts;
    if (!respParts) {
      throw new Error("error_no_image");
    }

    for (const part of respParts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("error_no_image");

  } catch (error: any) {
    console.error("Gemini Variation API Error details:", error);
    const msg = error.message || "error_process";
    throw new Error(msg);
  }
};

/**
 * Generates a batch of variations based on a source image and style
 */
export const generateStickerSet = async (
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[]
): Promise<string[]> => {
  // Call generation in parallel for faster results
  const promises = variations.map(v => generateSticker(sourceImageBase64, style, v));
  return Promise.all(promises);
};
