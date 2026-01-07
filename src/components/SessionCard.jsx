import './SessionCard.css';

function SessionCard({ session }) {
  // Helper function to strip HTML tags and show only plain text
  const getPlainTextPreview = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    // Get plain text
    let plainText = temp.textContent || temp.innerText || '';
    
    // Trim whitespace
    plainText = plainText.trim();
    
    // Limit to 150 characters and add ellipsis if longer
    if (plainText.length > 150) {
      plainText = plainText.substring(0, 150) + '...';
    }
    
    return plainText;
  };

  return (
    <div className="session-card">
      <div className="session-header">
        <div className="session-date">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 2h-2V1h-1v1H6V1H5v1H3C2.45 2 2 2.45 2 3v10c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm0 11H3V6h10v7z" fill="#5A9A94"/>
          </svg>
          <div>
            <div className="session-date-text">{session.date}</div>
            <div className="session-number">{session.sessionNumber}</div>
          </div>
        </div>
        <div className="session-duration">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#666" strokeWidth="1.5"/>
            <path d="M7 3.5V7h3.5" stroke="#666" strokeWidth="1.5"/>
          </svg>
          <span>{session.duration}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#666" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      <div className="session-body">
        <div className="client-label">Client</div>
        <div className="client-name">{session.clientName}</div>

        <div className="session-badges">
          <span className="badge badge-recording">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4" fill="#5A9A94"/>
            </svg>
            Recording
          </span>
          <span className="badge badge-transcript">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 2h6M3 5h6M3 8h4" stroke="#4A90E2" strokeWidth="1.5"/>
            </svg>
            Transcript
          </span>
          {session.hasNotes && (
            <span className="badge badge-notes">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2H4L2 4v6h8V4l-2-2z" stroke="#F5A623" strokeWidth="1.5"/>
              </svg>
              Notes
            </span>
          )}
        </div>

        {session.keyIssues && session.keyIssues.length > 0 && (
          <div className="key-issues">
            <div className="key-issues-label">Key Issues Discussed:</div>
            <div className="issue-tags">
              {session.keyIssues.map((issue, index) => (
                <span key={index} className="issue-tag">{issue}</span>
              ))}
            </div>
          </div>
        )}

        {session.notesPreview && (
          <div className="notes-preview">
            <div className="notes-preview-label">Notes Preview:</div>
            <div className="notes-preview-text">{getPlainTextPreview(session.notesPreview)}</div>
          </div>
        )}

        {session.updates && (
          <div className="session-updates">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v6l4 2" stroke="#4A90E2" strokeWidth="1.5"/>
              <circle cx="7" cy="7" r="6" stroke="#4A90E2" strokeWidth="1.5"/>
            </svg>
            <span>{session.updates}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionCard;
