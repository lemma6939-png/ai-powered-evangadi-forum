//instad pdf have presntation
export const presentationSlides = [
  {
    id: 1,
    title: "Welcome everyone",
    content: `
My name is Daniel Lako.

 Today I will explain the Question Detail component of our AI-Powered Evangadi Community Forum accessible learning platform.


This component allows authenticated users to view questions, read answers, submit new answers, vote on answers, accept the best answer, and communicate with the backend database.
`,
  },

  {
    id: 2,
    title: "React Hooks",
    content: `
This component uses React Hooks to manage its functionality.

The useState hook stores questions, answers, loading status, and error messages.

The useEffect hook automatically fetches question data and related questions from the backend whenever the page loads or the selected question changes.

This keeps the user interface updated automatically.
`,
  },

  {
    id: 3,
    title: "Authentication",
    content: `
Authentication is handled using the custom useAuth context.

Only authenticated users are allowed to post answers, vote, accept answers, and access protected features.

This ensures that the application remains secure and only authorized users can modify data.
`,
  },

  {
    id: 4,
    title: "React Router",
    content: `
React Router provides navigation throughout the application.

The useNavigate hook moves users between pages.

The useParams hook reads the questionHash from the URL so the correct question can be loaded dynamically from the backend.
`,
  },

  {
    id: 5,
    title: "Axios API",
    content: `
Axios is used to communicate with the backend server.

GET requests retrieve questions and answers.

POST requests submit new answers.

PUT requests update votes.

DELETE requests remove votes when necessary.

This keeps the frontend synchronized with the backend database.
`,
  },

  {
    id: 6,
    title: "Helper Functions",
    content: `
Several helper functions improve the user experience.

The getInitials function creates avatar initials from the user's first and last name.

The formatDate function converts database timestamps into readable dates.

If no user information exists, a default avatar is displayed.
`,
  },

  {
    id: 7,
    title: "Component State",
    content: `
The component manages several state variables.

These include the selected question, the list of answers, loading status, error messages, answer text, AI fit-check results, and related questions.

Managing state allows the interface to update instantly whenever users interact with the application.
`,
  },

  {
    id: 8,
    title: "Loading and Error Handling",
    content: `
While data is loading, the application displays a loading spinner.

If an error occurs, a clear error message is shown instead of crashing the application.

This provides a better user experience and improves the reliability of the system.
`,
  },

  {
    id: 9,
    title: "Delete RAG Document",
    content: `
The Delete RAG Document feature allows users to remove uploaded documents.

Before deletion, the system verifies document ownership.

It safely removes the uploaded file from storage, deletes its database record, and returns a successful response to the client.

This prevents unauthorized document deletion.
`,
  },

  {
    id: 10,
    title: "Get Single Question",
    content: `
The Get Single Question API retrieves one question using its unique question hash.

The backend loads the question together with all related answers.

The data is then returned to the frontend, where it is displayed to the user.
`,
  },

  {
    id: 11,
    title: "User Login",
    content: `
The Login feature authenticates users securely.

First, the application validates the user's email and password.

Next, the password is verified using bcrypt.

If the credentials are correct, the server generates a secure JSON Web Token, also known as a JWT.

This token allows users to access protected resources securely.
`,
  },

  {
    id: 12,
    title: "Conclusion",
    content: `
In conclusion, the AI-Powered Evangadi Community Forum combines React, React Hooks, React Router, Axios, Node.js, Express.js, MySQL, authentication, REST APIs, and AI-powered features to create a secure and interactive discussion platform.

This project demonstrates modern full-stack web development techniques while providing an accessible learning environment for students.

Thank you for your attention.
`,
  },
];