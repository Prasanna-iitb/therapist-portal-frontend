import { useState, useEffect } from 'react';
import './Home.css';
import { API_BASE_URL } from '../config';
import { fetchSessions } from '../services/sessionService';
import { createClient } from '../services/clientService';
import StartSessionModal from '../components/StartSessionModal';
import RecordingSession from '../components/RecordingSession';
import SessionDetail from './SessionDetail';

function Home() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [recordingSession, setRecordingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null); // { sessionId, isNew }

  // Fetch sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions({ limit: 50 });
      
      // Fetch key issues for all sessions
      const token = localStorage.getItem('token');
      const sessionsWithIssues = await Promise.all(
        data.map(async (session) => {
          try {
            const issuesResponse = await fetch(`${API_BASE_URL}/sessions/${session.session_id}/issues`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (issuesResponse.ok) {
              const issuesData = await issuesResponse.json();
              return {
                ...session,
                keyIssuesData: issuesData || []
              };
            }
          } catch (err) {
            console.error('Error fetching issues for session:', session.session_id, err);
          }
          return { ...session, keyIssuesData: [] };
        })
      );
      
      // Transform backend data to match frontend UI format
      const formattedSessions = sessionsWithIssues.map(session => {
        // Determine the update message
        let updateMessage = null;
        const responseCount = parseInt(session.followup_response_count) || 0;
        
        if (responseCount > 0 && session.latest_response_client_name) {
          // Show response count and client name
          const responsePlural = responseCount === 1 ? 'response' : 'responses';
          updateMessage = `${responseCount} ${responsePlural} by ${session.latest_response_client_name}`;
        }
        
        return {
          id: session.session_id,
          date: formatDate(session.session_date),
          sessionNumber: `Session`,
          duration: formatDuration(session.duration),
          clientName: session.client_name || 'Unknown Client',
          hasRecording: !!session.audio_file_path,
          hasTranscript: session.status === 'completed',
          hasNotes: session.has_notes || false,
          keyIssues: (session.keyIssuesData || []).map(issue => issue.issue_text),
          notesPreview: session.notes_preview || '',
          updates: updateMessage,
          ...session // Keep original data as well
        };
      });
      
      setSessions(formattedSessions);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session =>
    session.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecordingClick = (sessionId) => {
    console.log('Recording clicked for session:', sessionId);
    // TODO: Implement recording playback
  };

  const handleTranscriptClick = (sessionId) => {
    console.log('Transcript clicked for session:', sessionId);
    // TODO: Implement transcript view
  };

  const handleNotesClick = (sessionId) => {
    console.log('Notes clicked for session:', sessionId);
    // TODO: Implement notes view
  };

  const handleStartRecording = () => {
    setIsStartModalOpen(true);
  };

  const handleStartSession = async (client) => {
    try {
      let clientData = client;
      
      // If it's a new client, create it first
      if (client.isNew) {
        const newClient = await createClient({ name: client.name });
        clientData = newClient;
      }
      
      // Get the next session number for this client
      const clientSessions = sessions.filter(s => s.client_id === clientData.client_id);
      const sessionNumber = clientSessions.length + 1;
      
      // Start recording session
      setRecordingSession({
        client: clientData,
        sessionNumber: sessionNumber,
      });
      
      setIsStartModalOpen(false);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleCancelRecording = () => {
    if (confirm('Are you sure you want to cancel this recording?')) {
      setRecordingSession(null);
    }
  };

  const handleCompleteRecording = async (audioBlob, duration) => {
    try {
      console.log('Starting to save recording...', {
        clientId: recordingSession.client.client_id,
        duration,
        blobSize: audioBlob.size
      });
      
      // Create session in backend
      const formData = new FormData();
      formData.append('client_id', recordingSession.client.client_id);
      formData.append('duration', duration);
      formData.append('audio', audioBlob, 'recording.webm');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to save recording: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Recording saved:', result);
      
      // Reload sessions
      await loadSessions();
      
      // Clear recording session and navigate to session detail with isNew flag
      setRecordingSession(null);
      setViewingSession({ sessionId: result.session_id, isNew: true });
    } catch (error) {
      console.error('Error saving recording:', error);
      alert(`Failed to save recording: ${error.message}`);
      // Don't clear recording session on error so user can try again
    }
  };

  const handleSessionClick = (sessionId) => {
    console.log('Session clicked:', sessionId);
    setViewingSession({ sessionId, isNew: false });
  };

  if (viewingSession) {
    return (
      <SessionDetail 
        sessionId={viewingSession.sessionId}
        isNewSession={viewingSession.isNew}
        onBack={() => setViewingSession(null)}
      />
    );
  }

  if (recordingSession) {
    return (
      <RecordingSession
        clientName={recordingSession.client.name}
        sessionNumber={recordingSession.sessionNumber}
        onCancel={handleCancelRecording}
        onComplete={handleCompleteRecording}
      />
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Home</h1>
        <p>Welcome back, Dr. Smith</p>
      </div>

      <h2 className="sessions-title">Sessions Taken</h2>
      
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by client name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="start-recording-btn" onClick={handleStartRecording}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12.6667V14.6667" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.6667 6.66666V7.99999C12.6667 9.23767 12.175 10.4246 11.2998 11.2998C10.4246 12.175 9.23767 12.6667 8 12.6667C6.76232 12.6667 5.57534 12.175 4.70017 11.2998C3.825 10.4246 3.33333 9.23767 3.33333 7.99999V6.66666" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 3.33334C10 2.22877 9.10457 1.33334 8 1.33334C6.89543 1.33334 6 2.22877 6 3.33334V8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8V3.33334Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Start Recording
        </button>
      </div>

      <div className="sessions-list">
        {loading ? (
          <div className="loading-message">Loading sessions...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredSessions.length === 0 ? (
          <div className="no-sessions-message">
            {searchTerm ? 'No sessions found matching your search.' : 'No sessions yet. Start by creating a new session.'}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="session-card" onClick={() => handleSessionClick(session.id)}>
              <div className="session-header">
                <div className="session-date-info">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2.5" y="3.33" width="15" height="13.33" stroke="#0D9488" strokeWidth="2"/>
                    <line x1="2.5" y1="8.33" x2="17.5" y2="8.33" stroke="#0D9488" strokeWidth="2"/>
                    <line x1="6.67" y1="1.67" x2="6.67" y2="5" stroke="#0D9488" strokeWidth="2"/>
                    <line x1="13.33" y1="1.67" x2="13.33" y2="5" stroke="#0D9488" strokeWidth="2"/>
                  </svg>
                  <div>
                    <div className="session-date">{session.date}</div>
                    <div className="session-number">{session.sessionNumber}</div>
                  </div>
                </div>
                <div className="session-duration">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.67" stroke="#9CA3AF" strokeWidth="2"/>
                    <line x1="8" y1="4" x2="8" y2="8.67" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  <span>{session.duration}</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5l5 5-5 5" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              <div className="session-body">
                <div className="client-label">Client</div>
                <div className="client-name">{session.clientName}</div>

                <div className="session-badges">
                  {session.hasRecording && (
                    <button className="badge badge-recording" onClick={(e) => { e.stopPropagation(); handleRecordingClick(session.id); }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 12.6667V14.6667" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.6667 6.66669V8.00002C12.6667 9.2377 12.175 10.4247 11.2998 11.2999C10.4247 12.175 9.23768 12.6667 8 12.6667C6.76233 12.6667 5.57534 12.175 4.70017 11.2999C3.825 10.4247 3.33334 9.2377 3.33334 8.00002V6.66669" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 3.33331C10 2.22874 9.10457 1.33331 8 1.33331C6.89543 1.33331 6 2.22874 6 3.33331V7.99998C6 9.10455 6.89543 9.99998 8 9.99998C9.10457 9.99998 10 9.10455 10 7.99998V3.33331Z" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Recording
                    </button>
                  )}
                  {session.hasTranscript && (
                    <button className="badge badge-transcript" onClick={(e) => { e.stopPropagation(); handleTranscriptClick(session.id); }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 1.33331H4.00001C3.64638 1.33331 3.30724 1.47379 3.0572 1.72384C2.80715 1.97389 2.66667 2.31302 2.66667 2.66665V13.3333C2.66667 13.6869 2.80715 14.0261 3.0572 14.2761C3.30724 14.5262 3.64638 14.6666 4.00001 14.6666H12C12.3536 14.6666 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.6869 13.3333 13.3333V4.66665L10 1.33331Z" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.33333 1.33331V3.99998C9.33333 4.3536 9.4738 4.69274 9.72385 4.94279C9.9739 5.19284 10.313 5.33331 10.6667 5.33331H13.3333" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.66666 6H5.33333" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.6667 8.66669H5.33333" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.6667 11.3333H5.33333" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Transcript
                    </button>
                  )}
                  {session.hasNotes && (
                    <button className="badge badge-notes" onClick={(e) => { e.stopPropagation(); handleNotesClick(session.id); }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <g clipPath="url(#clip0_1_172)">
                          <path d="M10.4713 14.1953C10.3463 14.3203 10.1768 14.3905 10 14.3905C9.82324 14.3905 9.6537 14.3203 9.52868 14.1953L8.47134 13.138C8.34636 13.013 8.27615 12.8434 8.27615 12.6666C8.27615 12.4899 8.34636 12.3203 8.47134 12.1953L12.1953 8.47131C12.3204 8.34633 12.4899 8.27612 12.6667 8.27612C12.8435 8.27612 13.013 8.34633 13.138 8.47131L14.1953 9.52865C14.3203 9.65367 14.3905 9.8232 14.3905 9.99998C14.3905 10.1768 14.3203 10.3463 14.1953 10.4713L10.4713 14.1953Z" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8.66665L11.0833 4.08398C11.0584 3.9593 10.9983 3.84435 10.9102 3.75269C10.8221 3.66103 10.7096 3.59648 10.586 3.56665L2.15668 1.35198C2.04563 1.32513 1.92955 1.32727 1.81956 1.3582C1.70958 1.38912 1.60939 1.44779 1.52861 1.52858C1.44782 1.60936 1.38915 1.70955 1.35823 1.81953C1.32731 1.92952 1.32517 2.0456 1.35201 2.15665L3.56668 10.586C3.59651 10.7096 3.66106 10.8221 3.75272 10.9102C3.84438 10.9983 3.95933 11.0584 4.08401 11.0833L8.66668 12" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1.53333 1.53333L6.39066 6.39066" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7.33333 8.66667C8.06971 8.66667 8.66667 8.06971 8.66667 7.33333C8.66667 6.59695 8.06971 6 7.33333 6C6.59695 6 6 6.59695 6 7.33333C6 8.06971 6.59695 8.66667 7.33333 8.66667Z" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_1_172">
                            <rect width="16" height="16" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      Notes
                    </button>
                  )}
                </div>

                {session.keyIssues && session.keyIssues.length > 0 && (
                  <div className="key-issues">
                    <div className="key-issues-label">Key Issues Discussed:</div>
                    <div className="issue-tags">
                      {session.keyIssues.map((issue, idx) => (
                        <span key={idx} className="issue-tag">{issue}</span>
                      ))}
                    </div>
                  </div>
                )}

                {session.notesPreview && (
                  <div className="notes-preview">
                    <div className="notes-preview-label">Notes Preview:</div>
                    <div className="notes-preview-text">{session.notesPreview}</div>
                  </div>
                )}

                {session.updates && (
                  <div className="session-updates">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6.84534 14C6.96237 14.2027 7.13068 14.371 7.33337 14.488C7.53605 14.605 7.76597 14.6666 8 14.6666C8.23404 14.6666 8.46396 14.605 8.66664 14.488C8.86933 14.371 9.03764 14.2027 9.15467 14" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.17467 10.2174C2.08758 10.3128 2.0301 10.4315 2.00924 10.5591C1.98837 10.6866 2.00501 10.8174 2.05714 10.9356C2.10926 11.0539 2.19462 11.1544 2.30284 11.225C2.41105 11.2956 2.53745 11.3333 2.66667 11.3334H13.3333C13.4625 11.3334 13.589 11.2959 13.6972 11.2254C13.8055 11.155 13.891 11.0545 13.9433 10.9364C13.9955 10.8182 14.0123 10.6874 13.9916 10.5599C13.9709 10.4324 13.9136 10.3136 13.8267 10.218C12.94 9.30404 12 8.33271 12 5.33337C12 4.27251 11.5786 3.25509 10.8284 2.50495C10.0783 1.7548 9.06087 1.33337 8 1.33337C6.93914 1.33337 5.92172 1.7548 5.17157 2.50495C4.42143 3.25509 4 4.27251 4 5.33337C4 8.33271 3.05933 9.30404 2.17467 10.2174Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{session.updates}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <StartSessionModal
        open={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
}

export default Home;
