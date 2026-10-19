# A "chatbot" built with React and Postgres

This repository serves as a reference implementation for a classroom project where students build a chatbot UI with full CRUD functionality, progressing from basic React components to a complete full-stack application with custom API and database integration.

## Learning Path

### 1. Component Architecture

-   Break down wireframes into React components
-   Learn to "Think in React" with component composition
-   Build nested component structure for chatbot interface

### 2. React Foundation

-   Set up React Router app in framework mode with Vite
-   Work within single App component initially
-   Create chatbot UI using nested components

### 3. State Management & Interactivity

-   Implement basic interactivity with React state
-   Learn data flow through props and state
-   Build interactive chat interface

### 4. Routing & Navigation

-   Implement multiple routes using React Router
-   Create navigation for different chat threads
-   Structure application with proper routing

### 5. Database Integration

-   Set up Supabase project with chat messages table
-   Use React Router `clientLoader` for data fetching
-   Load chat data for relevant routes (SPA export)

### 6. Data Mutations

-   Implement form submission with React Router `clientAction`
-   Save messages to Supabase using REST API
-   Use raw fetch calls instead of JS client library

### 7. SQL & Database Queries

-   Introduction to SQL with Postgres
-   Practice database queries through Supabase interface
-   Understand relational data concepts

### 8. Custom API Development

-   Build out an Express API
-   Replicate Supabase REST API endpoints
-   Connect to existing Postgres database on Supabase

### 9. Full-Stack Integration

-   Replace Supabase REST API with custom implementation
-   Implement CRUD operations with custom SQL queries
-   Add authentication using bearer tokens

## Prerequisites

-   Basic web development knowledge
-   No prior React experience required
-   No database experience required

## Tech Stack

-   **Frontend**: React, React Router, Vite
-   **Backend**: Express
-   **Database**: PostgreSQL via Supabase
-   **API**: Supabase REST API (initially), custom implementation in Express (final)
