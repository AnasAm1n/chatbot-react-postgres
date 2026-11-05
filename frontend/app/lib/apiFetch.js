/**
 * Authenticated API Fetch Helper
 *
 * This module wraps the standard fetch() function to automatically include
 * authentication tokens in API requests.
 *
 * Key concepts:
 * 1. WRAPPER FUNCTION: Extends fetch() with authentication logic
 * 2. JWT TOKEN: Retrieves token from Supabase session
 * 3. AUTHORIZATION HEADER: Adds "Bearer <token>" to all requests
 * 4. SESSION MANAGEMENT: Uses Supabase client to get current session
 * 5. BACKWARD COMPATIBLE: Works like fetch() but with auto-auth
 *
 * Why wrap fetch()?
 * - DRY Principle: Don't repeat authentication logic in every API call
 * - Consistency: Ensures all API requests include auth tokens
 * - Maintainability: Single place to update auth logic
 * - Flexibility: Easy to add logging, retries, or other features
 *
 * How it works:
 * 1. Get the current user's session from Supabase
 * 2. Extract the JWT access token from the session
 * 3. Add the token to the Authorization header
 * 4. Make the request with the standard fetch() function
 *
 * Usage:
 *   const response = await apiFetch('/api/threads');
 *   const response = await apiFetch('/api/threads', { method: 'POST', body: ... });
 */

import { supabase } from "./supabase.js";

/**
 * apiFetch - Fetch wrapper with automatic authentication
 *
 * @param {string} path - The API path (e.g., '/api/threads' or '/api/threads/123')
 * @param {RequestInit} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The fetch Response object
 */
export async function apiFetch(path, options = {}) {
  // Get our API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL;

  // Construct the full URL by combining API base URL with the path
  const url = `${apiUrl}${path}`;

  // Get the current session from Supabase
  // This returns { data: { session }, error }
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Extract the JWT access token from the session
  // If user is not logged in, session will be null
  const token = session?.access_token;

  // Prepare headers, merging any provided headers with our auth header
  const headers = {
    ...options.headers, // Keep any existing headers
  };

  // Add Authorization header if we have a token
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the request with the standard fetch() function
  // Spread the original options and override headers
  return fetch(url, {
    ...options,
    headers,
  });
}
