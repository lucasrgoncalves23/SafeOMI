import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface TranscriptionDisplayProps {
  transcription: string
  isProcessing: boolean
  safeWord: string
}

export function TranscriptionDisplay({ transcription, isProcessing, safeWord }: TranscriptionDisplayProps) {
  // Function to highlight the safe word in the transcription
  const highlightSafeWord = (text: string, word: string) => {
    if (!word || word.trim() === "") return text

    const regex = new RegExp(`(${word})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, i) => {
      if (part.toLowerCase() === word.toLowerCase()) {
        return (
          <span key={i} className="bg-yellow-300 text-black px-1 rounded font-bold">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">Transcription</h3>
        {isProcessing && (
          <div className="flex items-center text-sm text-teal-600">
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Processing...
          </div>
        )}
      </div>

      <Card className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-white border-teal-200">
        {transcription ? (
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {safeWord ? highlightSafeWord(transcription, safeWord) : transcription}
          </p>
        ) : (
          <p className="text-gray-400 italic">Your transcription will appear here. Start recording to begin.</p>
        )}
      </Card>
    </div>
  )
}
