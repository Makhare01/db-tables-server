import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getUserPublicInfo } from "./auth-controller/_utils";
import { User } from "../models";

export const userCredentialsController = async (
  req: Request,
  res: Response
) => {
  const { userId, ...updatedUser } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, updatedUser, {
      new: true,
    });

    if (user) {
      return res.status(200).json(getUserPublicInfo(user.toJSON()));
    }

    res.status(400).json({
      name: "Bad Request",
      message: "Unable to update user",
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: error.message,
    });
  }
};

export const userUpdatePasswordController = async (
  req: Request,
  res: Response
) => {
  const { userId, oldPassword, newPassword, passwordConfirm } = req.body;

  if (newPassword !== passwordConfirm) {
    return res.status(400).json({
      name: "Credentials",
      message: "Passwords do not match",
    });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({
      name: "Credentials",
      message:
        "You filled same old and new password, please fill new password to update",
    });
  }

  try {
    const user = await User.findById(userId);

    if (user) {
      const isCorrectOldPassword = await bcrypt.compare(
        oldPassword,
        user.password
      );

      if (isCorrectOldPassword) {
        try {
          const salt = await bcrypt.genSalt();
          await User.findByIdAndUpdate(
            userId,
            { password: await bcrypt.hash(newPassword, salt) },
            { new: true }
          );

          return res.status(200).json({
            name: "Success",
            message: "Successfully updated password",
          });
        } catch (err: any) {
          return res.status(400).json({
            name: "Bad Request",
            message: err.message,
          });
        }
      } else {
        return res.status(400).json({
          name: "Credentials",
          message: "Filled old password is not correct",
        });
      }
    }

    res.status(400).json({
      name: "Bad Request",
      message: "User not found",
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: error.message,
    });
  }
};
