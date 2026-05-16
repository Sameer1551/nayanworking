/**
 * Centralized API configuration to handle network access dynamically.
 * Instead of hardcoding 'localhost', we use the current hostname 
 * to ensure that devices on the network can connect back to the server.
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Backend runs on port 8080 by default
export const API_BASE_URL = `http://${hostname}:8080/api`;

console.log(`API Base URL configured as: ${API_BASE_URL}`);
