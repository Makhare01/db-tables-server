import mongoose from "mongoose";

export const connectDB = () =>
  new Promise<mongoose.Connection>((resolve, reject) => {
    const URL = process.env.ATLAS_URI ?? "";

    try {
      mongoose.connect(URL);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
    const dbConnection = mongoose.connection;

    dbConnection.once("open", () => resolve(dbConnection));

    dbConnection.on("error", reject);
    return;
  });
