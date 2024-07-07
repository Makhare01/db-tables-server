import { Request, Response } from "express";
import { AuthUser, Table, User } from "../models";
import { DB } from "../app";
import { jwtDecode } from "jwt-decode";

export const createTableController = async (req: Request, res: Response) => {
  const { tableName, visibility, tableColumns } = req.body;

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    const user = await User.findById(userId);

    const table = await Table.create({
      userId,
      tableName,
      visibility,
      tableColumns,
      author: `${user?.firstName} ${user?.lastName}`,
    });

    // Create new collection by tableName
    try {
      const database = await DB;

      const collections = await database?.listCollections();

      if (collections?.some((col) => col.name === tableName)) {
        await Table.findByIdAndDelete(table._id);
        console.log("inn");
        return res.status(400).json({
          name: "Bad Request",
          message: `Collection: ${tableName} is already exists, please choose another name`,
        });
      }

      database?.createCollection(tableName);
    } catch (error: any) {
      // Delete table record in case if there is an error during collection creation
      await Table.findByIdAndDelete(table._id);

      res.status(400).json({
        name: "Bad Request",
        message: `Failed to create collection: ${tableName}`,
      });
    }

    res.status(200).json(table);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Unable to create table",
    });
  }
};

export const getTablesController = async (req: Request, res: Response) => {
  try {
    const tables = await Table.find({ visibility: "PUBLIC" });

    res.status(200).json(tables);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get tables",
    });
  }
};

export const getTableDetailsController = async (
  req: Request,
  res: Response
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  const { tableId } = req.params;

  try {
    const table = await Table.findById(tableId);

    if (table?.visibility === "PRIVATE" && table.userId !== userId) {
      return res.status(400).json({
        name: "Bad Request",
        message: `Failed to get table with this id ${tableId}`,
      });
    }

    res.status(200).json(table);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: `Failed to get table with this id ${tableId}`,
    });
  }
};

export const getMyTablesController = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    const tables = await Table.find({ userId });

    res.status(200).json(tables);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get tables",
    });
  }
};

export const deleteTableController = async (req: Request, res: Response) => {
  const { tableId } = req.params;
  const { collection } = req.body;

  try {
    try {
      const database = await DB;
      await database?.dropCollection(collection);
    } catch (error) {
      return res.status(400).json({
        name: "Bad Request",
        message: "Failed to delete collection, please try again",
      });
    }

    const table = await Table.findByIdAndDelete(tableId, {
      new: true,
    });

    res.status(200).json({
      message: "Table deleted successfully",
      table,
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to delete table, please try again",
    });
  }
};

export const getTableDataController = async (req: Request, res: Response) => {
  const { tableId } = req.params;
  const { tableName } = req.body;

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    const table = await Table.findById(tableId);

    if (table?.visibility === "PUBLIC" || table?.userId === userId) {
      const database = await DB;
      const DataCollection = await database?.collection(tableName);

      const data = await DataCollection?.find({}).toArray();

      return res.status(200).json(data);
    }

    res.status(403).json({
      name: "Forbidden",
      message: "You don't have access to this table",
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get table data",
    });
  }
};

export const addTableDataController = async (req: Request, res: Response) => {
  const { tableId } = req.params;
  const { tableName } = req.body;

  try {
    const database = await DB;
    const DataCollection = await database?.collection(tableName);

    const data = await DataCollection?.find({}).toArray();

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get table data",
    });
  }
};
