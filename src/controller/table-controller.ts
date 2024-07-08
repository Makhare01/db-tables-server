import { Request, Response } from "express";
import { AuthUser, Table, User } from "../models";
import { DB } from "../app";
import { jwtDecode } from "jwt-decode";
import { ObjectId } from "mongodb";

// CREATE TABLE
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

// EDIT TABLE
export const editTableController = async (req: Request, res: Response) => {
  const { tableId } = req.params;
  const { tableName, visibility, tableColumns } = req.body;

  try {
    const table = await Table.findByIdAndUpdate(
      tableId,
      {
        tableName,
        visibility,
        tableColumns,
      },
      {
        new: true,
      }
    );

    res.status(200).json(table);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Unable to update table",
      error: error.message,
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
        message: `You don't have access to this table: ${tableId}`,
      });
    }

    res.status(200).json(table);
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: `Failed to get table with this id ${tableId}`,
      error: error.message,
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
  const { page = 1, limit = 10, sortColumn, sortDir, search } = req.query;

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    const table = await Table.findById(tableId);

    if (table?.visibility === "PUBLIC" || table?.userId === userId) {
      const database = await DB;
      const DataCollection = await database?.collection(table.tableName);

      if (DataCollection) {
        const searchOption = table.tableColumns.map((col) => ({
          [col.name]: new RegExp(search as string, "i"),
        }));

        // PAGINATION

        // Convert page and limit to integers
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        // Calculate the starting index of the products
        const startIndex = (pageNum - 1) * limitNum;

        // Get the total number of products
        const totalProducts = await DataCollection.countDocuments();

        const data = await DataCollection.find({ $or: searchOption })
          .sort({ [sortColumn as string]: sortDir === "asc" ? -1 : 1 })
          .skip(startIndex)
          .limit(limitNum)
          .toArray();

        return res.status(200).json({
          total: totalProducts,
          totalPages: Math.ceil(totalProducts / limitNum),
          currentPage: pageNum,
          data,
        });
      }

      return res.status(400).json({
        name: "Bad Request",
        message: `Collection with name: ${table.tableName} not found`,
      });
    }

    res.status(403).json({
      name: "Forbidden",
      message: "You don't have access to this table",
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get table data",
      error: error.message,
    });
  }
};

export const addTableDataController = async (req: Request, res: Response) => {
  const { tableId } = req.params;
  const { data } = req.body;

  try {
    const table = await Table.findById(tableId);

    if (table) {
      const database = await DB;
      const DataCollection = await database?.collection(table.tableName);

      const collectionData = await DataCollection?.insertMany(data);

      return res.status(200).json(collectionData);
    }

    return res.status(400).json({
      name: "Bad Request",
      message: `Failed to get table with this id ${tableId}`,
    });
  } catch (error: any) {
    console.log({ error });
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to add data to table",
    });
  }
};

// DELETE COLLECTION DOCUMENT
export const deleteCollectionDocController = async (
  req: Request,
  res: Response
) => {
  const { tableId, documentId } = req.params;

  try {
    const table = await Table.findById(tableId);

    if (table) {
      const database = await DB;
      const DataCollection = await database?.collection(table.tableName);

      const doc = await DataCollection?.findOne({
        _id: new ObjectId(documentId),
      });

      console.log({ doc });

      await DataCollection?.findOneAndDelete({ _id: new ObjectId(documentId) });

      res.status(200).json({
        message: "Document deleted successfully",
      });
    }
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to delete document, please try again",
      error: error.message,
    });
  }
};

// EDIT COLLECTION DOCUMENT
export const editCollectionDocController = async (
  req: Request,
  res: Response
) => {
  const { tableId, documentId } = req.params;
  const newValues = req.body;

  try {
    const table = await Table.findById(tableId);

    if (table) {
      const database = await DB;
      const DataCollection = await database?.collection(table.tableName);

      const doc = await DataCollection?.findOneAndUpdate(
        {
          _id: new ObjectId(documentId),
        },
        {
          $set: newValues,
        }
      );

      res.status(200).json({
        message: "Document updated successfully",
        doc,
      });
    }
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to update document, please try again",
      error: error.message,
    });
  }
};

// TABLES STATISTICS
export const tablesStatisticsController = async (
  req: Request,
  res: Response
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    const myTables = await Table.find({ userId });
    const database = await DB;

    const documentsCount: Record<string, number> = {};

    for (const table of myTables) {
      const collectionName = table.tableName;

      const count = await database?.collection(collectionName).countDocuments();

      documentsCount[collectionName] = count ?? 0;
    }

    const myDocumentsCount = Object.values(documentsCount).reduce(
      (acc, current) => acc + current,
      0
    );

    res.status(200).json({
      myDocumentsCount,
      tablesCount: myTables.length,
      documentsCount,
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Failed to get tables statistics, please try again",
      error: error.message,
    });
  }
};
