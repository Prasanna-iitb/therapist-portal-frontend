// Session API Service

import { API_BASE_URL } from '../config.js';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Fetch all sessions for the current customer
 * @param {Object} options - Query parameters
 * @param {string} options.clientId - Filter by client ID
 * @param {string} options.status - Filter by status (pending, transcribing, completed)
 * @param {number} options.limit - Number of sessions to return (default: 10)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of sessions
 */
export const fetchSessions = async (options = {}) => {
  try {
    const { clientId, status, limit = 10, offset = 0 } = options;
    
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', clientId);
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('offset', offset);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/sessions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const sessions = await response.json();
    return sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Get a single session by ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Session object
 */
export const getSessionById = async (sessionId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

/**
 * Create a new session
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.clientId - Client ID
 * @param {string} sessionData.sessionDate - Session date (ISO string)
 * @param {string} sessionData.title - Session title
 * @param {number} sessionData.duration - Duration in seconds
 * @returns {Promise<Object>} Created session object
 */
export const createSession = async (sessionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-customer-id': getCustomerId(),
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Update a session
 * @param {string} sessionId - The session ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated session object
 */
export const updateSession = async (sessionId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-customer-id': getCustomerId(),
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.statusText}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

/**
 * Delete a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<void>}
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-customer-id': getCustomerId(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
