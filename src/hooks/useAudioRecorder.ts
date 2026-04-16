import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder(onChunkReady: (blob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onChunkReady(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if ((mediaRecorder as any).shouldRestart) {
          try {
            mediaRecorder.start();
          } catch(e) {
             console.error("Failed to restart recorder inline.", e);
          }
          (mediaRecorder as any).shouldRestart = false;
        } else {
          // Final stopping clears the webcam/mic light
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, [onChunkReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      (mediaRecorderRef.current as any).shouldRestart = false;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const requestData = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      (mediaRecorderRef.current as any).shouldRestart = true;
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    toggleRecording,
    requestData
  };
}
