import { Router } from "express";
import { authMiddleware } from "../middleware";
import {
  addTableDataController,
  createTableController,
  deleteCollectionDocController,
  deleteTableController,
  editCollectionDocController,
  editTableController,
  getMyTablesController,
  getTableDataController,
  getTableDetailsController,
  getTablesController,
  tablesStatisticsController,
} from "../controller";

export const tableRoutes = Router();

tableRoutes.post("/api/table/create", authMiddleware, createTableController);
tableRoutes.get("/api/tables", authMiddleware, getTablesController);
tableRoutes.get(
  "/api/tables/statistics",
  authMiddleware,
  tablesStatisticsController
);
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

tableRoutes.post(
  "/api/tables/:tableId/add-data",
  authMiddleware,
  addTableDataController
);

tableRoutes.patch(
  "/api/tables/:tableId/edit",
  authMiddleware,
  editTableController
);

tableRoutes.delete(
  "/api/tables/:tableId/:documentId/delete",
  authMiddleware,
  deleteCollectionDocController
);

tableRoutes.patch(
  "/api/tables/:tableId/:documentId/edit",
  authMiddleware,
  editCollectionDocController
);
