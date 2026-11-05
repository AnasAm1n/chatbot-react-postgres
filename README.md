# A "chatbot" built with React and PostgreSQL

<img width="2880" height="1578" alt="chatbot-ui-screenshot" src="https://github.com/user-attachments/assets/40f4435a-0fe2-4813-9f20-9597a2cdfc93" />

This repository serves as a reference implementation and tutorial for a classroom project where students build a chatbot UI with full CRUD functionality, progressing from basic React components to a complete full-stack application, first by integrating a Supabase REST API, then refactoring to a custom Express API that integrates with a PostgreSQL database.

Each step of the project is documented in a separate pull request, which includes a detailed tutorial explaining the concepts and code changes involved. This allows students to follow along, understand the evolution of the application, and learn best practices in React development, state management, routing, data fetching, and backend integration.

## Learning Path

### Step 1: Component Architecture - [PR #1 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/1)

Transform a monolithic React application into a well-structured, component-based architecture. Learn how to break down UI into reusable components, pass data through props, and organize code with proper component hierarchy. You'll extract a `Chat` and `Sidebar` component from a single large component, demonstrating real-world React development patterns.

**Skills**: Component fundamentals, props basics, component hierarchy, file organization, component composition

### Step 2: Rendering Lists - [PR #2 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/2)

Refactor hardcoded JSX into dynamic lists using `Array.map()`. Learn the importance of the `key` prop, how to pass data between components using props, what "lifting state up" means, and how prop drilling works for passing data through multiple component layers. This tutorial shows the evolution from static components to a flexible, data-driven architecture.

**Skills**: Array mapping, key prop, props passing, lifting state up, prop drilling, data-driven UI

### Step 3: State Management & Interactivity - [PR #3 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/3)

Implement interactive features using React's `useState` hook and event handlers. Learn props destructuring patterns, event handling with onClick and onSubmit, state lifting for parent-child communication, form handling patterns, computed state for real-time filtering, and accessibility considerations for interactive elements.

**Skills**: useState hook, event handling, state lifting, callback props, form handling, computed state, accessibility

### Step 4: Dynamic Routing - [PR #4 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/4)

Transform the chatbot from a single-page application into a multi-route application where each conversation thread has its own URL. Set up dynamic route patterns using React Router, create route components, and use the `useParams()` hook to access URL parameters. This enables users to share links, use browser navigation, bookmark threads, and start new conversations.

**Skills**: React Router configuration, dynamic routes, useParams hook, URL parameters, multi-route applications

### Step 5: Data Fetching - [PR #5 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/5)

Learn React Router v7's data loading pattern using `clientLoader` functions to fetch data _before_ rendering, replacing traditional `useState` and `useEffect` patterns. Implement parent-child loader relationships, understand the loader lifecycle, and provide visual feedback during navigation with `NavLink` and pending state animations.

**Skills**: clientLoader functions, data loading lifecycle, loader relationships, NavLink active states, pending state UI

### Step 6: Database Integration - [PR #6 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/6)

Integrate Supabase—a Backend-as-a-Service (BaaS)—into your React Router application. Set up a PostgreSQL database, create tables with relationships, populate with seed data, and fetch data using Supabase's REST API. Learn REST API concepts including endpoints, query parameters, headers, and filtering while handling asynchronous data loading.

**Skills**: PostgreSQL schema design, Supabase setup, REST API concepts, authentication, environment variables, async data fetching

### Step 7: Data Mutations - [PR #7 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/7)

Implement full CRUD operations using React Router's `clientAction` functions to handle form submissions and data mutations. Learn how `Form` components connect to actions, automatic data revalidation after mutations, error handling patterns, non-navigating mutations with `useFetcher`, and graceful error handling with ErrorBoundary.

**Skills**: clientAction functions, Form components, data mutations, revalidation, useFetcher, ErrorBoundary, CRUD operations

### Step 8: Custom API Setup - [PR #8 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/8)

Build your own REST API from scratch to replace Supabase's REST API. Create an Express.js server, connect directly to your PostgreSQL database, write SQL queries, and implement your first endpoint (GET /api/threads). Understand how REST APIs work under the hood and why Backend-as-a-Service platforms exist.

