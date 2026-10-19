import { Outlet, useLoaderData, redirect } from "react-router";
import Sidebar from "../components/Sidebar.jsx";

/**
 * CLIENT LOADER FUNCTION
 *
 * Fetches the list of chat threads from Supabase before the layout renders.
 * Key concepts:
 * 1. PARENT ROUTE LOADER: Runs before any child route loaders
 * 2. SHARED DATA: Data is available to this component and can be accessed by children
 * 3. SUPABASE REST API: Direct HTTP calls to Supabase database
 * 4. ENVIRONMENT VARIABLES: Secure way to store API credentials
 * 5. QUERY PARAMETERS: Using URL parameters to filter and sort data
 *
 * This loader runs:
 * - On initial page load
 * - When navigating to any route under this layout
 * - When React Router revalidates (after mutations)
 */
export async function clientLoader() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Construct the API endpoint URL
  // - /rest/v1/threads: Access the threads table
  // - select=*: Get all columns
  // - order=created_at.desc: Sort by newest first
  const url = `${supabaseUrl}/rest/v1/threads?select=*&order=created_at.desc`;

  // Make the request with required Supabase headers
  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey, // Required for authentication
      Authorization: `Bearer ${supabaseKey}`, // Required for authorization
    },
  });

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.status}`);
  }

  // Parse the JSON response
  const threads = await response.json();

  return { threads };
}

/**
 * CLIENT ACTION FUNCTION
 *
 * Handles thread deletion requests.
 * Key concepts:
 * 1. INTENT PATTERN: Uses form field to identify the action type
 * 2. DELETE REQUEST: Sends DELETE request to Supabase
 * 3. CASCADE DELETE: Supabase automatically deletes related messages
 * 4. AUTOMATIC REVALIDATION: Loader re-runs to refresh thread list
 *
 * The action runs:
 * - When a Form with method="post" is submitted
 * - Checks the "intent" field to determine the action
 */
export async function clientAction({ request }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Extract form data
  const formData = await request.formData();
  const intent = formData.get("intent");
  const threadId = formData.get("threadId");

  // Handle delete intent
  if (intent === "delete" && threadId) {
    try {
      // DELETE request to Supabase
      // Messages are automatically deleted due to CASCADE
      const response = await fetch(
        `${supabaseUrl}/rest/v1/threads?id=eq.${threadId}`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (!response.ok) {
        return { error: `Failed to delete thread: ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  return null;
}

/**
 * Layout Component
 *
 * Now uses DATA LOADING and MUTATIONS!
 *
 * Key concepts:
 * 1. useLoaderData() HOOK: Accesses data from clientLoader
 * 2. NO STATE MANAGEMENT: Data comes from loader, not useState
 * 3. LAYOUT PATTERN: Wraps child routes with consistent UI (sidebar)
 * 4. OUTLET: Renders the matched child route component
 * 5. NO DELETE CALLBACK: Sidebar handles deletion with useFetcher
 */
export default function Layout() {
  // Access threads data from the loader
  const { threads } = useLoaderData();

  return (
    <div className="app-layout">
      <Sidebar threads={threads} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
