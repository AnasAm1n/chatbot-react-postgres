// ========== Import dependencies ========== //
import express from "express";
import cors from "cors";
import sql from "./db.js";

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
 * GET /api/threads
 *
 * Fetches all chat threads from the database, ordered by creation date (newest first).
 *
 * SQL Concepts:
 * - SELECT: Retrieve data from the database
 * - Specific columns: Only fetch the columns we need (id, title, created_at)
 * - ORDER BY: Sort the results
 * - DESC: Descending order (newest first)
 *
 * API Concepts:
 * - async/await: Handle asynchronous database queries
 * - try/catch: Handle errors gracefully
 * - Status codes: 200 for success, 500 for server errors
 * - JSON response: Return data in a format the frontend can use
 */
app.get("/api/threads", async (req, res) => {
  try {
    // Execute SQL query using the sql`` tagged template
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
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
 * SQL Concepts:
 * - WHERE clause: Filter results to match a specific condition
 * - Parameterized queries: Safely include user input in SQL queries
 * - Primary key lookup: Fast retrieval using the id column
 *
 * API Concepts:
 * - Route parameters: Dynamic URL segments (the :id part)
 * - 404 Not Found: Return when requested resource doesn't exist
 * - req.params: Access route parameters from the URL
 *
 * Security:
 * - Tagged template (sql``) prevents SQL injection
 * - Even with user input, the query is safe from malicious SQL
 */
app.get("/api/threads/:id", async (req, res) => {
  try {
    // Extract the thread ID from the URL
    // For /api/threads/123, req.params.id will be "123"
    const threadId = req.params.id;

    // Execute SQL query with WHERE clause
    // The ${threadId} is safely parameterized by the postgres library
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      WHERE id = ${threadId}
    `;

    // Check if thread was found
    // SQL returns an empty array if no matches
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
 * SQL Concepts:
 * - WHERE with foreign key: Filter messages by their thread_id
 * - ORDER BY ASC: Sort in ascending order (oldest first)
 * - Relationships: Connect messages to threads via thread_id
 *
 * API Concepts:
 * - Nested resources: Messages belong to a thread
 * - RESTful routing: /resource/:id/sub-resource pattern
 * - Chronological ordering: Natural order for chat messages
 */
app.get("/api/threads/:id/messages", async (req, res) => {
  try {
    const threadId = req.params.id;

    // Fetch all messages for this thread
    // Filter by thread_id foreign key and sort chronologically
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
 * Creates a new message in a thread.
 *
 * SQL Concepts:
 * - INSERT INTO: Add new rows to a table
 * - VALUES: Specify the data to insert
 * - RETURNING: Get back the inserted row (PostgreSQL-specific feature)
 *
 * API Concepts:
 * - POST method: Used for creating new resources
 * - Request body: Data sent from client (accessed via req.body)
 * - 201 Created: Success status for resource creation
 * - 400 Bad Request: Client sent invalid data
 * - Input validation: Never trust user input
 *
 * Security:
 * - Validate all inputs before using them
 * - Parameterized queries prevent SQL injection
 * - Return helpful error messages without exposing internals
 */
app.post("/api/threads/:id/messages", async (req, res) => {
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

    // Insert the new message
    // RETURNING * gives us back the inserted row (including generated id and created_at)
    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, ${type}, ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    // Return the created message with 201 Created status
    res.status(201).json(messages[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      error: "Failed to create message",
    });
  }
});

// ========== Start the server ========== //
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
