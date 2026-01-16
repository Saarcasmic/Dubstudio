
/**
 * Converts an AudioBuffer to a WAV Blob (16-bit PCM).
 */
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result: Float32Array;
  
  // Interleave channels if necessary
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length * 2);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = 44 + result.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write WAV Header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, result.length * bytesPerSample, true);

  // Write PCM samples
  const offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i])); // Clamp
    // Convert float to 16-bit PCM
    view.setInt16(offset + i * bytesPerSample, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
};

/**
 * Decodes a video file, extracts a specific time range, and returns a WAV Blob.
 * 
 * @param videoFile The source video file
 * @param startTime Start time in seconds
 * @param endTime End time in seconds
 * @returns Promise resolving to a WAV Blob
 */
export const extractAudioClip = async (
  videoFile: File,
  startTime: number,
  endTime: number
): Promise<Blob> => {
  try {
    const arrayBuffer = await videoFile.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode the entire audio track (This can be memory intensive for huge files, ok for demo <50MB)
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Calculate sample indices
    const startSample = Math.floor(startTime * audioBuffer.sampleRate);
    const endSample = Math.floor(endTime * audioBuffer.sampleRate);
    const frameCount = endSample - startSample;

    if (frameCount <= 0) {
      throw new Error("Invalid time range for audio extraction");
    }

    // Create a new buffer for the segment
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      frameCount,
      audioBuffer.sampleRate
    );

    // Copy data channel by channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const segmentData = segmentBuffer.getChannelData(channel);
      
      // Safer copy logic
      for (let i = 0; i < frameCount; i++) {
        if (startSample + i < channelData.length) {
          segmentData[i] = channelData[startSample + i];
        } else {
          segmentData[i] = 0; // Pad with silence if out of bounds
        }
      }
    }

    // Encode to WAV
    const wavBlob = audioBufferToWav(segmentBuffer);
    
    // Cleanup
    audioContext.close();
    
    return wavBlob;
  } catch (error) {
    console.error("Failed to extract audio clip:", error);
    throw new Error("Audio extraction failed. ensure the file is a valid video/audio file.");
  }
};
