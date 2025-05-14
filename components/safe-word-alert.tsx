"use client"

import { useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface SafeWordAlertProps {
  safeWord: string
  onClose: () => void
}

export function SafeWordAlert({ safeWord, onClose }: SafeWordAlertProps) {
  // Play alert sound when modal appears
  useEffect(() => {
    const audio = new Audio("/api/alert-sound")
    audio.play().catch((err) => console.error("Failed to play alert sound:", err))

    // Vibrate device if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }, [])

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="border-red-500 border-2">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center text-xl">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Safe Word Detected!
          </AlertDialogTitle>
          {/* The issue is here - AlertDialogDescription renders as a <p> and we're nesting <p> tags inside it */}
          <AlertDialogDescription>
            <div className="mb-2">
              The safe word <span className="font-bold text-red-600">"{safeWord}"</span> has been detected in your
              transcription.
            </div>
            <div>This alert has been triggered based on your predefined safety settings.</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">Acknowledge</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
