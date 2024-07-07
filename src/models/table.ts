import { Schema, model } from "mongoose";

const TableColumnSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  nullable: Boolean,
  type: {
    type: String,
    required: [true, "Table type field is required"],
  },
});

const TableSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User id field is required"],
    },
    author: {
      type: String,
      required: [true, "Table author field is required"],
    },
    tableName: {
      type: String,
      required: [true, "Table name field is required"],
    },
    visibility: {
      type: String,
      required: [true, "Table visibility field is required"],
    },
    tableColumns: [TableColumnSchema],
  },
  {
    timestamps: true,
  }
);

export const Table = model("table", TableSchema);
