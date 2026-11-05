import { index, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/layout.jsx", [
    index("routes/home.jsx"),
    route("chat/new", "routes/chat-new.jsx"),
    route("chat/:threadId", "routes/chat-thread.jsx", [
      route("edit", "routes/chat-thread-edit.jsx"),
    ]),
  ]),
  // Authentication routes (outside main layout)
  route("login", "routes/login.jsx"),
  route("register", "routes/register.jsx"),
];