**Skills**: Express.js server setup, PostgreSQL connection, SQL queries, REST API design, backend development

### Step 9: Reading Thread Messages - [PR #9 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/9)

Implement endpoints to fetch individual threads and their messages. Learn route parameters to capture IDs from URLs, SQL WHERE clauses for filtering, proper 404 error handling, nested RESTful resources, and foreign key relationships. Update the frontend to use your custom API instead of Supabase.

**Skills**: Route parameters, SQL WHERE clauses, 404 handling, nested resources, foreign keys, API integration

### Step 10: Creating Messages - [PR #10 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/10)

Build your first write operation with a POST endpoint to create messages. Parse request bodies with middleware, validate user input, use SQL INSERT statements, return proper status codes (201 Created), and handle security considerations for write operations. Users can now type and save messages through your custom API.

**Skills**: POST requests, request body parsing, input validation, SQL INSERT, status codes, write operation security

### Step 11: Deleting Threads - [PR #11 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/11)

Implement your first destructive operation with a DELETE endpoint. Handle DELETE HTTP requests, leverage database CASCADE constraints for related records, and understand the responsibility of implementing irreversible operations. Update the frontend to delete threads through your custom API.

**Skills**: DELETE requests, SQL DELETE, CASCADE constraints, destructive operations, data integrity

### Step 12: Creating Threads - [PR #12 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/12)

Complete your CRUD migration from Supabase by implementing thread creation. Build a compound operation that creates both a thread and its initial message in a single API request. Learn about sequential database operations and designing APIs that match your application's business logic. 🎉 Your frontend is now completely independent of Supabase's REST API!

**Skills**: Compound operations, sequential database operations, API design, business logic, complete CRUD implementation

### Step 13: Updating Thread Titles - [PR #13 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/13)

Complete the full CRUD implementation by adding Update functionality. Implement a PATCH endpoint for partial resource updates, then build a clean editing interface using React Router's nested routes. Learn how `Outlet` and `useRouteLoaderData` enable parent-child route relationships, and discover how URL-based state can replace complex state management patterns. This simpler approach demonstrates that routing itself can elegantly handle UI modes like viewing versus editing.

**Skills**: HTTP PATCH method, SQL UPDATE statements, nested routes, Outlet component, useRouteLoaderData hook, URL-based state, uncontrolled forms, API documentation

### Step 14: User Accounts & Login UI - [PR #14 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/14)

Add user authentication to your chatbot. Create registration and login forms where users can create accounts with email and password. Learn how password hashing works with bcrypt, what JWT tokens are and how they're structured, and how Supabase Auth manages user sessions. This PR focuses on building the authentication UI — users can register and log in, but the backend won't enforce authentication yet. This lets you explore how tokens are created and stored before learning to use them in the next steps.

**Skills**: Supabase Auth API, user registration, login forms, password hashing with bcrypt, JWT tokens, localStorage, form validation, clientAction functions, authentication concepts

### Step 15: Sending Authentication Tokens - [PR #15 tutorial](https://github.com/bewildergeist/chatbot-react-postgres/pull/15)

Implement the client-side authentication layer by automatically including JWT tokens in all API requests. Create a custom `apiFetch` wrapper function that adds the `Authorization: Bearer <token>` header to every request, then refactor all loaders and actions to use it. Display the current user's email in the sidebar. Add logout functionality that clears the session. Learn the DRY principle, wrapper functions, and how to inspect authentication tokens in the browser's Network tab. The backend doesn't enforce authentication yet—this PR prepares the groundwork for server-side verification in the next step.

**Skills**: Wrapper functions, Bearer token authentication, Authorization headers, DRY principle, session management, logout functionality, useEffect hook, Supabase session API

---

## Screencast of the chatbot in action

https://github.com/user-attachments/assets/fe215e1f-d61b-4555-98f2-c5f41dd2db1b

---

## Prerequisites

- Basic web development knowledge
- No prior React experience required (you'll learn React fundamentals along the way)
- No database experience required (you'll learn PostgreSQL and SQL basics along the way)

## Tech Stack

- **Frontend**: React, React Router, Vite
- **Backend**: Express
- **Database**: PostgreSQL via Supabase
- **API**: Supabase REST API (initially), custom implementation in Express (final)
