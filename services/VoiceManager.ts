
/**
 * VoiceManager.ts
 * Handles interactions with MiniMax API for Voice Cloning and Text-to-Speech.
 */

class VoiceManagerService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.minimax.chat/v1';
  // In-memory map: SpeakerID -> MiniMax VoiceID
  private voiceMap: Map<string, string> = new Map();

  constructor() {
    // Ideally use a specific key for MiniMax, falling back to the main key or undefined
    this.apiKey = process.env.MINIMAX_API_KEY; 
  }

  /**
   * Returns true if we are running in mock mode (no API key).
   */
  public isMockMode(): boolean {
    return !this.apiKey || this.apiKey === 'mock-key';
  }

  /**
   * Registers a voice by uploading a reference audio clip.
   * 
   * @param speakerId The internal ID (e.g., 'spk_1')
   * @param referenceAudio The WAV blob extracted from the video
   * @returns The generated Voice ID
   */
  public async registerVoice(speakerId: string, referenceAudio: Blob): Promise<string> {
    // 1. Check Mock Mode
    if (this.isMockMode()) {
      console.log(`[Mock VoiceManager] Cloning voice for ${speakerId}...`);
      await new Promise(r => setTimeout(r, 1500)); // Simulate latency
      const mockVoiceId = `mock_voice_${speakerId}_${Date.now()}`;
      this.voiceMap.set(speakerId, mockVoiceId);
      return mockVoiceId;
    }

    // 2. Real API Call (MiniMax Voice Cloning / File Upload)
    try {
      const formData = new FormData();
      formData.append('file', referenceAudio, `reference_${speakerId}.wav`);
      formData.append('purpose', 'voice_cloning');

      // Note: Endpoint depends on specific MiniMax product (Files Upload vs dedicated cloning)
      // This uses a generic file upload pattern common in these APIs
      const response = await fetch(`${this.baseUrl}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`MiniMax Upload Failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Assuming response contains { file_id: "..." } which acts as voice_id for dynamic T2A
      const voiceId = data.file_id || data.voice_id; 
      
      if (!voiceId) throw new Error("No voice ID returned from API");

      this.voiceMap.set(speakerId, voiceId);
      return voiceId;
    } catch (error) {
      console.error("Voice Registration Error:", error);
      throw error;
    }
  }

  /**
   * Generates speech for a specific text using the cloned voice.
   * 
   * @param text The text to speak
   * @param speakerId The internal speaker ID to look up the voice for
   */
  public async generateSpeech(text: string, speakerId: string): Promise<string> {
    const voiceId = this.voiceMap.get(speakerId);
    
    if (!voiceId) {
      throw new Error(`No voice registered for speaker ${speakerId}`);
    }

    // 1. Mock Mode
    if (this.isMockMode() || voiceId.startsWith('mock_')) {
      console.log(`[Mock VoiceManager] Synthesizing "${text}" with ${voiceId}`);
      await new Promise(r => setTimeout(r, 1000));
      // Return a dummy beep or silent blob for demo purposes if real generation isn't possible
      return "mock_audio_url"; 
    }

    // 2. Real API Call (T2A)
    try {
      const payload = {
        model: "speech-01",
        text: text,
        voice_setting: {
            voice_id: voiceId,
            speed: 1.0,
            vol: 1.0
        }
      };

      const response = await fetch(`${this.baseUrl}/t2a_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`TTS Generation Failed: ${response.statusText}`);
      }

      // MiniMax returns audio stream usually.
      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);

    } catch (error) {
      console.error("TTS Generation Error:", error);
      throw error;
    }
  }

  /**
   * Get the registered voice ID for a speaker
   */
  public getVoiceId(speakerId: string): string | undefined {
    return this.voiceMap.get(speakerId);
  }
}

export const VoiceManager = new VoiceManagerService();
