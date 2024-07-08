import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRoutes, tableRoutes, userRoutes } from "./routes";
import { connectDB } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT;

// Middlewares
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(cookieParser());
app.disable("etag");

const connect = async () => {
  try {
    const db = connectDB();
    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });

    return db;
  } catch (err) {
    console.log("Error", err);
    console.dir();
  }
};

export const DB = connect();

app.use(authRoutes);
app.use(userRoutes);
app.use(tableRoutes);

export default app;
