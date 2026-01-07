import { useState, useEffect, useRef } from 'react'
import './RecordingSession.css'

function RecordingSession({ clientName, sessionNumber, onCancel, onComplete }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const analyserRef = useRef(null)
  const audioContextRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    startRecording()
    return () => {
      cleanup()
    }
  }, [])

  // Manage timer based on recording state
  useEffect(() => {
    // Clear any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Only run timer if recording and not paused
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start visualization
      visualize()

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Timer will be managed by useEffect based on isRecording and isPaused states
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please grant permission.')
      onCancel()
    }
  }

  const visualize = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const update = () => {
      if (!analyserRef.current) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      setAudioLevel(average / 255)

      requestAnimationFrame(update)
    }

    update()
  }

  const handlePause = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
      } else {
        mediaRecorderRef.current.pause()
      }
      setIsPaused(!isPaused)
    }
  }

  const handleStop = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        cleanup()
        onComplete(audioBlob, duration)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate waveform bars based on audio level
  const generateWaveform = () => {
    const bars = []
    for (let i = 0; i < 20; i++) {
      const height = Math.random() * 40 + 10
      const opacity = 0.3 + (audioLevel * 0.7)
      bars.push(
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${height}px`,
            opacity: opacity
          }}
        />
      )
    }
    return bars
  }

  return (
    <div className="recording-session">
      <div className="recording-header">
        <h1>Session in Progress</h1>
        <p className="client-name">{clientName}</p>
        <p className="session-number">Session # {sessionNumber}</p>
      </div>

      <div className="recording-container">
        <div className="recording-content">
          <div className="timer">{formatTime(duration)}</div>
          
          <div className="waveform">
            {generateWaveform()}
          </div>

          <div className="recording-controls">
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            
            <button 
              className={`pause-btn ${isPaused ? 'paused' : ''}`}
              onClick={handlePause}
            >
              {isPaused ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4L18 12L6 20V4Z" fill="#134E4A" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" fill="#134E4A" />
                  <rect x="14" y="4" width="4" height="16" fill="#134E4A" />
                </svg>
              )}
            </button>

            <button className="stop-btn" onClick={handleStop}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="6" width="12" height="12" fill="#FFFFFF" />
              </svg>
            </button>
          </div>

          <div className="recording-status">
            <span className={`recording-dot ${isPaused ? 'paused' : ''}`}></span>
            {isPaused ? 'Recording paused' : 'Recording in progress...'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecordingSession
