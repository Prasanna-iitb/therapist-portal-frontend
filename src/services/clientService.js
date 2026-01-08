// Client API Service

import { API_BASE_URL } from '../config.js';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Fetch all clients for the current customer
 * @returns {Promise<Array>} Array of clients
 */
export const fetchClients = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }

    const clients = await response.json();
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Get a single client by ID
 * @param {string} clientId - The client ID
 * @returns {Promise<Object>} Client object
 */
export const getClientById = async (clientId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }

    const client = await response.json();
    return client;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

/**
 * Create a new client
 * @param {Object} clientData - Client data
 * @param {string} clientData.name - Client name
 * @param {string} clientData.email - Client email
 * @param {string} clientData.phone - Client phone
 * @returns {Promise<Object>} Created client object
 */
export const createClient = async (clientData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create client: ${response.statusText}`);
    }

    const client = await response.json();
    return client;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

/**
 * Update a client
 * @param {string} clientId - The client ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated client object
 */
export const updateClient = async (clientId, updateData) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update client: ${response.statusText}`);
    }

    const client = await response.json();
    return client;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

/**
 * Delete a client
 * @param {string} clientId - The client ID
 * @returns {Promise<void>}
 */
export const deleteClient = async (clientId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete client: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
