import { Router } from "express";
import { authMiddleware } from "../middleware";
import {
  createTableController,
  deleteTableController,
  getMyTablesController,
  getTableDataController,
  getTableDetailsController,
  getTablesController,
} from "../controller";

export const tableRoutes = Router();

tableRoutes.post("/api/table/create", authMiddleware, createTableController);
tableRoutes.get("/api/tables", authMiddleware, getTablesController);
tableRoutes.get("/api/tables/my-tables", authMiddleware, getMyTablesController);
tableRoutes.get(
  "/api/tables/:tableId",
  authMiddleware,
  getTableDetailsController
);

tableRoutes.delete(
  "/api/tables/:tableId",
  authMiddleware,
  deleteTableController
);

tableRoutes.get(
  "/api/tables/:tableId/data",
  authMiddleware,
  getTableDataController
);
