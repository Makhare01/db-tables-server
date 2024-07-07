import { Schema, model } from "mongoose";

const TokenSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User id is required"],
    },
    refreshToken: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expireAfterSeconds: Number(process.env.JWT_MAX_AGE) },
    },
  },
  {
    timestamps: true,
  }
);

export const Token = model("token", TokenSchema);
