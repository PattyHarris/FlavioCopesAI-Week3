# Build an app with multiple users.

1. Initial prompt:

Build me a shared expense tracker app called Splittify. Multiple people can sign up, create groups, and split expenses.

The app needs user accounts:
- Registration with email and password
- Login and logout
- Sessions that persist across page loads
- Protected routes (dashboard requires login, landing page is public)

Core features:
- Create expense groups with a name
- Invite other users to a group by email
- Add expenses: who paid, how much, and split among which group members
- Calculate balances automatically (who owes whom within each group)
- A dashboard showing all groups the logged-in user belongs to

Each user should only see groups they belong to. Each group shows its own expenses, members, and balances.

Use a Supabase database and use Supabase authorization as well.

Store money as integer cents to avoid floating-point rounding issues.

Make it clean and functional.

For the stack, use React and Node.js

For the frontend UI:
Design Philosophy: "Create a modern, clean, and minimalist UI with high readability, ample whitespace, and no unnecessary design elements."
Layout: "Use a simple single-column layout with a fixed, narrow content width for, high readability."
Components: "Design UI components (buttons, cards) to be flat, with clear, consistent padding, and standard padding/spacing."
Palette: "Use a limited, modern color palette (e.g., neutrals with one accent color)."
