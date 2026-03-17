# Build an app with multiple users.

## Initial prompt:

Build me a shared expense tracker app called "Let's Split It!". Multiple people can sign up, create groups, and split expenses.

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

- There will be the following pages and modals:
  - Landing page
    - My Groups page - New Group page - Group modal for a given group - Add expense modal - Invite new member modal - Sign up page - Sign in page
      Only the landing, sign-up, and sign-in page/modal are public.

- Data:
  - User data:
    - Display name
    - Password
    - email
    - connection to groups that this user belongs
  - Group data:
    - Expenses data:
      - Name of expense
      - Amount of expense
      - User(s) that paid some or all of expense
      - Date of payment
      - Split type (equal or exact amount)
      - Members of group
  - Messages for group (e.g. text strings)
  - Balances for group (e.g how much each user still owes the group)

  - The logged in user only can edit the amount that that user owes.

Use a Supabase database and use Supabase authorization as well.
Render will be used for deployment, but I will test locally.

Store money as integer cents to avoid floating-point rounding issues.

Make it clean and functional.

For the stack, use React and Node.js

For the frontend UI:
Design Philosophy: "Create a modern, clean, and minimalist UI with high readability, ample whitespace, and no unnecessary design elements."
Layout: "Use a simple single-column layout with a fixed, narrow content width for, high readability."
Components: "Design UI components (buttons, cards) to be flat, with clear, consistent padding, and standard padding/spacing."
Palette: "Use a limited, modern color palette (e.g., neutrals with one accent color)."

Pages:

- Landing Page:
  - Top menu:
    - Left: App title "Let's Split It"
    - Right: "Sign in" and "Sign up" buttons. The "Sign up" button is default.
  - Middle of page conversion text:
    "Split expenses,
    effortlessly with friends

    Whether it's a weekend trip, shared apartment, or dinner with friends, Let's Split It
    makes it easy to track who paid what and settle up fairly.
    - Following conversion text, 2 buttons: "Sign up" and "Sign in"
      - The "Sign up" button is default.

  - Bottom half of Landing page:
    - 3 cards with more conversion text:
      - Card 1:
        - Icon symbolizing "Create Groups
        - Title: Create Groups
        - Sub-text: Set up groups for your trips, dinners, apartment expenses.
      - Card 2:
        - Icon: symbolizing "Track Expenses"
        - Title: Track Expenses
        - Sub-text: Record all expenses with who paid and how costs were divided.
      - Card 3:
        - Icon symbolizing "Settle Up"
        - Title: Settle Up
        - Sub-text: Instantly see who owes money to whom. Splittify calculates all the costs instantly.

- Sign in Page:
  - Top menu same as Landing Page
  - Middle of page is Sign in area:
    - Title "Sign in"
    - 2 text boxes, first for Email, second for Password. Email text box has a default example email. Password text box uses "\*" for hiding password text with a "eye" icon that turns off and on the hidden text.
    - The "Sign in" button follows the edit boxes.
    - Instructional text link below the "Sign in" button: "No account? Create one!" that when clicked takes the user to the "Sign up" page.
    - When the user successfully signs in, the user is taken to the "My Groups" page.

- Sign up Page:
  - Top menu same as Landing Page
  - Middle of page is Sign up area:
    - Title is "Sign up"
    - 5 text boxes: First Name, Last Name, email, password, and confirm password. The password and confirm password text boxes use "\*" to hide the text with an "eye" icon that when clicked, allows the text to be visible. When clicked when the text is visible, the "\*" are returned.
    - Button that says "Sign up"
    - Instructional text link below the "Sign up" button: "Already have an account? Sign in! that when clicked takes the user to the "Sign in" page.

- My Groups Page:
  - Title: My Groups - title is on the left side. On the right is the "New Group" button.
  - Show the groups for which the logged in user belongs. Each group is shown as a card and includes
    - Group title
    - Group description
    - Date group created
  - The card is clickable, and when clicked takes the user to the group details page.
  - If no groups, the page shows in the middle of the page includes text explaining how to get started - 2 lines: You currently have no groups! To add a new group, click on "New Group"

- Group Details Page:
  - Title: Application name (Let's Split It) is on the left side. On the right side is the Sign out button.
  - Below the title is the group data.
    - First line is a button (left oriented) allowing the user to return the list of all their groups ("<- My Groups"). On the right side of this line (right oriented) is a button to allow removal of the group (e.g. trash icon). Only the person that created the group can delete the group.
    - 2 column layout follows
      - Column 1 includes 2 stacked cards:
        - card 1 shows expenses
        - card 2 shows a box for adding messages and showing messages from group members.
      - Colum 2 includes 2 stacked cards:
        - card 1 shows balances for each member of the group. The top of this card is "Balances" on the left and a "Settle up" button on the right. When the "Settle up" button is clicked, the "Settle up" modal appears.
        - card 2 shows the member in the group and a button "Invite" which when clicked, brings up the "Invite new member" modal.

- Add Group Modal
  Modal dialog that allows the user to add a group name. The remaining data is added onces the group is created.

- Add Expenses Modal
  Modal dialog that allows for the following data entries:
  Expense description
  "Amount paid"
  "Paid by" - drop down with list of group members, default to the logged in user
  "Split type" ("Equal" or 'Exact Amount' selections)
  "Split among" (list of group members with checkboxes to allow selection of members which paid)
  "Add Expense" button

  Clicking the Add Expense button adds the data to the database and the Expenses page is updated with the new expense.

- Settle up Modal
  - Title: "Settle up"
  - Dropdown list with the list of members of this group. Title of dropdown list is "Pay to"
  - Edit box for monetary entry titled "Amount
  - "Record Entry" button

  - Clicking the "Record Entry" button records the entry by adjusting the current balances. User is returned to the Group page.

- Sign up Page
  - Title: "Sign up"
  - Secondary caption: "Make sharing expenses even easier!"
  - Edit boxes:
    - Display name
    - Email
    - Password (with "\*" and eye icon for showing and hiding characters)
    - Confirm Password (with "\*" and eye icon for showing and hiding characters)
    - "Sign up" button
    - Text below button: "Already have an account? Sign in!" where the user can click the "Sign in" to sign into their account.

  - Clicking the "Sign up" button takes the user to the "My Groups" page.

- Sign in Page
  - Title: "Welcome back!"
  - Caption: "Sign in to start sharing your expenses!"
  - Edit boxes:
    - Email
    - Password (with "\*" and eye icon for showing and hiding characters)
  - Sign in button
  - Following text: "Not a member? Sign up to become a member of "Let's split it!"

## Setup Notes

1. When setting up the project on Supabase, click both the API and the RLS options.
2. Once the Supabase database is setup, run the supabase/schema.sql
3. The "anon" key is located under API keys/legacy anon,service role API keys. Use the anon key, not the service_role key. The service_role key bypasses RLS and must never go in the frontend.
4. To remove testing emails - these works since the tables are setup to cascade to other entries.

    ````sql
    select id, email, email_confirmed_at
    from auth.users
    where email = 'someone@example.com';

    delete from auth.users
    where email = 'someone@example.com';

    ````
