import { NextResponse } from "next/server"

export async function GET() {
  // This is a simple beep sound generated programmatically
  // In a real app, you might want to use a real audio file

  // Create a simple WAV file with a beep sound
  const sampleRate = 44100
  const duration = 1 // seconds
  const frequency = 880 // Hz (A5)

  const numSamples = sampleRate * duration
  const buffer = Buffer.alloc(44 + numSamples * 2) // 44 bytes for WAV header + 2 bytes per sample

  // Write WAV header
  buffer.write("RIFF", 0)
  buffer.writeUInt32LE(36 + numSamples * 2, 4) // File size - 8
  buffer.write("WAVE", 8)
  buffer.write("fmt ", 12)
  buffer.writeUInt32LE(16, 16) // Format chunk size
  buffer.writeUInt16LE(1, 20) // Audio format (PCM)
  buffer.writeUInt16LE(1, 22) // Number of channels
  buffer.writeUInt32LE(sampleRate, 24) // Sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28) // Byte rate
  buffer.writeUInt16LE(2, 32) // Block align
  buffer.writeUInt16LE(16, 34) // Bits per sample
  buffer.write("data", 36)
  buffer.writeUInt32LE(numSamples * 2, 40) // Data chunk size

  // Generate a beep sound
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const amplitude = 32760 * Math.sin(2 * Math.PI * frequency * t)

    // Apply envelope to avoid clicks
    let envelope = 1
    if (t < 0.1) envelope = t / 0.1 // Attack
    if (t > duration - 0.1) envelope = (duration - t) / 0.1 // Release

    const sample = Math.floor(amplitude * envelope)
    buffer.writeInt16LE(sample, 44 + i * 2)
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": buffer.length.toString(),
    },
  })
}
