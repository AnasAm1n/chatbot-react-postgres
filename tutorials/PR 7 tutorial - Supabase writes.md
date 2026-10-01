# Data Mutations with React Router - Step-by-Step Tutorial

## 🎯 Learning objectives

By the end of this tutorial, you will be able to:

- **Save data** with React Router's `<Form>` and a `clientAction`
- **Explain automatic revalidation**: why the screen updates itself after a form is submitted
- **Validate input** and show error messages with `useActionData()`
- **Create a record and navigate to it** with `redirect()`
- Going further: **delete without navigating** with `useFetcher`, and **handle errors** with an `ErrorBoundary`

## 📋 Prerequisites

- **[PR #6](../pull/6) completed**: the app reads threads and messages from your Supabase database

## 📑 Table of contents

1. [Create new messages with clientAction](#step-1)
2. [Add error handling and validation](#step-2)
3. [Create new threads with redirect](#step-3)
4. [⭐ Going further: Delete threads with useFetcher](#step-4)
5. [⭐ Going further: Handle errors with ErrorBoundary](#step-5)

## 🗺️ Overview

In this tutorial, you'll learn how to implement **data mutations** (create, update, delete operations) using React Router's modern data APIs. You'll move from read-only data fetching to full CRUD operations with a Supabase backend.

By the end of this tutorial, you'll understand:

- How `clientAction` functions handle form submissions
- The relationship between `Form` components and actions
- Automatic data revalidation after mutations
- Error handling and user feedback patterns
- Non-navigating mutations with `useFetcher`
- React Router's ErrorBoundary for graceful error handling

Steps 1–3 are the core: reading, creating and navigating. Steps 4–5 go further, for when you've finished the core steps.

## 🧑‍💻 Today's starting point

If you haven't fully completed the prior tutorials, you may copy the starting point of this tutorial by running this command in the root of your local repository:

```bash
npx degit --force bewildergeist/chatbot-react-postgres#pr-7-start
```

**Important**: Make a commit of this initial version before you start changing anything.

### Where the code lives

All paths are inside `frontend/`:

| File | What happens to it |
| --- | --- |
| `app/components/Chat.jsx` | `ChatInput` swaps `<form onSubmit>` for React Router's `<Form>` |
| `app/routes/chat-thread.jsx` | Gets a `clientAction` that saves new messages |
| `app/routes/chat-new.jsx` | Gets a `clientAction` that creates a thread and redirects to it |
| `app/routes/layout.jsx` | Step 4: gets a `clientAction` that deletes threads |
| `app/components/Sidebar.jsx` | Step 4: the delete button uses `useFetcher` |
| `app/app.css` | Styles for error messages |

---

<a name="step-1"></a>

## Step 1: Create new messages with clientAction

### 🤔 Problem to solve

Currently, your chat application can display messages from the database, but users can't add new messages. When someone types a message and clicks "Send", nothing happens (or it only updates local state without persisting to the database).

You need to:

- Handle form submissions
- Save new messages to Supabase
- Automatically refresh the message list after submission

### 💡 Key concepts

**clientAction**: A function that handles data mutations (POST, PUT, DELETE requests). It runs when a `Form` component with `method="post"` is submitted.

**Automatic revalidation**: After a `clientAction` completes, React Router automatically re-runs all active loaders, fetching fresh data from the server.

**Form component**: React Router's `Form` replaces the standard HTML `<form>`. When submitted with `method="post"`, it triggers the route's `clientAction` instead of a browser navigation.

### 📝 Your task

Implement message creation in the chat thread route:

1. **Add a `clientAction` function** to `chat-thread.jsx` that:

   - Extracts the message content from the form data
   - Creates a message object with `thread_id`, `type: "user"`, and `content`
   - POSTs to the Supabase `/messages` endpoint
   - Returns a success indicator

2. **Update the `ChatInput` component** in `Chat.jsx` to:

   - Replace the HTML `<form>` with React Router's `Form` component
   - Set `method="post"` to trigger the `clientAction`
   - Remove local state management and callback props
   - Add the `required` attribute to the textarea for basic validation

3. **Update the route component** to remove the old callback-based approach

### 🔍 Implementation hints

**Getting form data in clientAction**:

```javascript
const formData = await request.formData();
const fieldValue = formData.get("fieldName");
```

**POST request structure**:

- Send JSON in the request body
- Include Supabase authentication headers (`apikey` and `Authorization`)
- Include `"Content-Type": "application/json"`, so Supabase knows the body is JSON

**Form component**:

```javascript
import { Form } from "react-router";
// Use <Form method="post"> instead of <form>
```

### ✅ Reference implementation

**🔗 Commit**: [`119fa16`](7/commits/119fa1614cb9adc69718ebd6116a398cf98091e1)

This commit shows one way to implement message creation using `clientAction` and React Router's `Form` component.

### 💬 Discussion points

1. **Why does the message list update automatically after submission?** Consider the relationship between `clientAction` and `clientLoader`.

2. **Compare with the `handleSubmit` function you wrote in PR #3.** Which of its lines does `<Form>` + `clientAction` make unnecessary? Where did the `useState` and the `onAddMessage` callback go?

3. **Where does the form data come from?** Trace the flow from the user typing in the textarea to the data appearing in `clientAction`.

### 🧪 Test your solution

1. Open an existing chat thread
2. Type a message in the input field
3. Click "Send"
4. Verify the message appears in the chat immediately
5. Refresh the page and confirm the message persists (it's saved to Supabase)
6. Check the Network tab in DevTools to see the POST request

---

<a name="step-2"></a>

## Step 2: Add error handling and validation

### 🤔 Problem to solve

Your message creation works, but what happens if:

- The user submits an empty message?
- The network request fails?
- The Supabase API returns an error?

Without error handling, these scenarios will either crash the app or silently fail, leaving users confused. You need a way to:

- Validate input before sending it to the API
- Catch and handle network errors gracefully
- Display meaningful error messages to users

### 💡 Key concepts

**useActionData hook**: Provides access to the data returned from `clientAction`. Use this to communicate validation errors or success status to the UI.

**Error returns vs. throwing errors**: For user-facing errors (validation, known API errors), return an error object. For unexpected errors, you can still throw to trigger the ErrorBoundary.

**Form validation**: Validate with both HTML5 attributes and in `clientAction` for the best UX. And of course server-side in your backend too (in this case, Supabase).

### 📝 Your task

Add robust error handling to your message creation:

1. **Update the `clientAction`** to:

   - Validate that the message content is not empty (after trimming whitespace)
   - Return an error object like `{ error: "Message cannot be empty" }` for validation failures
   - Wrap the fetch call in a try-catch block to handle network errors
   - Return error objects for API failures instead of throwing

2. **Update the route component** to:

   - Import and use the `useActionData` hook
   - Conditionally display error messages when `actionData?.error` exists

3. **Add error styling** to `app.css` for the error message display

### 🔍 Implementation hints

**Validation pattern**:

```javascript
if (!value || !value.trim()) {
  return { error: "Validation message" };
}
```

**Try-catch for network errors**:

```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    return { error: `Failed: ${response.status}` };
  }
  return { success: true };
} catch (error) {
  return { error: error.message };
}
```

**Displaying errors in the component**:

```javascript
const actionData = useActionData();
// Later in JSX:
{
  actionData?.error && <div className="error-message">{actionData.error}</div>;
}
```

### ✅ Reference implementation

**🔗 Commit**: [`527cf92`](7/commits/527cf92d9ad57275517646d1108a4569e90642c1)

This commit demonstrates comprehensive error handling for the message creation action.

### 💬 Discussion points

1. **Why trim the message content?** What edge cases does this handle?

2. **What's the difference between returning an error and throwing an error?** When should you use each approach?

3. **Why validate in `clientAction` when you already have HTML5 validation?** Are there any scenarios where HTML5 validation might not be sufficient?

### 🧪 Test your solution

1. Try removing the `required` attribute and submitting an empty message (it should show an error)
2. Try submitting only whitespace (should also show an error)
3. Temporarily change the Supabase URL to an invalid value and test error handling
4. Verify that error messages disappear when you successfully submit a valid message
5. Check that the error message is styled appropriately (red background, readable)

---

<a name="step-3"></a>

## Step 3: Create new threads with redirect

### 🤔 Problem to solve

Users can add messages to existing threads, but they can't create new conversations. The `/chat/new` route currently manages messages only in local state, not in the database.

Creating a new thread is more complex than creating a message because you need to:

1. Create a thread record first (to get a thread ID)
2. Create the first message with that thread ID
3. Navigate the user to the new thread so they can continue chatting

This requires **sequential operations** and **post-action navigation**.

### 💡 Key concepts

**Sequential API calls**: Sometimes one API call depends on the result of another. In this case, you need the thread ID before creating the first message.

**redirect() function**: Returns a redirect response from `clientAction` to navigate the user to a different route.

**Prefer header**: The `Prefer: return=representation` header tells Supabase to return the created resource in the response, so you can access the generated ID.

### 📝 Your task

Implement thread creation in the `/chat/new` route:

1. **Add a `clientAction`** to `chat-new.jsx` that:

   - Validates the message content (can't be empty)
   - Generates a thread title from the first message (truncate to 50 characters)
   - Creates the thread in Supabase (POST to `/threads`)
   - Extracts the thread ID from the response
   - Creates the first message with that thread ID
   - Redirects to the new thread using `redirect()`

2. **Update the component** to:
   - Remove local state management
   - Use `useActionData` to display errors
   - Render an empty `ChatMessages` and the `ChatInput` form

### 🔍 Implementation hints

**Creating dependent resources**:

```javascript
// Step 1: Create parent resource — and ask Supabase to send it back
const response1 = await fetch(url1, {
  method: "POST",
  headers: {
    // ...apikey, Authorization and Content-Type as usual
    Prefer: "return=representation",
  },
  body: JSON.stringify(parentData),
});
const [created] = await response1.json(); // Returns array with one item

// Step 2: Create child resource using parent's ID
const response2 = await fetch(url2, {
  body: JSON.stringify({ parent_id: created.id, ...otherData }),
});

// Step 3: Redirect to the new resource
return redirect(`/path/${created.id}`);
```

**Generating a title from content**:

```javascript
const title =
  content.trim().length > 50
    ? content.trim().slice(0, 50) + "..."
    : content.trim();
```

**Import redirect**:

```javascript
import { redirect } from "react-router";
```

### ✅ Reference implementation

**🔗 Commit**: [`21f0592`](7/commits/21f05920052f83a43ae4bf26938f173cdb59560b)

This commit shows how to implement multi-step mutations with sequential API calls and post-action navigation.

### 💬 Discussion points

1. **What happens if the thread is created successfully but the message creation fails?** How would you handle this edge case in a production app?

2. **Why generate the title from the first message instead of asking the user for a title?** Consider UX and friction in the user flow.

### 🧪 Test your solution

1. Click "Start New Chat" in the sidebar
2. Type a message and click "Send"
3. Verify you're redirected to the new thread URL (e.g., `/chat/123`)
4. Confirm the thread appears in the sidebar with a generated title
5. Try creating a thread with a very long first message (over 50 chars) and verify the title is truncated
6. Test error handling by submitting an empty message

---

<a name="step-4"></a>

## ⭐ Going further — Step 4: Delete threads with useFetcher

> Steps 4 and 5 go beyond the core of this tutorial. Do them when you've finished steps 1–3.

### 🤔 Problem to solve

Users need the ability to delete old conversations. But there's a challenge: the delete button is in the sidebar, which is part of the layout component. The traditional approach would require:

- Callback prop drilling from layout → sidebar → thread list → thread item
- Managing loading states across multiple components
- Manually updating the UI after deletion

Additionally, when you click a delete button, you want to **stay on the current page**, not navigate away. This is where `useFetcher` shines.

### 💡 Key concepts

**useFetcher hook**: Enables mutations without navigation. Returns a `fetcher` object with its own `Form`, `state`, and `formData` for optimistic UI updates.

**Intent pattern**: When one route needs to handle multiple types of actions (create, update, delete), use a hidden input field called "intent" to distinguish between them.

**Pending UI**: Using `fetcher.state` and `fetcher.formData`, you can show loading states (like a spinner) while the mutation is in progress.

**No prop drilling**: Components can directly submit to parent route actions using `fetcher.Form`, eliminating the need to pass callbacks through multiple component layers.

### 📝 Your task

Implement thread deletion without navigation:

1. **Add a `clientAction`** to `layout.jsx` that:

   - Extracts `intent` and `threadId` from form data
   - Checks if intent is "delete"
   - Sends a DELETE request to Supabase
   - Returns success or error

2. **Update `ChatThreadItem` component** in `Sidebar.jsx` to:

   - Import and call `useFetcher()` to get a fetcher instance
   - Replace the delete button with `<fetcher.Form method="post">`
   - Add hidden inputs for `intent="delete"` and the thread ID
   - Show loading state (e.g., "···") when `fetcher.state !== "idle"`
   - Remove the old callback prop and click handler

3. **Simplify the component chain** by removing callback props from `ChatThreadsList` and `Sidebar`

### 🔍 Implementation hints

**Using useFetcher**:

```javascript
import { useFetcher } from "react-router";

function Component() {
  const fetcher = useFetcher();

  const isLoading = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post">
      <input
        type="hidden"
        name="intent"
        value="delete"
      />
      <input
        type="hidden"
        name="id"
        value={itemId}
      />
      <button disabled={isLoading}>{isLoading ? "..." : "Delete"}</button>
    </fetcher.Form>
  );
}
```

**Intent pattern in action**:

```javascript
export async function clientAction({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    // Handle deletion
  } else if (intent === "update") {
    // Handle update
  }
}
```

**DELETE request to Supabase**:

```javascript
await fetch(`${url}/threads?id=eq.${threadId}`, {
  method: "DELETE",
  headers: {
    /* auth headers */
  },
});
```

### ✅ Reference implementation

**🔗 Commit**: [`bda01bc`](7/commits/bda01bc4bb018c8f1de69b68ab2118ed47c2f6f1)

This commit demonstrates non-navigating mutations with `useFetcher`, the intent pattern, and eliminating callback prop drilling.

### 💬 Discussion points

1. **Why use `useFetcher` instead of a regular `Form`?** What would happen if you used a regular Form for deletion?

2. **Why is the action in `layout.jsx` and not in `Sidebar.jsx`?** Consider where data loaders and actions must be defined in React Router.

### 🧪 Test your solution

1. Open a thread in the main view
2. Click the × button next to that thread in the sidebar
3. Observe the button shows "···" briefly while deleting (optionally throttle network in DevTools to see this)
4. Verify the thread disappears from the sidebar
5. Create a new thread, delete it, and confirm it works repeatedly
6. Check your Supabase database to confirm messages are also deleted (CASCADE)

---

<a name="step-5"></a>

## ⭐ Going further — Step 5: Handle errors with ErrorBoundary

### 🤔 Problem to solve

There's a critical edge case in your app: What happens if a user is viewing a thread, then deletes it? Currently:

1. The layout's loader revalidates and removes the thread from the sidebar ✓
2. The chat-thread loader tries to fetch a thread that no longer exists ✗
3. The entire app UI is replaced with a 404 page

We would prefer a UI that more gracefully helps the user back on track. You need a way to handle situations where:

- A thread is deleted while being viewed
- A user navigates to a non-existent thread ID
- API requests fail for any reason

### 💡 Key concepts

**ErrorBoundary**: A special component export that React Router renders when errors occur in a route's loader, action, or component. It's the declarative way to handle errors.

**useRouteError hook**: Inside an ErrorBoundary, this hook provides access to the error object that was thrown.

**HTTP status codes**: Errors can have a `status` property (like 404, 500) that you can check to provide specific error messages.

**Graceful degradation**: Even when errors occur, the rest of the app continues working. The ErrorBoundary contains the problem to one (nested) route, so the entire UI doesn't have to break.

### 📝 Your task

Add error handling to the chat thread route:

1. **Update the `clientLoader`** in `chat-thread.jsx` to:

   - Check if the thread fetch returns an empty array (thread not found)
   - Throw a 404 Response with a descriptive message
   - This triggers the ErrorBoundary instead of rendering with invalid data

2. **Export an `ErrorBoundary` component** from `chat-thread.jsx` that:
   - Uses `useRouteError()` to access the error
   - Checks if `error.status === 404` for special handling
   - Displays a user-friendly message explaining what happened
   - Provides a link to start a new chat for easy recovery
   - Uses the same layout as the normal route (chat-container, chat-thread-header)

### 🔍 Implementation hints

**Throwing 404 errors in loaders**:

```javascript
if (!dataFound) {
  throw new Response("Not Found", { status: 404 });
}
```

**ErrorBoundary structure**:

```javascript
export function ErrorBoundary() {
  const error = useRouteError();
  const isNotFound = error?.status === 404;

  return (
    <div>
      <h2>{isNotFound ? "Not Found" : "Error"}</h2>
      <p>{isNotFound ? "Custom 404 message" : error?.message}</p>
    </div>
  );
}
```

**Import useRouteError**:

```javascript
import { useRouteError } from "react-router";
```

### ✅ Reference implementation

**🔗 Commit**: [`bbe5995`](7/commits/bbe5995d60bb7859f3bea90119b8af19d6057cca)

This commit shows how to implement ErrorBoundary for graceful error handling.

### 💬 Discussion points

1. **Why throw an error in the loader rather than returning an error object?** Consider the difference between expected validation errors and unexpected failures.

2. **What happens to the sidebar when the ErrorBoundary renders?** Why does the rest of the app keep working?

### 🧪 Test your solution

1. Open a thread in the main view
2. Delete that same thread using the × button in the sidebar
3. Observe the ErrorBoundary renders with a "Thread Not Found" message
4. Click "Start a new chat" to verify the recovery link works
5. Manually type a non-existent thread ID in the URL (e.g., `/chat/999999`)
6. Verify the 404 error is displayed appropriately
7. Test that the sidebar still works (you can click other threads)

---

## 🎉 Congratulations!

You've implemented a complete CRUD (Create, Read, Update, Delete) application using React Router's modern data APIs! You've learned:

☑️ **clientAction** functions for handling data mutations  
☑️ **Form** component with automatic action invocation  
☑️ **Automatic revalidation** for seamless data updates  
☑️ **useActionData** for error handling and user feedback  
☑️ **Sequential operations** and post-action navigation with `redirect()`  
☑️ **useFetcher** for non-navigating mutations  
☑️ **Intent pattern** for multiple actions in one route  
☑️ **ErrorBoundary** for graceful error handling

Your chat application now:

- Persists all data to Supabase
- Provides instant feedback on user actions
- Handles errors gracefully with helpful messages
- Uses modern, declarative patterns instead of manual state management

## 🚀 Extra features if you have time

1. **Edit thread titles**: Add an edit button that allows renaming threads (hint: use `useFetcher` and the intent pattern)

2. **Delete messages**: Allow users to delete individual messages (consider UI/UX: should there be a confirmation?)

3. **Optimistic UI for deletion**: Make thread deletion feel instant by removing it from the UI before the API call completes (hint: `fetcher.state === "submitting"`)

4. **Message timestamps**: Show the `created_at` timestamps on messages in a user-friendly format

5. **Empty state handling**: Show a helpful message when a thread has no messages, or when the sidebar has no threads

6. **Toast notifications**: Show brief success/error notifications instead of (or in addition to) inline error messages

7. **Keyboard shortcuts**: Add keyboard support (e.g., Cmd+Enter to send, Escape to clear input)

## 📚 Additional resources

- [React Router: Actions Documentation](https://reactrouter.com/start/framework/actions)
- [React Router: useFetcher Hook Reference](https://reactrouter.com/api/hooks/useFetcher)
- [React Router: ErrorBoundary Documentation](https://reactrouter.com/start/framework/route-module#errorboundary)
- [React Router: Form Component API](https://reactrouter.com/api/components/Form)
- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [HTTP Status Codes Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
