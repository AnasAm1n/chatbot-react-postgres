// ========== Import dependencies ========== //
import express from "express";
import cors from "cors";
import sql from "./db.js";
import { requireAuth } from "./auth.js";

// ========== Setup Express App ========== //
const app = express();
const PORT = process.env.PORT || 3000;

// ========== Middleware ========== //
// Middleware functions run in order for each request

// Enable CORS (Cross-Origin Resource Sharing)
// This allows our frontend (running on http://localhost:5173) to make requests
// to this API (running on http://localhost:3000)
// Without CORS, browsers block requests between different origins for security
app.use(cors());

// Parse JSON request bodies
// This middleware reads the body of POST/PUT/PATCH requests and parses JSON
// Makes the parsed data available as req.body in route handlers
// Without this, req.body would be undefined
app.use(express.json());

// ========== Define API Endpoints ========== //

// Root endpoint - verify server is running
app.get("/", (req, res) => {
  res.json({
    message: "Chatbot API Server 🤖",
    version: "1.0.0",
  });
});

/**
 * POST /api/test-mistral
 *
 * Test endpoint to verify Mistral API connection.
 * Sends a simple hardcoded prompt to test the API integration.
 *
 * Key concepts:
 * - Using fetch() in Node.js (same API as in the browser!)
 * - POST requests with JSON body
 * - Authorization header with Bearer token
 * - Reading API documentation and translating it to code
 * - Environment variables for API keys
 *
 * Mistral API structure:
 * - Endpoint: https://api.mistral.ai/v1/chat/completions
 * - Required headers: Authorization (Bearer token), Content-Type (application/json)
 * - Request body: { model, messages }
 * - messages array: [{ role: "user", content: "..." }]
 * - Response: { choices: [{ message: { role: "assistant", content: "..." } }] }
 */
app.post("/api/test-mistral", async (req, res) => {
  try {
    // Get the Mistral API key from environment variables
    const apiKey = process.env.MISTRAL_API_KEY;

    // Validate that the API key is configured
    if (!apiKey) {
      return res.status(500).json({
        error:
          "Mistral API key not configured. Please set MISTRAL_API_KEY in your .env file",
      });
    }

    // Call the Mistral API using fetch
    // Note: fetch() works the same way in Node.js as it does in the browser!
    const mistralResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            {
              role: "user",
              content: "Hello! Please respond with a short greeting.",
            },
          ],
        }),
      }
    );

    // Check if the request was successful
    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      console.error("Mistral API error:", errorData);
      return res.status(mistralResponse.status).json({
        error: "Failed to get response from Mistral API",
        details: errorData,
      });
    }

    // Parse the response
    const data = await mistralResponse.json();

    // Return the full response for testing
    res.json({
      message: "Successfully connected to Mistral API!",
      response: data,
    });
  } catch (error) {
    console.error("Error testing Mistral API:", error);
    res.status(500).json({
      error: "Failed to test Mistral API",
      details: error.message,
    });
  }
});

/**
 * GET /api/threads
 *
 * Fetches all chat threads from the database, ordered by creation date (newest first).
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - WHERE user_id = ${req.userId} ensures users only see their own threads
 * - This is data isolation - each user has their own separate list
 * - Users cannot see threads created by other users
 *
 * SQL Concepts:
 * - SELECT: Retrieve data from the database
 * - Specific columns: Only fetch the columns we need
 * - WHERE clause: Filter to only this user's threads
 * - ORDER BY: Sort the results
 * - DESC: Descending order (newest first)
 *
 * API Concepts:
 * - async/await: Handle asynchronous database queries
 * - try/catch: Handle errors gracefully
 * - Status codes: 200 for success, 500 for server errors
 * - JSON response: Return data in a format the frontend can use
 *
 * Security Note:
 * - Authorization happens at the database query level
 * - Even if frontend is compromised, backend enforces data isolation
 */
