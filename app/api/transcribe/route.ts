import { type NextRequest, NextResponse } from "next/server"
import { experimental_transcribe as transcribe } from "ai"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30 // Set max duration to 30 seconds for the API route

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const safeWord = formData.get("safeWord") as string
    const isFinal = formData.get("isFinal") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert the file to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    console.log("Transcribing audio of size:", audioBuffer.length, "bytes")

    // Use the AI SDK to transcribe the audio
    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: audioBuffer,
      // Optional: Specify language for better accuracy
      providerOptions: {
        openai: {
          language: "en", // Specify language if known
        },
      },
      maxRetries: 3, // Add retries for better reliability
    })

    console.log("Transcription successful:", result.text.substring(0, 50) + "...")

    // Check if the safe word is in the transcription
    const safeWordDetected = safeWord && result.text.toLowerCase().includes(safeWord.toLowerCase())

    return NextResponse.json({
      transcription: result.text,
      safeWordDetected,
      isFinal: isFinal === "true",
    })
  } catch (error) {
    console.error("Transcription error:", error)
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
