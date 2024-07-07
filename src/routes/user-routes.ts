import { Router } from "express";
import { authMiddleware } from "../middleware";
import {
  userCredentialsController,
  userUpdatePasswordController,
} from "../controller";

export const userRoutes = Router();

userRoutes.post(
  "/api/user/credentials",
  authMiddleware,
  userCredentialsController
);

userRoutes.post(
  "/api/user/change-password",
  authMiddleware,
  userUpdatePasswordController
);