app.get("/api/threads", requireAuth, async (req, res) => {
  try {
    // Execute SQL query using the sql`` tagged template
    // WHERE clause filters to only threads owned by the authenticated user
    // This is the core of authorization - filtering data by ownership
    const threads = await sql`
      SELECT id, title, created_at
      FROM threads 
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;

    // Return the threads as JSON
    // Express automatically sets Content-Type: application/json
    res.json(threads);
  } catch (error) {
    // Log the error for debugging (you should see this in the terminal)
    console.error("Error fetching threads:", error);

    // Return a generic error message to the client
    // Don't expose internal error details for security
    res.status(500).json({
      error: "Failed to fetch threads from database",
    });
  }
});

/**
 * GET /api/threads/:id
 *
 * Fetches a single thread by its ID.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - WHERE user_id = ${req.userId} ensures users can only access their own threads
 * - Returns 404 if thread doesn't exist OR user doesn't own it
 * - This prevents users from discovering other users' thread IDs
 *
 * SQL Concepts:
 * - WHERE clause: Filter results to match BOTH id AND user_id
 * - Parameterized queries: Safely include user input in SQL queries
 * - Composite conditions: Multiple conditions in WHERE (AND logic)
 *
 * API Concepts:
 * - Route parameters: Dynamic URL segments (the :id part)
 * - 404 Not Found: Return when requested resource doesn't exist OR is unauthorized
 * - req.params: Access route parameters from the URL
 *
 * Security Design:
 * - 404 for unauthorized access (not 403) prevents information leakage
 * - Users can't tell if a thread exists but is unauthorized vs doesn't exist
 * - Tagged template (sql``) prevents SQL injection
 */
app.get("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL
    // For /api/threads/123, req.params.id will be "123"
    const threadId = req.params.id;

    // Execute SQL query with WHERE clause for BOTH id AND user_id
    // This ensures users can only access threads they own
    // The ${threadId} and ${req.userId} are safely parameterized by the postgres library
    const threads = await sql`
      SELECT id, title, user_id, created_at 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
    `;

    // Check if thread was found
    // SQL returns an empty array if no matches (either doesn't exist or not owned by user)
    // We return 404 in both cases to avoid leaking information about other users' threads
    if (threads.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return the first (and only) thread
    res.json(threads[0]);
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({
      error: "Failed to fetch thread from database",
    });
  }
});

/**
 * GET /api/threads/:id/messages
 *
 * Fetches all messages for a specific thread, ordered chronologically.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - First checks if thread exists AND is owned by the user
 * - Only returns messages if user owns the parent thread
 * - Returns empty array (not 404) if thread is unauthorized/doesn't exist
 *
 * SQL Concepts:
 * - WHERE with foreign key: Filter messages by their thread_id
 * - ORDER BY ASC: Sort in ascending order (oldest first)
 * - Relationships: Connect messages to threads via thread_id
 * - Authorization check: Verify thread ownership before fetching messages
 *
 * API Concepts:
 * - Nested resources: Messages belong to a thread
 * - RESTful routing: /resource/:id/sub-resource pattern
 * - Chronological ordering: Natural order for chat messages
 *
 * Security Design:
 * - Two-step authorization: check thread ownership, then fetch messages
 * - Returns empty array (not 404) to avoid leaking thread existence
 * - Users cannot access messages from threads they don't own
 */
app.get("/api/threads/:id/messages", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;

    // Step 1: Verify the thread exists AND is owned by the authenticated user
    // This prevents users from accessing messages in threads they don't own
    const threads = await sql`
      SELECT id 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
    `;

    // If thread doesn't exist or user doesn't own it, return empty array
    // We return empty array (not 404) because from the frontend's perspective,
    // a thread with no messages looks the same as an unauthorized thread
    if (threads.length === 0) {
      return res.json([]);
    }

    // Step 2: Fetch all messages for this thread
    // We know the user owns the thread, so it's safe to return the messages
    const messages = await sql`
      SELECT id, thread_id, type, content, created_at 
      FROM messages 
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;

    // Return messages array (empty array if no messages yet)
    // Unlike single thread endpoint, we don't 404 for empty results
    // An empty thread is valid - it just has no messages yet
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      error: "Failed to fetch messages from database",
    });
  }
});

/**
 * POST /api/threads/:id/messages
 *
 * Creates a new message in a thread and generates an AI response.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - Verifies thread exists AND is owned by the user before creating message
 * - Users can only add messages to their own threads
 * - Returns 404 if thread doesn't exist or user doesn't own it
 *
 * AI Integration:
 * - After saving user's message, fetches conversation history
 * - Sends conversation to Mistral API to generate AI response
 * - Saves AI response as a new message with type 'bot'
 * - Returns both user message and AI response
 *
 * Sequential Operations:
 * 1. Validate input
 * 2. Check thread ownership
 * 3. Save user's message to database
 * 4. Fetch all messages in thread (for context)
 * 5. Format messages for Mistral API
 * 6. Call Mistral API to generate response
 * 7. Save AI response to database
 * 8. Return both messages to client
 *
 * SQL Concepts:
 * - INSERT INTO: Add new rows to a table
 * - VALUES: Specify the data to insert
 * - RETURNING: Get back the inserted row (PostgreSQL-specific feature)
 * - Authorization check: Verify ownership before insert
 *
 * API Concepts:
 * - POST method: Used for creating new resources
 * - Request body: Data sent from client (accessed via req.body)
 * - 201 Created: Success status for resource creation
 * - 400 Bad Request: Client sent invalid data
 * - 404 Not Found: Thread doesn't exist or user doesn't own it
 * - Input validation: Never trust user input
 * - External API integration: Calling third-party services
 *
 * Security:
 * - Validate all inputs before using them
 * - Check thread ownership before allowing message creation
 * - Parameterized queries prevent SQL injection
 * - Return helpful error messages without exposing internals
 */
