import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config'
import './SessionDetail.css'
import Toast from '../components/Toast'

function SessionDetail({ sessionId, onBack, isNewSession = false }) {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('recording')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [notes, setNotes] = useState('')
  const [issues, setIssues] = useState([])
  const [newIssue, setNewIssue] = useState('')
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [showToast, setShowToast] = useState(isNewSession)
  const [isSaving, setIsSaving] = useState(false)
  const audioRef = useRef(null)
  const notesRef = useRef(null)

  useEffect(() => {
    fetchSessionDetails()
    fetchTranscript()
    fetchNotes()
    fetchIssues()
  }, [sessionId])

  // Update notes editor only when first loaded from server (not on every keystroke)
  useEffect(() => {
    if (activeTab === 'notes' && notesRef.current && notes && !notesRef.current.innerHTML) {
      notesRef.current.innerHTML = notes
    }
  }, [activeTab, notes])

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setSession(data)
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const fetchTranscript = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching transcript for session:', sessionId)
      
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Full transcript data:', data)
        console.log('Session ID in transcript:', data.session_id)
        console.log('Expected session ID:', sessionId)
        
        // Check multiple possible field names for transcript content
        let transcriptText = data.transcript_text || data.file_content || data.content || ''
        
        console.log('Raw transcript text:', transcriptText.substring(0, 200))
        
        // Remove metadata header if present
        if (transcriptText.includes('=== TRANSCRIPT ===')) {
          const parts = transcriptText.split('=== TRANSCRIPT ===')
          transcriptText = parts[1] ? parts[1].trim() : transcriptText
        }
        
        console.log('Cleaned transcript text:', transcriptText.substring(0, 200))
        setTranscript(transcriptText)
      } else {
        console.error('Failed to fetch transcript:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
    }
  }

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const noteContent = data[0].content || ''
          setNotes(noteContent)
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/issues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIssues(data || [])
      }
    } catch (error) {
      console.error('Error fetching key issues:', error)
    }
  }

  const handleExportTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${sessionId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFormatText = (format) => {
    if (notesRef.current) {
      notesRef.current.focus()
      document.execCommand(format, false, null)
    }
  }

  const handleNotesChange = () => {
    if (notesRef.current) {
      setNotes(notesRef.current.innerHTML)
    }
  }

  const handleAddIssue = async () => {
    if (!newIssue.trim()) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          issue_text: newIssue.trim()
        })
      })

      if (response.ok) {
        setNewIssue('')
        await fetchIssues()
      }
    } catch (error) {
      console.error('Error adding issue:', error)
    }
  }

  const handleDeleteIssue = async (issueId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchIssues()
      }
    } catch (error) {
      console.error('Error deleting issue:', error)
    }
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    }
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
  }

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      const token = localStorage.getItem('token')
      
      // Save transcript changes
      await fetch(`${API_BASE_URL}/sessions/${sessionId}/transcript`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: transcript
        })
      })

      // Save or update notes
      const notesResponse = await fetch(`${API_BASE_URL}/sessions/${sessionId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const existingNotes = await notesResponse.json()
      
      if (existingNotes && existingNotes.length > 0) {
        // Update existing note
        await fetch(`${API_BASE_URL}/notes/${existingNotes[0].note_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: notes
          })
        })
      } else {
        // Create new note
        await fetch(`${API_BASE_URL}/sessions/${sessionId}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: notes
          })
        })
      }

      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        onBack()
      }, 1500)
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return <div className="session-detail-loading">Loading...</div>
  }

  return (
    <div className="session-detail">
      <div className="session-detail-header">
        <div className="header-top">
          <div className="header-left">
            <button className="back-btn" onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="session-info">
              <h1>Session</h1>
              <div className="session-meta">
                <span className="client-name">{session.client_name}</span>
                <span className="separator">•</span>
                <span className="session-date">{formatDate(session.session_date || session.created_at)}</span>
              </div>
            </div>
          </div>
          <button className="save-btn" onClick={handleSaveChanges} disabled={isSaving}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L6 12L14 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="session-content-container">
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'recording' ? 'active' : ''}`}
              onClick={() => setActiveTab('recording')}
            >
              Recording
            </button>
            <button 
              className={`tab ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
            <button 
              className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Therapist Notes
            </button>
            <button 
              className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
              onClick={() => setActiveTab('issues')}
            >
              Key Issues
            </button>
            <button 
              className={`tab ${activeTab === 'followups' ? 'active' : ''}`}
              onClick={() => setActiveTab('followups')}
            >
              Follow-ups
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'recording' && (
            <div className="recording-tab">
              <div className="audio-player">
                <div className="audio-controls">
                  <button className="play-btn" onClick={handlePlayPause}>
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="4" y="2" width="3" height="12" fill="white" />
                        <rect x="9" y="2" width="3" height="12" fill="white" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 2L12 8L4 14V2Z" fill="white" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="skip-controls">
                    <button className="skip-btn" onClick={skipBackward}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8L10 4" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 8L4 8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="skip-btn" onClick={skipForward}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 8L12 8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="progress-bar" onClick={handleSeek}>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                  </div>
                  <div 
                    className="progress-thumb" 
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              </div>

              <p className="audio-info">Audio recording stored securely.</p>

              {session.audio_file_path && (
                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                >
                  <source 
                    src={`${API_BASE_URL}/sessions/${sessionId}/audio?token=${localStorage.getItem('token')}`} 
                    type="audio/webm" 
                  />
                </audio>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="transcript-tab">
              <div className="transcript-toolbar">
                <div className="search-box">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
                    <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 19L14.65 14.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button className="export-btn" onClick={handleExportTranscript}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 10V2" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export
                </button>
              </div>
              {transcript ? (
                <div className="transcript-content-wrapper">
                  <div className="transcript-content-box">
                    <pre>{transcript}</pre>
                  </div>
                </div>
              ) : (
                <p className="transcript-empty">Transcript is being processed...</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-tab">
              <div className="notes-toolbar">
                <button className="format-btn" onClick={() => handleFormatText('bold')} title="Bold">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2H9C9.79565 2 10.5587 2.31607 11.1213 2.87868C11.6839 3.44129 12 4.20435 12 5C12 5.79565 11.6839 6.55871 11.1213 7.12132C10.5587 7.68393 9.79565 8 9 8H4V2Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 8H10C10.7956 8 11.5587 8.31607 12.1213 8.87868C12.6839 9.44129 13 10.2044 13 11C13 11.7956 12.6839 12.5587 12.1213 13.1213C11.5587 13.6839 10.7956 14 10 14H4V8Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="format-btn" onClick={() => handleFormatText('italic')} title="Italic">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 2H7" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 14H4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 2L6 14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="format-btn" onClick={() => handleFormatText('insertUnorderedList')} title="Bullet List">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 8H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 12H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="2.5" cy="4" r="0.5" fill="#374151"/>
                    <circle cx="2.5" cy="8" r="0.5" fill="#374151"/>
                    <circle cx="2.5" cy="12" r="0.5" fill="#374151"/>
                  </svg>
                </button>
                <button className="format-btn" onClick={() => handleFormatText('insertOrderedList')} title="Numbered List">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 8H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 12H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <text x="2" y="5.5" fontSize="4" fill="#374151">1</text>
                    <text x="2" y="9.5" fontSize="4" fill="#374151">2</text>
                    <text x="2" y="13.5" fontSize="4" fill="#374151">3</text>
                  </svg>
                </button>
              </div>
              <div className="notes-content-wrapper">
                <div
                  ref={notesRef}
                  className="notes-editor-box"
                  contentEditable
                  onInput={handleNotesChange}
                  suppressContentEditableWarning
                  data-placeholder="Type your notes here..."
                />
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="issues-tab">
              <div className="issues-header">
                <h2>Key Issues & Themes</h2>
              </div>
              
              <div className="issues-input-wrapper">
                <textarea
                  className="issues-input"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddIssue();
                    }
                  }}
                  placeholder="Type issue and press Enter or click Add (e.g., Anxiety management)"
                  rows="3"
                />
                <button className="add-issue-btn" onClick={handleAddIssue}>
                  Add Issue
                </button>
              </div>

              {issues.length > 0 && (
                <div className="issues-list">
                  <div className="issues-list-label">Key Issues Discussed:</div>
                  <div className="issue-tags-container">
                    {issues.map((issue) => (
                      <div key={issue.issue_id} className="issue-tag-item">
                        <span className="issue-tag-text">{issue.issue_text}</span>
                        <button 
                          className="remove-issue-btn" 
                          onClick={() => handleDeleteIssue(issue.issue_id)}
                          title="Remove issue"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="issues-info">These tags will appear in the session timeline and client overview.</p>
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="followups-tab">
              <p>Follow-ups will appear here...</p>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast 
          message="Session saved successfully" 
          onClose={() => setShowToast(false)}
          duration={5000}
        />
      )}
    </div>
  )
}

export default SessionDetail
