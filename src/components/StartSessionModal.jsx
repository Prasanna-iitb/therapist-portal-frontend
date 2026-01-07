import { useEffect, useState } from 'react'
import './StartSessionModal.css'
import { fetchClients } from '../services/clientService'

function StartSessionModal({ open, onClose, onStart }) {
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isNewClient, setIsNewClient] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedClient(null)
      setShowDropdown(false)
      setSearchTerm('')
      setIsNewClient(false)
      // Re-enable body scroll
      document.body.style.overflow = 'unset'
    } else {
      loadClients()
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await fetchClients()
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const handleSubmit = () => {
    if (isNewClient && searchTerm.trim()) {
      // Pass new client name
      onStart?.({ name: searchTerm.trim(), isNew: true })
    } else if (selectedClient) {
      // Pass existing client
      onStart?.(selectedClient)
    }
  }

  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setSearchTerm(client.name)
    setShowDropdown(false)
    setIsNewClient(false)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedClient(null)
    setIsNewClient(false)
    setShowDropdown(true)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddNewClient = () => {
    setIsNewClient(true)
    setSelectedClient(null)
    setShowDropdown(false)
    console.log('Add new client:', searchTerm)
  }

  return (
    <div className="start-session-backdrop" role="dialog" aria-modal="true">
      <div className="start-session-modal">
        <div className="modal-header">
          <h3>Start New Session</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="client-select-wrapper">
            <input
              type="text"
              className="client-select-input"
              placeholder="Select a client..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="client-dropdown">
                <button className="add-client-btn" onClick={handleAddNewClient}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3.33334V12.6667" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.33334 8H12.6667" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {searchTerm ? `Add New Client "${searchTerm}"` : 'Add New Client'}
                </button>
                <div className="client-list">
                  {loading ? (
                    <div className="client-loading">Loading...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="client-empty">{searchTerm ? 'No matching clients found' : 'No clients found'}</div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.client_id}
                        className="client-item"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="client-item-content">
                          <div className="client-item-name">{client.name}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button 
            className="primary-btn" 
            onClick={handleSubmit}
            disabled={!selectedClient && !(isNewClient && searchTerm.trim())}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 12.6667V14.6667" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.6667 6.66666V7.99999C12.6667 9.23767 12.175 10.4246 11.2998 11.2998C10.4246 12.175 9.23767 12.6667 8 12.6667C6.76232 12.6667 5.57534 12.175 4.70017 11.2998C3.825 10.4246 3.33333 9.23767 3.33333 7.99999V6.66666" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 3.33334C10 2.22877 9.10457 1.33334 8 1.33334C6.89543 1.33334 6 2.22877 6 3.33334V8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8V3.33334Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Start Recording
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartSessionModal
