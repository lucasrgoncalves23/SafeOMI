"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, AlertCircle } from "lucide-react"
import { SafeWordAlert } from "@/components/safe-word-alert"
import { TranscriptionDisplay } from "@/components/transcription-display"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState<string>("")
  const [safeWord, setSafeWord] = useState<string>("")
  const [showAlert, setShowAlert] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  // Add this function at the beginning of your component
  const getSupportedMimeType = () => {
    const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return "audio/webm" // Default fallback
  }

  // Function to start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Get supported MIME type
      const mimeType = getSupportedMimeType()
      console.log("Using MIME type:", mimeType)

      // Specify the correct MIME type for the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          // Process the audio chunk
          processAudioChunk()
        }
      }

      mediaRecorder.onstop = () => {
        // Final processing when recording stops
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        processAudioFinal(audioBlob)
      }

      // Start recording and collect data every 3 seconds
      mediaRecorder.start(3000)
      setIsRecording(true)
      setTranscription("")

      toast({
        title: "Recording started",
        description: "Your audio is now being recorded and transcribed in real-time.",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access your microphone. Please check permissions.",
      })
    }
  }

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)

      toast({
        title: "Recording stopped",
        description: "Your recording has been stopped.",
      })
    }
  }

  // Process audio chunk for streaming transcription
  const processAudioChunk = async () => {
    if (audioChunksRef.current.length === 0) return

    setIsProcessing(true)

    try {
      // Create a proper audio blob with the correct MIME type
      const mimeType = mediaRecorderRef.current?.mimeType || getSupportedMimeType()
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("safeWord", safeWord)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Transcription failed")
      }

      // Update transcription
      setTranscription((prev) => {
        const newTranscription = prev + " " + data.transcription

        // Check for safe word
        if (safeWord && safeWord.trim() !== "" && newTranscription.toLowerCase().includes(safeWord.toLowerCase())) {
          setShowAlert(true)
        }

        return newTranscription
      })
    } catch (error) {
      console.error("Error processing audio chunk:", error)
      toast({
        variant: "destructive",
        title: "Transcription error",
        description: error instanceof Error ? error.message : "There was an error processing your audio.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Process final audio when recording stops
  const processAudioFinal = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("safeWord", safeWord)
      formData.append("isFinal", "true")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Final transcription failed")
      }

      // Update with final transcription
      setTranscription(data.transcription)

      // Final check for safe word
      if (safeWord && safeWord.trim() !== "" && data.transcription.toLowerCase().includes(safeWord.toLowerCase())) {
        setShowAlert(true)
      }
    } catch (error) {
      console.error("Error processing final audio:", error)
      toast({
        variant: "destructive",
        title: "Final transcription error",
        description: error instanceof Error ? error.message : "There was an error processing your complete recording.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isRecording])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-teal-50 to-teal-100">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg border-teal-200">
          <CardHeader className="bg-teal-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center">
              <AlertCircle className="mr-2" /> OmiSafe
            </CardTitle>
            <CardDescription className="text-teal-100">
              Real-time audio transcription with safe word detection
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-2">
            <div className="mb-6">
              <label htmlFor="safeWord" className="block text-sm font-medium text-gray-700 mb-1">
                Your Safe Word
              </label>
              <Input
                id="safeWord"
                type="text"
                placeholder="Enter your safe word"
                value={safeWord}
                onChange={(e) => setSafeWord(e.target.value)}
                className="border-teal-300 focus:ring-teal-500 focus:border-teal-500"
                disabled={isRecording}
              />
              <p className="mt-1 text-sm text-gray-500">
                We'll alert you when this word is detected in your transcription.
              </p>
            </div>

            <TranscriptionDisplay transcription={transcription} isProcessing={isProcessing} safeWord={safeWord} />
          </CardContent>

          <CardFooter className="flex justify-between pt-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}
              disabled={safeWord.trim() === ""}
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" /> Start Recording
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setTranscription("")
                toast({
                  title: "Transcription cleared",
                  description: "Your transcription has been cleared.",
                })
              }}
              disabled={isRecording || !transcription}
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              Clear Transcription
            </Button>
          </CardFooter>
        </Card>
      </div>

      {showAlert && <SafeWordAlert safeWord={safeWord} onClose={() => setShowAlert(false)} />}
    </main>
  )
}
