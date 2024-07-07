import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({
      name: "Unauthorized",
      message: "User is not authenticated",
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err) => {
    if (err) {
      return res.status(403).json({
        name: "Forbidden",
        message: "You don't have permission to access this resource",
      });
    }

    next();
  });
};
