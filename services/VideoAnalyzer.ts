import { GoogleGenAI, Schema, Type } from "@google/genai";
import { VideoAnalysisResult } from "../types";

// Helper to convert File to Base64 for the API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader result is "data:mime;base64,encoded_string"
      // We only need the encoded_string part
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// Define the exact schema for the model response
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        total_duration: { type: Type.NUMBER, description: "Total duration of the video in seconds." },
        detected_language: { type: Type.STRING, description: "The primary language spoken in the video." },
      },
      required: ["total_duration", "detected_language"],
    },
    speakers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique identifier like 'spk_1'." },
          name: { type: Type.STRING, description: "Visual description of the speaker (e.g., 'Man in blue shirt')." },
          voice_tone: { type: Type.STRING, description: "Description of voice tone (e.g., 'Calm, deep')." },
        },
        required: ["id", "name", "voice_tone"],
      },
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          speaker_id: { type: Type.STRING, description: "Must match an id from the speakers array." },
          start_time: { type: Type.NUMBER, description: "Start time in seconds." },
          end_time: { type: Type.NUMBER, description: "End time in seconds." },
          text: { type: Type.STRING, description: "The spoken text or subtitle." },
        },
        required: ["id", "speaker_id", "start_time", "end_time", "text"],
      },
    },
  },
  required: ["metadata", "speakers", "segments"],
};

/**
 * Analyzes a video file to extract speakers and transcript segments.
 * 
 * @param file The video file uploaded by the user.
 * @returns A promise resolving to the structured analysis result.
 */
export const analyzeVideo = async (file: File): Promise<VideoAnalysisResult> => {
  // STRICT REQUIREMENT: API Key from process.env
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert file for API consumption
  const videoPart = await fileToGenerativePart(file);

  const systemInstruction = `Analyze the visual and audio track of this video.
1. Identify all distinct speakers based on visual appearance and voice.
2. Break the audio down into granular segments where a single speaker is talking continuously.
3. Transcribe the spoken text exactly.
4. Ensure timestamps are precise to 0.1s.
5. Output PURE JSON only. No markdown formatting.`;

  try {
    // Using gemini-3-pro-preview as the recommended model for complex multimodal tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          videoPart,
          {
            text: `Extract structured dubbing data for this video.`
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for factual transcription
      },
    });

    let responseText = response.text;
    
    if (!responseText) {
      throw new Error("No response received from the model. The request might have been blocked.");
    }

    // Strip Markdown formatting if present (e.g., ```json ... ```)
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(responseText) as VideoAnalysisResult;
    return result;
  } catch (error: any) {
    console.error("Video analysis failed:", error);
    if (error instanceof SyntaxError) {
       throw new Error("Failed to parse the model output. The response was not valid JSON.");
    }
    throw error;
  }
};