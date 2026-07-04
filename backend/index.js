import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import cors from "cors";

import {db} from "./db/config.js";
import mainRouter from "./src/api/routes.js";
import {errorHandler} from "./src/middleware/error-handler.js";

const app = express();
const port = process.env.PORT || 3777;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));


// Serve uploaded files

const uploadPath = path.join(__dirname, "uploads");

console.log("Serving uploads from:", uploadPath);

app.use("/uploads", (req, res, next) => {
  console.log("Static request:", req.url);
  next();
});

app.use("/uploads", express.static(uploadPath));
// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api", mainRouter);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const connection = await db.getConnection();

    console.log("Database connection established successfully.");
    connection.release();

    app.listen(port, (err) => {
      if (err) {
        console.error("Failed to start the server:", err.message);
        process.exit(1);
      }

      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Failed to connect to the database. Server not started.",
      error.message,
    );
    process.exit(1);
  }
};

startServer();

// // import express from 'express';
// // import { db } from './db/config.js';
// // import  mainRouter  from './src/api/routes.js';
// // import { errorHandler } from './src/middleware/error-handler.js';
// // import cors from 'cors';

// // const app = express();
// // const port = process.env.PORT || 3777;
// import express from "express";
// import { db } from "./db/config.js";
// ...
// const app = express();
// ...
// app.listen(...)

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', timestamp: new Date() });
// });

// app.use('/api', mainRouter);
// app.use(errorHandler);

// // Start server
// const startServer = async () => {
//   try {
//     // Test database connection
//     const connection = await db.getConnection();

//     console.log('Database connection established successfully.');
//     connection.release();

//     app.listen(port, err => {
//       if (err) {
//         console.error('Failed to start the server:', err.message);
//         process.exit(1);
//       }
//       console.log(`Server running on port http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error(
//       'Failed to connect to the database. Server not started.',
//       error.message,
//     );
//     process.exit(1);
//   }
// };

// startServer();
