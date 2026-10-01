# Data fetching with clientLoader - Step-by-step tutorial

## 🎯 Learning objectives

By the end of this tutorial, you will be able to:

- **Load data before a screen renders** with a `clientLoader`, and read it with `useLoaderData()`
- **Replace `useState` with a loader** for data that comes from outside the component
- **Decide which route loads which data**: the layout (shared by every page) or the page itself
- **Highlight the active link** in a list with `NavLink`

## 📋 Prerequisites

- **[PR #4](../pull/4) completed**: routes for `/chat/new` and `/chat/:threadId`
- **`async`/`await`** basics: an `async` function can `await` a promise

## 📑 Table of contents

1. [Introduce clientLoader for data fetching in chat threads](#step-1)
2. [Load thread list via clientLoader in layout route](#step-2)
3. [Use NavLink to highlight active thread in sidebar](#step-3)
4. [⭐ Extra: Add pending state animation to thread links](#step-4)

## 🗺️ Overview

Until now, the chatbot's data has lived in `useState`, with hardcoded starting values inside the component files. Real data lives in a database, and fetching it takes time. React Router gives every route a place to fetch its data _before_ the screen renders: a `clientLoader` function. In this tutorial you'll move the data out of `useState` and into loaders — still with mock data for now. The next tutorial swaps the mock data for a real database.

You'll learn how to:

- Transform components from using local state to loader-provided data
- Understand the loader lifecycle and when loaders run
- Implement parent-child loader relationships
- Provide visual feedback during navigation and data loading

By the end, you'll have converted a basic chat application from client-side state management to React Router's declarative data loading pattern, with visual feedback for navigation states.

## 🧑‍💻 Today's starting point

If you haven't fully completed the prior tutorials, you may copy the starting point of this tutorial by running this command in the root of your local repository:

```bash
npx degit --force bewildergeist/chatbot-react-postgres#pr-5-start
```

**Important**: Make a commit of this initial version before you start changing anything.

### Where the code lives

All paths are inside `frontend/`:

| File | What happens to it |
| --- | --- |
| `app/routes/chat-thread.jsx` | Gets a `clientLoader` that returns the thread's messages |
| `app/routes/layout.jsx` | Gets a `clientLoader` that returns the thread list |
| `app/components/Sidebar.jsx` | `Link` becomes `NavLink`, to highlight the active thread |
| `app/app.css` | Styles for the active (and, in step 4, pending) link |

---

<a name="step-1"></a>

## Step 1: Introduce clientLoader for data fetching in chat threads

### 🤔 Problem to solve

Currently, the chat thread component uses `useState` to manage messages data locally. This means the component renders first, then manages its own data. This approach has several drawbacks:

- You need to handle loading states manually
- Data isn't guaranteed to be available when the component renders
- Each component must implement its own data fetching logic
- No coordination between URL changes and data loading

**Your challenge**: Transform the chat thread route to use React Router's `clientLoader` pattern instead of local state management.

### 💡 Key concepts

**clientLoader function:**

- An async function exported from a route file
- Runs _before_ the route component renders
- Receives route `params` (like `threadId`) and the `request` object
- Returns data that becomes available via the `useLoaderData()` hook

**useLoaderData hook:**

- Gives the component whatever `clientLoader` returned
- Data is guaranteed to be available when the component renders
- Eliminates the need for loading states within the component

**Loader lifecycle:**

- Loader runs when navigating to the route
- Loader runs on page refresh
- Loader runs when React Router revalidates data (after mutations)

### 📝 Your task

Transform the `chat-thread.jsx` route to use the `clientLoader` pattern:

1. **Export a `clientLoader` function** that:

   - Is async and receives `{ params }` as its argument
   - Extracts `threadId` from `params`
   - Simulates a network delay (500ms) using `setTimeout` with a Promise
   - Returns mock message data that includes the `threadId` and a `messages` array
   - Each message should have: `id`, `type` ("user" or "bot"), and `content`

2. **Update the component** to:
   - Remove the `useState` import and usage
   - Import and use `useLoaderData` instead of `useParams`
   - Extract both `threadId` and `messages` from the loader data
   - Keep the `addMessage` function for now (just log a message that mutations will be implemented later)

### 🔍 Implementation hints

<details>
<summary>How do I create a simulated delay?</summary>

Use `setTimeout` wrapped in a Promise:

```javascript
await new Promise((resolve) => setTimeout(resolve, 500));
```

</details>

<details>
<summary>What should the loader return?</summary>

Return an object with the data your component needs:

```javascript
return {
  threadId: params.threadId,
  messages: [...] // array of message objects
};
```

</details>

<details>
<summary>How do I access loader data in the component?</summary>

```javascript
const { threadId, messages } = useLoaderData();
```

</details>

### 💬 Discussion points

1. **Why is data loading separated from the component?** What's the advantage compared to keeping the data in `useState` inside the component, as you did in PR #3?

2. **What happens during the time between clicking a link and the loader completing?** How does the user experience change?

3. **When would you still use `useState` instead of a loader?** Can you think of types of data that should remain in component state?

### 🧪 Test your solution

- Navigate between different thread IDs in the URL
- Check that the messages display the correct `threadId`
- Observe the 500ms delay before the new thread renders
- Open the browser's Network tab - notice no actual network requests (it's mock data)
- Try refreshing the page - the loader should run again

### ✅ Reference implementation

**🔗 Commit**: [`55ec7b1`](5/commits/55ec7b1beb6c75fa689504154540a8f7d697ee62)

After attempting the implementation yourself, review the commit to see one approach to solving this step. Notice how:

- The `clientLoader` function is exported separately from the component
- The loader returns structured data as a plain object
- The component code is simplified by removing state management
- Comments explain the loader lifecycle and key concepts

---

<a name="step-2"></a>

## Step 2: Load thread list via clientLoader in layout route

### 🤔 Problem to solve

You successfully implemented a loader for the chat thread route, but now you have thread list data in the `Layout` component that's still using `useState`. The sidebar needs to display a list of all available threads, and this data should be loaded before the layout renders.

Additionally, you need to understand **parent route loaders** - how do loaders work when routes are nested?

**Your challenge**: Add a `clientLoader` to the layout route that fetches the thread list data before rendering.

### 💡 Key concepts

**Parent route loaders:**

- When you open `/chat/3`, both the layout's loader and the chat thread's loader are needed
- React Router starts them **at the same time** (in parallel), and renders the page once both have finished
- Data from the layout's loader is available to the layout component via `useLoaderData()`

**Shared layout data:**

- Layouts provide consistent UI structure (like a sidebar) across multiple child routes
- Layout loaders are ideal for data that multiple child routes need
- The `<Outlet />` component renders the matched child route within the layout

**Data loading patterns:**

- Each route is responsible for loading its own data
- Routes declare their data dependencies through loaders
- React Router handles the coordination and timing

### 📝 Your task

Add a `clientLoader` to the `layout.jsx` route:

1. **Export a `clientLoader` function** that:

   - Is async (no parameters needed for this loader)
   - Simulates a network delay (300ms)
   - Returns mock thread data as an array
   - Each thread should have: `id` (as a string) and `title`
   - Include at least 10 threads for testing the scrollable sidebar

2. **Update the Layout component** to:
   - Remove the `useState` import and usage
   - Import and use `useLoaderData` to access the threads
   - Keep the `deleteThread` function for now (just log that mutations will be implemented later)

### 🔍 Implementation hints

<details>
<summary>Do I need params in the layout loader?</summary>

No! The layout route doesn't have any URL parameters, so your loader doesn't need to accept any arguments (or you can accept `{ params }` but won't use it).

</details>

<details>
<summary>Why are thread IDs strings now?</summary>

Database IDs are typically strings (UUIDs or similar). Converting now prepares the app for real database integration later.

</details>

<details>
<summary>What's the loading sequence?</summary>

When you open `/chat/3` directly (or refresh the page):

1. The layout loader (300ms) and the chat thread loader (500ms) **start at the same time**
2. The layout loader finishes after 300ms, the chat thread loader after 500ms
3. React Router renders the layout and the chat thread together

Total wait time: 500ms — the slowest loader, not the sum of both.

</details>

### 💬 Discussion points

1. **What's the advantage of loading thread data in the layout?** Why not load it in each child route that needs it?

2. **One after the other, or at the same time?** Add a `console.log` at the start and at the end of both loaders, and refresh the page. In which order do the four messages appear? What does that mean for how long the user waits?

### 🧪 Test your solution

- Navigate to the chat app and observe the sidebar loading
- Add a `console.log` at the start and end of both loaders to see when they run
- Try navigating between threads - the layout loader should NOT run again (only the child loader runs)
- Refresh the page - both loaders should run, at the same time
- Check that thread IDs are strings (you'll see them in the URL)

### ✅ Reference implementation

**🔗 Commit**: [`39e3f53`](5/commits/39e3f5332b6192dbce4955a45df4af482b9567eb)

Review the commit to see how:

- The layout loader provides thread data to the sidebar
- Thread IDs are converted to strings
- The component is simplified by removing state management
- The `deleteThread` callback is temporarily neutered (mutations come later)

---

<a name="step-3"></a>

## Step 3: Use NavLink to highlight active thread in sidebar

### 🤔 Problem to solve

Your sidebar now displays a list of threads, but there's no visual indication of which thread is currently active. Users can't easily tell which conversation they're viewing.

React Router provides `NavLink` - a special version of `Link` that automatically tracks whether it matches the current URL. You need to use this to highlight the active thread.

**Your challenge**: Replace the `Link` component with `NavLink` and add conditional styling for the active state.

### 💡 Key concepts

**NavLink component:**

- A special version of `Link` that knows when it matches the current route
- Provides routing state (`isActive`, `isPending`) via a className callback
- Automatically manages active state without manual tracking

**className callback pattern:**

```javascript
<NavLink
  to="/somewhere"
  className={({ isActive, isPending }) => {
    // Return a string of class names
    // You have access to isActive and isPending booleans
  }}
/>
```

**Conditional class application:**

- You can return different class names based on the state
- Common patterns: ternary operator, array filter, or template strings

### 📝 Your task

Update the `ChatThreadItem` component in `Sidebar.jsx`:

1. **Import `NavLink`** from React Router (in addition to `Link`)

2. **Replace `Link` with `NavLink`** for the thread link

3. **Update the className prop** to use a callback function that:

   - Accepts `{ isActive, isPending }` as parameters
   - Returns the base class `"chat-thread-link"`
   - Adds `"chat-thread-link-active"` when `isActive` is true
   - Use whatever pattern you prefer (ternary, array filter, etc.)

4. **Add CSS styling** for the active state in `app.css`:
   - Target the `.chat-thread-link-active` class
   - Make it visually distinct (e.g., `font-weight: bold`)

### 🔍 Implementation hints

<details>
<summary>Pattern 1: Ternary operator</summary>

```javascript
className={({ isActive }) =>
  isActive
    ? "chat-thread-link chat-thread-link-active"
    : "chat-thread-link"
}
```

</details>

<details>
<summary>Pattern 2: Array filter</summary>

```javascript
className={({ isActive }) =>
  ["chat-thread-link", isActive && "chat-thread-link-active"]
    .filter(Boolean)
    .join(" ")
}
```

</details>

<details>
<summary>Pattern 3: Template string</summary>

```javascript
className={({ isActive }) =>
  `chat-thread-link ${isActive ? "chat-thread-link-active" : ""}`
}
```

</details>

### 💬 Discussion points

1. **Why is NavLink better than manually tracking the active route?** What would you need to do without NavLink?

2. **What's the difference between `isActive` and `isPending`?** When is each one true?

3. **Which className pattern do you prefer and why?** Consider readability, scalability, and handling multiple conditional classes.

### 🧪 Test your solution

- Click on different threads in the sidebar
- Verify that the active thread is highlighted
- Navigate using the browser's back/forward buttons
- The highlighting should automatically update
- Try navigating directly via URL - the correct thread should be highlighted

### ✅ Reference implementation

**🔗 Commit**: [`19fc0f6`](5/commits/19fc0f64dbd5fbd8204003a1dbc3042f29104d62)

Review the commit to see:

- How `NavLink` replaces `Link`
- The className callback pattern used
- CSS styling for the active state
- Updated component documentation

---

<a name="step-4"></a>

## ⭐ Extra — Step 4: Add pending state animation to thread links

> This step is optional polish. Do it if you have time — the next tutorials don't depend on it.

### 🤔 Problem to solve

When you click a thread link, there's a 500ms delay while the loader fetches data (in a real app, this could be even longer). During this time, nothing happens visually - the user might wonder if their click registered.

You need to provide visual feedback during the loading state to improve perceived performance.

**Your challenge**: Use the `isPending` state from `NavLink` to show a pulsating animation while the new thread data is loading.

### 💡 Key concepts

**isPending state:**

- Provided by `NavLink` in the className callback
- True when navigation to this route has started but the loader hasn't completed
- Automatically managed by React Router
- Provides opportunity for loading feedback

**Perceived performance:**

- Users perceive apps as faster when they get immediate feedback
- Loading animations make waits feel shorter
- Indication that "something is happening" reduces frustration

### 📝 Your task

Update the `NavLink` in `ChatThreadItem` and add CSS animations:

1. **Update the className callback** to handle `isPending`:

   - Accept both `{ isActive, isPending }` parameters
   - Add `"chat-thread-link-pending"` class when `isPending` is true
   - Ensure both active and pending classes can apply simultaneously
   - Use the array filter pattern (it's cleanest for multiple conditional classes)

2. **Create a pulsating animation** in `app.css`:

   - Define a `@keyframes pulse` animation
   - Animate the text color between `var(--text-primary)` and `var(--text-muted)`
   - Use 0% and 100% for the primary color, 50% for the muted color
   - Set animation duration to 0.6s for quick, noticeable feedback

3. **Apply the animation** to the pending class:
   - Target `.chat-thread-link-pending`
   - Use `animation: pulse 0.6s ease-in-out infinite`

### 🔍 Implementation hints

<details>
<summary>How do I combine multiple conditional classes?</summary>

```javascript
className={({ isActive, isPending }) =>
  [
    "chat-thread-link",
    isActive && "chat-thread-link-active",
    isPending && "chat-thread-link-pending",
  ]
    .filter(Boolean)
    .join(" ")
}
```

The `filter(Boolean)` removes any `false` values from the array.

</details>

<details>
<summary>What's the keyframe syntax?</summary>

```css
@keyframes pulse {
  0%,
  100% {
    color: var(--text-primary);
  }
  50% {
    color: var(--text-muted);
  }
}
```

</details>

<details>
<summary>Why 0.6s duration?</summary>

A short duration (0.6s) means the animation completes quickly, making the pulsing noticeable. If the loader takes 500ms, the user will see almost one full pulse cycle.

</details>

### 💬 Discussion points

1. **When is `isPending` true vs `isActive` true?** Can they both be true at the same time? What about neither?

2. **How does visual feedback affect user experience?** Have you noticed similar patterns in other apps?

3. **What other types of pending state feedback could you provide?** Could you show a loading spinner? Disable the link? What are the tradeoffs?

### 🧪 Test your solution

- Click on a thread and watch for the pulsating animation
- The animation should stop when the new thread loads
- If you click quickly between threads, each pending link should pulse
- Try clicking the already-active thread - you should see pending state briefly
- Adjust the loader delay to see how it affects the animation perception

### ✅ Reference implementation

**🔗 Commit**: [`24f6f7e`](5/commits/24f6f7e5b873728d9dab59be39575fbf48324c7f)

Review the commit to see:

- The array filter pattern for combining multiple conditional classes
- The keyframe animation definition and timing
- How pending and active states work together
- Documentation explaining the user experience improvement

---

## 🎉 Congratulations!

You've successfully transformed a React application from traditional state management to React Router v7's declarative data loading pattern!

**What you've learned:**

- ✅ How `clientLoader` functions work and when they run
- ✅ The difference between loader-provided data and local component state
- ✅ Parent and child loader relationships and execution order
- ✅ Using `NavLink` for automatic active state management
- ✅ Providing visual feedback during data loading with `isPending`
- ✅ When to use loaders vs `useState` for data management

**Key takeaways:**

- Loaders run _before_ components render, guaranteeing data availability
- `NavLink` automatically tracks routing state without manual logic
- Visual feedback during loading improves perceived performance
- This pattern prepares your app for data mutations with `clientAction` (coming in the next tutorial!)

## 🚀 Extra features if you have time

1. Experiment with different pending-state animations (spinners, progress bars)
2. Experiment with different ways of highlighting the active thread (background color, underline, etc.)

## 📚 Additional resources

- [React Router v7 Guide - Data Loading](https://reactrouter.com/start/framework/data-loading)
- [React Router v7 Documentation - clientLoader](https://reactrouter.com/start/framework/route-module#clientloader)
- [React Router v7 Documentation - useLoaderData](https://reactrouter.com/api/hooks/useLoaderData)
- [React Router v7 Documentation - NavLink](https://reactrouter.com/api/components/NavLink)
- [MDN - CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
