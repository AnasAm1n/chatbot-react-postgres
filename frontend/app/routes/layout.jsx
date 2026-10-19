import { Outlet, useLoaderData, redirect } from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import { apiFetch } from "../lib/apiFetch.js";
import { supabase } from "../lib/supabase.js";

/**
 * CLIENT LOADER FUNCTION
 *
 * Fetches the user's chat threads from the backend API before the layout renders.
 * Key concepts:
 * 1. PARENT ROUTE LOADER: Runs before any child route loaders
 * 2. SHARED DATA: Data is available to this component and can be accessed by children
 * 3. CUSTOM REST API: Database access and sorting are handled by the backend
 * 4. AUTHENTICATION: apiFetch attaches the current user's access token
 *
 * This loader runs:
 * - On initial page load
 * - When navigating to any route under this layout
 * - When React Router revalidates (after mutations)
 */
export async function clientLoader() {
  const response = await apiFetch("/api/threads");

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
 * Handles thread deletion and user logout.
 * Key concepts:
 * 1. INTENT PATTERN: Uses form field to identify the action type
 * 2. DELETE REQUEST: Sends DELETE request to the backend API
 * 3. CASCADE DELETE: The database deletes related messages
 * 4. LOGOUT: Clears session and redirects to login
 * 5. AUTOMATIC REVALIDATION: Loader re-runs to refresh thread list
 *
 * The action runs:
 * - When a Form with method="post" is submitted
 * - Checks the "intent" field to determine the action
 */
export async function clientAction({ request }) {
  // Extract form data
  const formData = await request.formData();
  const intent = formData.get("intent");
  const threadId = formData.get("threadId");

  // Handle delete intent
  if (intent === "delete" && threadId) {
    try {
      // Delete the thread through the backend; related messages cascade in the database
      const response = await apiFetch(
        `/api/threads/${encodeURIComponent(threadId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        return { error: `Failed to delete thread: ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      return { error: error.message };
    }
  }

  if (intent === "logout") {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error.message);
    }

    return redirect("/login");
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
