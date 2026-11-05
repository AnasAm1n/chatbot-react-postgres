import { useActionData, redirect } from "react-router";
import { ChatInput, ChatMessages } from "../components/Chat.jsx";
import { apiFetch } from "../lib/apiFetch.js";

/**
 * CLIENT ACTION FUNCTION
 *
 * Handles creation of new chat threads with their first message.
 * Key concepts:
 * 1. COMPOUND OPERATION: Single API call creates both thread and message
 * 2. REDIRECT: Navigate to new thread after successful creation
 * 3. TITLE GENERATION: Create thread title from first message
 * 4. ERROR HANDLING: Validate input and handle API errors
 * 5. AUTHENTICATED REQUESTS: Uses apiFetch to include JWT token
 *
 * The action runs:
 * - When a Form with method="post" is submitted
 * - Returns a redirect to navigate to the new thread
 */
export async function clientAction({ request }) {
  // Extract form data
  const formData = await request.formData();
  const content = formData.get("message");

  // Validate message content
  if (!content || !content.trim()) {
    return { error: "Message cannot be empty" };
  }

  // Generate thread title from first message (truncate to 50 chars)
  const title =
    content.trim().length > 50
      ? content.trim().slice(0, 50) + "..."
      : content.trim();

  try {
    // Create the thread with its first message in a single request
    // Our custom API handles both operations as a compound mutation
    // apiFetch automatically includes the JWT token and handles the base URL
    const response = await apiFetch("/api/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        content: content.trim(),
      }),
    });

    // Check for validation errors (400)
    if (response.status === 400) {
      const error = await response.json();
      return { error: error.error || "Invalid thread data" };
    }

    // Check for other errors
    if (!response.ok) {
      return { error: `Failed to create thread: ${response.status}` };
    }

    // Get the created thread data
    const data = await response.json();

    // Redirect to the new thread
    return redirect(`/chat/${data.thread.id}`);
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Chat New Route Component
 *
 * Provides a form to start a new conversation.
 * When submitted, creates a thread and redirects to it.
 *
 * Key concepts:
 * 1. DEDICATED ROUTE: Separate route for new chat functionality
 * 2. CLEAN URL: /chat/new is semantic and user-friendly
 * 3. FORM SUBMISSION: Uses ChatInput component with Form
 * 4. ERROR DISPLAY: Shows validation or API errors to user
 */
export default function ChatNew() {
  // Access action result for error display
  const actionData = useActionData();

  return (
    <main className="chat-container">
      <div className="chat-thread-header">
        <h2>Start a new conversation</h2>
        <p>Type a message below to begin chatting</p>
      </div>
      <ChatMessages />
      <ChatInput />
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
    </main>
  );
}
