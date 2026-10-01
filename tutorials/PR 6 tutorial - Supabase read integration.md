# Supabase integration: Database setup and data fetching - Step-by-step tutorial

## 🎯 Learning objectives

By the end of this tutorial, you will be able to:

- **Set up a database** in Supabase with two related tables and some test data
- **Explain** tables, columns, primary keys and foreign keys
- **Fetch data** from Supabase's REST API with `fetch`, using filters and sorting
- **Keep keys out of your code** with environment variables

## 📋 Prerequisites

- **[PR #5](../pull/5) completed** (steps 1–3): a `clientLoader` in `layout.jsx` and in `chat-thread.jsx`
- **`fetch`** basics: sending a request and reading the JSON response

## 📑 Table of contents

1. [Set up Supabase database with schema and seed data](#step-1)
2. [Fetch thread list from Supabase REST API](#step-2)
3. [Fetch thread messages from Supabase REST API](#step-3)

## 🗺️ Overview

In this tutorial, you'll learn how to integrate Supabase—a powerful, open-source Backend-as-a-Service (BaaS)—into your React Router application. You'll set up a PostgreSQL database, create tables with relationships, populate them with test data, and fetch that data using Supabase's REST API. By the end, your chatbot application will display real conversations stored in a cloud database instead of mock data.

**What you'll accomplish:**

- Create a PostgreSQL database schema with proper relationships and constraints
- Set up authentication and environment variables for API access
- Replace mock data with real API calls using the Supabase REST API
- Learn REST API concepts: endpoints, query parameters, headers, and filtering
- Handle asynchronous data loading in React Router loaders

Step 1 is setup work that doesn't touch your React code, so you can do it on its own, ahead of steps 2–3.

## 🧑‍💻 Today's starting point

If you haven't fully completed the prior tutorials, you may copy the starting point of this tutorial by running this command in the root of your local repository:

```bash
npx degit --force bewildergeist/chatbot-react-postgres#pr-6-start
```

**Important**: Make a commit of this initial version before you start changing anything.

### Where the code lives

| File | What happens to it |
| --- | --- |
| `supabase/README.md`, `schema.sql`, `seed.sql` | New: setup instructions and SQL scripts for your database |
| `frontend/.env.example` | New: a template for your Supabase URL and key |
| `frontend/.gitignore` | `.env` is added, so your keys never get committed |
| `frontend/app/routes/layout.jsx` | The loader fetches the thread list from Supabase |
| `frontend/app/routes/chat-thread.jsx` | The loader fetches one thread and its messages |

---

<a name="step-1"></a>

## Step 1: Set up Supabase database with schema and seed data

### 🤔 Problem to solve

Right now, your chatbot application uses hardcoded mock data stored directly in your JavaScript files. This works for learning the basics, but has major limitations:

- Data disappears when you refresh the page
- You can't share data between users or devices
- There's no way to save new conversations
- Mock data clutters your code

You need a real database to store conversations persistently. But setting up a database traditionally requires installing PostgreSQL locally, managing database credentials, handling connections, and deploying infrastructure. That's a lot of work before you even start coding!

**Supabase solves this** by providing a hosted PostgreSQL database with a simple REST API, so you can focus on building features instead of managing servers.

### 💡 Key concepts

**Supabase** is a Backend-as-a-Service (BaaS) that gives you:

- A fully managed PostgreSQL database (a powerful, industry-standard relational database)
- Automatic REST API generation from your database tables
- Authentication, storage, and real-time subscriptions (we'll use these later)
- A web dashboard for managing your data

**Database schema** defines the structure of your data:

- **Tables** store collections of related data (like `threads` and `messages`)
- **Columns** define what information each record contains (like `title`, `content`)
- **Primary keys** uniquely identify each record (we'll use UUIDs)
- **Foreign keys** create relationships between tables (each message belongs to a thread)
- **Constraints** enforce data rules (messages must be either 'user' or 'bot' type)
- **Indexes** speed up queries on frequently accessed columns

**Environment variables** keep sensitive information (like API keys) secure:

- Store credentials outside your code
- Never commit them to version control
- Different values for development, staging, and production

### 📝 Your task

For this step, complete setup instructions have been provided for you in the [`supabase/README.md`](../blob/2ddeacd91405d4254425bc559916b8cbcdeef75d/supabase/README.md) file.

**Navigate to the README file in the reference commit below and follow all the setup instructions there.**

The README will guide you through:

1. Creating a Supabase account and project
2. Running the database schema (creating tables with proper relationships)
3. Adding test data with realistic conversation threads
4. Configuring environment variables for secure API access
5. Verifying that everything is set up correctly

Take your time to read through each section carefully and complete all the steps in order.

> ⚠️ **Before you create `frontend/.env`**, add `.env` to `frontend/.gitignore` (the reference commit shows how). Otherwise your keys end up on GitHub with your next commit.

### ✅ Reference implementation

**🔗 Commit**: [`67d2766`](6/commits/67d2766e80afa305412db93ac014d0f26f294a7f)

**📖 Start here**: [supabase/README.md](../blob/67d2766e80afa305412db93ac014d0f26f294a7f/supabase/README.md)

This commit includes:

- `supabase/README.md`: Complete step-by-step setup instructions
- `supabase/schema.sql`: Creates tables with proper types, constraints, and indexes
- `supabase/seed.sql`: Inserts test data with fixed UUIDs for predictable references
- `frontend/.env.example`: Template for required environment variables
- `frontend/.gitignore`: Updated to exclude `.env` files

### 💬 Discussion points

1. **Objects and relationships:** `threads` and `messages` are two kinds of object, and `thread_id` connects them. If you've done an object breakdown (e.g. ORCA) of your own app, how do its objects, attributes and relationships map onto tables, columns and foreign keys?

2. **What's the benefit of `ON DELETE CASCADE`?**

   - What happens to a thread's messages when the thread is deleted — with and without it?

### 🧪 Test your solution

After running your schema and seed scripts in Supabase:

1. **Verify tables exist:**

   - Go to Table Editor in Supabase dashboard
   - You should see `threads` and `messages` tables

2. **Check the data:**

   - Click on each table to view the data
   - Verify you have multiple threads with messages

3. **Test the relationship:**

   - Try deleting a thread in the Table Editor
   - Check that its messages were automatically deleted (CASCADE)

4. **Run verification queries** in the SQL Editor:

```sql
-- Count threads and messages
SELECT
  (SELECT COUNT(*) FROM threads) as thread_count,
  (SELECT COUNT(*) FROM messages) as message_count;

-- View a thread with its messages
SELECT t.title, m.type, m.content
FROM threads t
JOIN messages m ON m.thread_id = t.id
WHERE t.title LIKE '%pizza%'
ORDER BY m.created_at;
```

---

<a name="step-2"></a>

## Step 2: Fetch thread list from Supabase REST API

### 🤔 Problem to solve

Your database is ready with real data, but your React app is still using hardcoded mock data in the `layout.jsx` file. The sidebar shows static threads that have nothing to do with your database.

You need to:

- Connect your React app to Supabase
- Fetch the real thread list from your database
- Display it in the sidebar
- Make sure new threads appear automatically when added to the database

This introduces a fundamental web development pattern: **client-server communication via HTTP APIs**.

### 💡 Key concepts

**REST API** (Representational State Transfer):

- A way for applications to communicate over HTTP
- Uses standard HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE
- Supabase automatically creates REST endpoints for your database tables

**Supabase REST API structure:**

```
https://your-project.supabase.co/rest/v1/table_name
```

**Query parameters** modify what data you get back:

- `select=*` - Get all columns (or specify: `select=id,title`)
- `order=column.asc` or `.desc` - Sort results
- `limit=10` - Limit number of results
- Filters like `id=eq.123` - Match specific values

**HTTP headers** provide metadata about requests:

- `apikey`: Your Supabase public API key (for authentication)
- `Authorization`: Bearer token (same key, different format)
- Both are required for Supabase requests

**Environment variables in Vite:**

- Access with `import.meta.env.VITE_VARIABLE_NAME`
- Only variables prefixed with `VITE_` are exposed to the browser
- Undefined if `.env` file isn't loaded (restart dev server after creating it!)

### 📝 Your task

Modify the `clientLoader` function in `frontend/app/routes/layout.jsx` to:

1. **Read Supabase credentials** from environment variables
2. **Construct the API URL** to fetch all threads, sorted by creation date (newest first)
3. **Make an HTTP request** with proper authentication headers
4. **Handle errors** gracefully if the request fails
5. **Parse the response** and return the thread data

The `clientLoader` function runs before the component renders, so the data will be ready when the sidebar displays.

### 🔍 Implementation hints

**Constructing the URL:**

- Base URL: `${supabaseUrl}/rest/v1/threads`
- Add query parameters with `?` and `&`: `?select=*&order=created_at.desc`
- `desc` means descending (newest first), `asc` means ascending (oldest first)

**Making the fetch request:**

```javascript
const response = await fetch(url, {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  },
});
```

**Error handling:**

- Check `response.ok` (true if status is 200-299)
- Throw an error if the request failed
- React Router will catch thrown errors and display them

**Parsing JSON:**

- Use `await response.json()` to parse the response body
- Supabase returns an array of objects matching your table rows

**Removing mock data:**

- Delete the old `mockThreads` array
- Remove the simulated delay (`setTimeout`)

### ✅ Reference implementation

**🔗 Commit**: [`78f4362`](6/commits/78f4362dd121f30e696d2ac85f442406b715ff40)

This commit demonstrates:

- Reading environment variables with `import.meta.env`
- Constructing Supabase REST API URLs with query parameters
- Setting required authentication headers
- Error handling with `response.ok`
- Replacing mock data with real API calls

### 💬 Discussion points

1. **Why use query parameters instead of fetching all data and sorting in JavaScript?**

   - Think about performance with 1,000 or 10,000 threads
   - What work are you offloading to the database?

2. **When does the `clientLoader` run?**
   - Initial page load, navigation, or both?
   - What triggers a re-fetch of the data?

### 🧪 Test your solution

1. **Verify environment variables are loaded:**

   - Add a `console.log(import.meta.env.VITE_SUPABASE_URL)` temporarily
   - It should show your Supabase URL, not `undefined`
   - If undefined, did you restart your dev server after creating `.env`?

2. **Check the network request:**

   - Open browser DevTools → Network tab
   - Refresh the page
   - Look for a request to `/rest/v1/threads`
   - Click it to inspect the headers, response, and status code

3. **Verify the sidebar displays real data:**

   - The sidebar should show thread titles from your database
   - They should match what you see in the Supabase Table Editor
   - The newest threads should appear first

4. **Test error handling:**

   - Temporarily change the URL to `threads_typo`
   - You should see an error message, not a blank screen
   - Fix the URL and verify it works again

5. **Add a new thread in Supabase:**
   - Go to Table Editor → threads → Insert row
   - Add a new thread with a title
   - Refresh your app - the new thread should appear!

---

<a name="step-3"></a>

## Step 3: Fetch thread messages from Supabase REST API

### 🤔 Problem to solve

Clicking on a thread in the sidebar loads a conversation view, but it still shows mock data with generic placeholder messages. You need to:

- Fetch the actual messages for the selected thread from Supabase
- Display them in chronological order
- Show the thread's title instead of its ID
- Handle threads that don't exist (404 errors)

This requires **filtering data** and making **multiple related API calls** to fetch data from different tables that are connected by foreign keys.

### 💡 Key concepts

**Filtering with Supabase query parameters:**

- `column=eq.value` - Equals filter (most common)
- `column=gt.5` - Greater than
- `column=like.*search*` - Pattern matching
- Multiple filters: `?name=eq.John&age=gt.21`

**Foreign key relationships:**

- Messages have a `thread_id` column that references `threads.id`
- To get all messages for a thread: filter where `thread_id=eq.{threadId}`
- This is a one-to-many relationship (one thread, many messages)

**Supabase array responses:**

- Even when filtering by ID (which should return one result), Supabase returns an array
- You need to extract the first element: `const thread = threadData[0]`
- This is consistent API design - you always get an array from `select` queries

**404 handling in React Router:**

- Throw a `Response` object with status 404 from the loader
- React Router's error boundary will catch it and render an error page
- This is better than showing a broken UI with missing data

**Route parameters:**

- The URL pattern `/chat/:threadId` captures the ID in `params.threadId`
- Use this parameter to filter which thread's messages to fetch

### 📝 Your task

Modify the `clientLoader` function in `frontend/app/routes/chat-thread.jsx` to:

1. **Fetch the thread metadata:**

   - Use `id=eq.{threadId}` filter to get the specific thread
   - Extract the thread from the array response
   - Throw a 404 error if the thread doesn't exist

2. **Fetch the thread's messages:**

   - Use `thread_id=eq.{threadId}` filter to get messages for this thread
   - Order by `created_at.asc` (oldest first, chronological order)

3. **Return both pieces of data:**
   - Return an object with both `thread` and `messages`
   - Update the component to use `thread.title` instead of `threadId`

### 🔍 Implementation hints

**Accessing route parameters:**

```javascript
export async function clientLoader({ params }) {
  const threadId = params.threadId; // or directly: params.threadId
}
```

**Filtering for a specific thread:**

```
${supabaseUrl}/rest/v1/threads?id=eq.${params.threadId}&select=*
```

**Extracting the first element:**

```javascript
const threadData = await response.json(); // Array of results
const thread = threadData[0]; // Get the first (should be only) item
```

**Throwing 404 errors:**

```javascript
if (!thread) {
  throw new Response("Thread not found", { status: 404 });
}
```

**Filtering messages by thread_id:**

```
${supabaseUrl}/rest/v1/messages?thread_id=eq.${params.threadId}&select=*&order=created_at.asc
```

**Sequential API calls:**

- Fetch thread first, check it exists, then fetch messages
- Use `await` for each fetch to wait for results
- Both calls use the same authentication headers

**Updating the component:**

- Change `const { threadId, messages }` to `const { thread, messages }`
- Change `<h2>Conversation Thread #{threadId}</h2>` to `<h2>{thread.title}</h2>`

### ✅ Reference implementation

**🔗 Commit**: [`2ddeacd`](6/commits/2ddeacd91405d4254425bc559916b8cbcdeef75d)

This commit shows:

- Filtering with the `eq` (equals) operator
- Making multiple sequential API calls for related data
- Handling array responses and extracting single items
- Throwing 404 errors for missing resources
- Using thread metadata to display the title

### 💬 Discussion points

1. **Why does Supabase return an array even when filtering by primary key?**

   - Wouldn't a single object be more convenient?
   - What's the benefit of consistent array responses?

2. **Why throw a `Response` object instead of a regular `Error`?**
   - What's special about the `Response` object?
   - How does React Router handle each differently?

### 🧪 Test your solution

1. **Verify messages display correctly:**

   - Click on a thread in the sidebar
   - You should see the real messages from your database
   - They should alternate between user and bot
   - They should be in chronological order (oldest first)

2. **Check the thread title displays:**

   - The header should show the thread's actual title
   - Not "Conversation Thread #123..." anymore

3. **Test with different threads:**

   - Click through several threads in the sidebar
   - Each should display its own unique messages
   - The URL should change to reflect the thread ID

4. **Test 404 handling:**

   - Manually navigate to a non-existent thread: `/chat/99999999-9999-9999-9999-999999999999`
   - You should see an error message
   - The app shouldn't crash or show broken UI

5. **Inspect network requests:**

   - Open DevTools → Network
   - Click on a thread
   - You should see TWO requests:
     - One to `/rest/v1/threads?id=eq.{id}`
     - One to `/rest/v1/messages?thread_id=eq.{id}`
   - Check the responses - they should contain your data

6. **Add a message in Supabase:**
   - Go to Table Editor → messages → Insert row
   - Add a message to an existing thread
   - Refresh the thread view - your new message should appear!

---

## 🎉 Congratulations!

You've successfully integrated Supabase into your React Router application! You've learned how to:

✅ Set up a PostgreSQL database with proper schema design  
✅ Create relationships between tables with foreign keys  
✅ Use environment variables to securely store API credentials  
✅ Make HTTP requests to a REST API with authentication  
✅ Filter and sort data using query parameters  
✅ Make multiple sequential API calls for related data  
✅ Replace mock data with real database-backed data

Your chatbot now displays real conversations from a hosted database. Any changes you make in the Supabase dashboard immediately appear in your app and vice-versa.

## 🚀 Extra features if you have time

Ready for more challenges? Try these:

1. **Optimize the thread view with resource embedding:**

   - Research Supabase's resource embedding feature
   - Fetch the thread and its messages in a single API call
   - Compare the network traffic before and after

2. **Display timestamps:**

   - Show when each message was created
   - Format timestamps with a library like `date-fns`
   - Show relative times ("2 hours ago")

3. **Add pagination to the thread list:**

   - What happens with 100 or 1,000 threads?
   - Implement `limit` and `offset` query parameters
   - Add "Load more" functionality

## 📚 Additional resources

- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [PostgreSQL Data Types](https://neon.com/postgresql/postgresql-tutorial/postgresql-data-types)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