app.post("/api/threads/:id/messages", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;
    const { type, content } = req.body;

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        error: "Both 'type' and 'content' are required",
      });
    }

    // Validate type is either 'user' or 'bot'
    if (type !== "user" && type !== "bot") {
      return res.status(400).json({
        error: "Type must be either 'user' or 'bot'",
      });
    }

    // Validate content is not empty after trimming
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    // Authorization check: Verify the thread exists AND is owned by the user
    // This prevents users from adding messages to threads they don't own
    const threads = await sql`
      SELECT id 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
    `;

    // If thread doesn't exist or user doesn't own it, return 404
    if (threads.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // STEP 1: Insert the user's message
    // We've verified the user owns the thread, so it's safe to insert
    // RETURNING * gives us back the inserted row (including generated id and created_at)
    const userMessages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, ${type}, ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    const userMessage = userMessages[0];

    // STEP 2: Fetch all messages in this thread to provide context to the AI
    // We need the full conversation history so the AI understands the context
    const allMessages = await sql`
      SELECT id, thread_id, type, content, created_at 
      FROM messages 
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;

    // STEP 3: Format messages for Mistral API
    // Mistral expects: [{ role: "user" | "assistant" | "system", content: "..." }]
    // Our database uses: { type: "user" | "bot", content: "..." }
    // We need to translate 'bot' → 'assistant' for the API
    const mistralMessages = allMessages.map((msg) => ({
      role: msg.type === "bot" ? "assistant" : "user",
      content: msg.content,
    }));

    // Add a system prompt at the beginning to customize the AI's behavior
    // The system message provides instructions to the AI about how to respond
    // You can customize this to change your chatbot's personality!
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful and friendly AI assistant. Keep your responses concise, clear, and conversational. If you don't know something, admit it honestly. Be encouraging and supportive in your tone.",
    };

    // Prepend the system prompt to the messages array
    // System messages should come first to set the context for the entire conversation
    mistralMessages.unshift(systemPrompt);

    // STEP 4: Call Mistral API to generate a response
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      console.error("Mistral API key not configured");
      return res.status(201).json(userMessage);
    }

    const mistralResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: mistralMessages,
        }),
      }
    );

    // Check if the Mistral API request was successful
    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      console.error("Mistral API error:", errorData);
      // Return the user message even if AI generation fails
      return res.status(201).json(userMessage);
    }

    // Parse the AI response
    const aiData = await mistralResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // STEP 5: Save the AI's response to the database
    // Note: We use type 'bot' in our database (not 'assistant')
    const botMessages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, 'bot', ${aiContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    const botMessage = botMessages[0];

    // STEP 6: Return both the user's message and the AI's response
    // This allows the frontend to display both immediately without another request
    res.status(201).json({
      userMessage: userMessage,
      botMessage: botMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      error: "Failed to create message",
    });
  }
});

/**
 * POST /api/threads
 *
 * Creates a new thread with an initial message.
 * This is a compound operation that performs two inserts in sequence.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - Sets the user_id column to req.userId, establishing ownership
 * - Only the creator can access/modify this thread (enforced by other endpoints)
 *
 * SQL Concepts:
 * - SEQUENTIAL INSERTS: Thread must be created first to get its ID
 * - RETURNING clause: Get the created thread's ID for the message insert
 * - FOREIGN KEY: Message references the newly created thread
 * - TRANSACTION SEMANTICS: Both inserts should succeed or neither should
 * - DATA OWNERSHIP: user_id column links thread to its owner
 *
 * API Concepts:
 * - COMPOUND OPERATION: Creates multiple related resources in one request
 * - 201 Created: Appropriate status for resource creation
 * - Business Logic: A new chat always starts with a message
 * - Request Body: Requires both title and initial message content
 *
 * Design Decision:
 * This endpoint combines thread and message creation into a single request
 * because it matches the business logic (a chat thread always starts with
 * a message). An alternative would be separate endpoints, but that would
 * require two HTTP requests and expose an inconsistent state.
 */
app.post("/api/threads", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        error: "Both 'title' and 'content' are required",
      });
    }

    // Validate title is not empty after trimming
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    // Validate content is not empty after trimming
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    // Step 1: Create the thread
    // Use RETURNING to get the generated ID for the next insert
    // Set user_id to establish ownership - this user now owns this thread
    const threads = await sql`
      INSERT INTO threads (title, user_id)
      VALUES (${trimmedTitle}, ${req.userId})
      RETURNING id, title, user_id, created_at
    `;

    const thread = threads[0];

    // Step 2: Create the first message in the new thread
    // Use the thread ID from the previous insert
    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${thread.id}, 'user', ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    // Return both the thread and the initial message with 201 Created status
    // This gives the frontend everything it needs to navigate to the new thread
    res.status(201).json({
      thread: thread,
      message: messages[0],
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({
      error: "Failed to create thread",
    });
  }
});

/**
 * PATCH /api/threads/:id
 *
 * Updates a thread's title.
 * This is a partial update - only the title field is modified.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - WHERE user_id = ${req.userId} ensures users can only update their own threads
 * - Returns 404 if thread doesn't exist OR user doesn't own it
 * - This prevents users from modifying other users' threads
 *
 * SQL Concepts:
 * - UPDATE statement: Modifies existing rows in a table
 * - WHERE clause: Specifies which row(s) to update (BOTH id AND user_id)
 * - RETURNING clause: Returns the updated row to confirm the change
 * - Partial updates: Only specified columns are modified, others remain unchanged
 *
 * API Concepts:
 * - PATCH vs PUT: PATCH updates specific fields, PUT replaces entire resource
 * - 200 OK: Success status for updates (resource still exists at same URI)
 * - 404 Not Found: Thread doesn't exist or user doesn't own it
 * - 400 Bad Request: Invalid input data
 * - Idempotency: Calling PATCH multiple times with same data has same effect
 *
 * HTTP Method Choice:
 * We use PATCH because we're only updating the title field. If we were
 * replacing the entire thread resource, we would use PUT instead.
 *
 * Security Design:
 * - 404 for unauthorized access (not 403) prevents information leakage
 * - Authorization happens at query level with WHERE user_id clause
 */
app.patch("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL parameters
    const threadId = req.params.id;

    // Extract the new title from the request body
    const { title } = req.body;

    // Validate that title is provided
    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    // Validate title is not empty after trimming
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    // Update the thread in the database
    // Only the title field is modified, other fields (created_at) remain unchanged
    // WHERE clause includes BOTH id AND user_id for authorization
    // This ensures users can only update threads they own
    const result = await sql`
      UPDATE threads
      SET title = ${trimmedTitle}
      WHERE id = ${threadId} AND user_id = ${req.userId}
      RETURNING id, title, user_id, created_at
    `;

    // If no thread was updated, it means the thread doesn't exist or user doesn't own it
    // We return 404 in both cases to avoid leaking information
    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return the updated thread with 200 OK status
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({
      error: "Failed to update thread",
    });
  }
});

/**
 * DELETE /api/threads/:id
 *
 * Delete a thread by ID.
 *
 * Authentication:
 * - Protected by requireAuth middleware
 * - Requires valid JWT token in Authorization header
 * - req.userId contains the authenticated user's ID
 *
 * Authorization:
 * - WHERE user_id = ${req.userId} ensures users can only delete their own threads
 * - Returns 404 if thread doesn't exist OR user doesn't own it
 * - This prevents users from deleting other users' threads
 *
 * SQL Concepts:
 * - DELETE statement: Removes rows from a table
 * - WHERE clause: Specifies which row(s) to delete (BOTH id AND user_id)
 * - CASCADE: Automatically deletes related messages (from schema)
 * - RETURNING clause: Returns deleted row data for confirmation
 *
 * Security Design:
 * - 404 for unauthorized access (not 403) prevents information leakage
 * - Authorization happens at query level with WHERE user_id clause
 * - CASCADE ensures all related data is cleaned up
 */
app.delete("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL parameters
    const threadId = req.params.id;

    // Delete the thread from the database
    // WHERE clause includes BOTH id AND user_id for authorization
    // This ensures users can only delete threads they own
    // Note: This will automatically delete all associated messages
    // because of the ON DELETE CASCADE constraint on the messages table
    const result = await sql`
      DELETE FROM threads
      WHERE id = ${threadId} AND user_id = ${req.userId}
      RETURNING id
    `;

    // If no thread was deleted, it means the thread doesn't exist or user doesn't own it
    // We return 404 in both cases to avoid leaking information
    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return success message
    res.json({
      message: "Thread deleted successfully",
      deletedId: result[0].id,
    });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({
      error: "Failed to delete thread",
    });
  }
});

// ========== Start the server ========== //
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
