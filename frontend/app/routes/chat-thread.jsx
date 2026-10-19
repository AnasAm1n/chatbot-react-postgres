import {
  useLoaderData,
  useActionData,
  Link,
  useRouteError,
  href,
} from "react-router";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

/**
 * ERROR BOUNDARY COMPONENT
 *
 * Handles errors that occur in this route, including 404 errors.
 * Key concepts:
 * 1. ERROR BOUNDARY: React Router's built-in error handling mechanism
 * 2. useRouteError() HOOK: Access the error object thrown in loader/action
 * 3. 404 HANDLING: Special case for missing threads (deleted or never existed)
 * 4. USER FEEDBACK: Show helpful message and recovery options
 *
 * This component renders when:
 * - Thread is not found (404 error)
 * - API request fails
 * - Any error is thrown in loader or action
 */
export function ErrorBoundary() {
  const error = useRouteError();

  // Check if this is a 404 error (thread not found)
  const isNotFound = error?.status === 404;

  return (
    <div className="chat-container">
      <div className="chat-thread-header">
        <h2>{isNotFound ? "Thread Not Found" : "Something Went Wrong"}</h2>
        <p>
          {isNotFound
            ? "This conversation may have been deleted or never existed."
            : error?.message || "An unexpected error occurred."}
        </p>
        <p>
          <Link to={href("/chat/new")}>Start a new chat</Link>
        </p>
      </div>
    </div>
  );
}

/**
 * CLIENT LOADER FUNCTION
 *
 * Fetches thread details and messages from Supabase.
 * Key concepts:
 * 1. ASYNC FUNCTION: Can perform asynchronous operations like data fetching
 * 2. PARAMS ACCESS: Receives route parameters (like threadId) via the params object
 * 3. MULTIPLE API CALLS: Fetches both thread metadata and messages
 * 4. FILTERING: Uses Supabase query parameters to filter by thread_id
 * 5. ORDERING: Sorts messages by creation time for chronological display
 *
 * The loader runs:
 * - When you navigate to this route
 * - When you refresh the page
 * - When React Router revalidates data
 */
export async function clientLoader({ params }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fetch thread metadata
  // - id=eq.{threadId}: Filter to get only this specific thread
  // - select=*: Get all columns
  const threadUrl = `${supabaseUrl}/rest/v1/threads?id=eq.${params.threadId}&select=*`;

  const threadResponse = await fetch(threadUrl, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!threadResponse.ok) {
    throw new Error(`Failed to fetch thread: ${threadResponse.status}`);
  }

  // Supabase returns an array, even for single results
  const threadData = await threadResponse.json();
  const thread = threadData[0];

  // If thread not found, throw error (will be caught by ErrorBoundary)
  if (!thread) {
    throw new Response("Thread not found", { status: 404 });
  }

  // Fetch messages for this thread
  // - thread_id=eq.{threadId}: Filter messages by thread
  // - order=created_at.asc: Sort oldest to newest (chronological)
  const messagesUrl = `${supabaseUrl}/rest/v1/messages?thread_id=eq.${params.threadId}&select=*&order=created_at.asc`;

  const messagesResponse = await fetch(messagesUrl, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!messagesResponse.ok) {
    throw new Error(`Failed to fetch messages: ${messagesResponse.status}`);
  }

  const messages = await messagesResponse.json();

  return {
    thread,
    messages,
  };
}

/**
 * CLIENT ACTION FUNCTION
 *
 * Handles form submissions to create new messages.
 * Key concepts:
 * 1. FORM DATA: Extract data from form submission
 * 2. POST REQUEST: Send data to Supabase to create new message
 * 3. AUTOMATIC REVALIDATION: React Router re-runs loader after action completes
 * 4. OPTIMISTIC UI: Form clears immediately, data refreshes automatically
 *
 * The action runs:
 * - When a Form with method="post" is submitted
 * - Before the loader re-runs (automatic revalidation)
 */
export async function clientAction({ params, request }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Extract form data from the request
  const formData = await request.formData();
  const content = formData.get("message");

  // Validate message content
  if (!content || !content.trim()) {
    return { error: "Message cannot be empty" };
  }

  // Create the message object
  const newMessage = {
    thread_id: params.threadId,
    type: "user",
    content: content.trim(),
  };

  // POST to Supabase to create the message
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMessage),
    });

    if (!response.ok) {
      return { error: `Failed to create message: ${response.status}` };
    }

    // Return success - loader will automatically revalidate
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Chat Thread Route Component
 *
 * Displays a conversation thread with messages from the database.
 * Now includes error handling from form submissions.
 *
 * Key concepts:
 * 1. useLoaderData() HOOK: Accesses data returned from clientLoader
 * 2. useActionData() HOOK: Accesses result returned from clientAction
 * 3. ERROR DISPLAY: Shows validation or API errors to the user
 * 4. USER FEEDBACK: Informs users when something goes wrong
 */
export default function ChatThread() {
  // Access the thread and messages data from the loader
  const { thread, messages } = useLoaderData();

  // Access the action result (success or error)
  const actionData = useActionData();

  return (
    <main className="chat-container">
      <div className="chat-thread-header">
        <h2>{thread.title}</h2>
      </div>
      <ChatMessages messages={messages} />
      <ChatInput />
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
    </main>
  );
}
