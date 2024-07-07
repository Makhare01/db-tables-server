import { Request, Response } from "express";
import { RequestError, handleAuthRequestErrors } from "../../utils";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";

import {
  generateTokens,
  getUserPublicInfo,
  updateRefreshToken,
} from "./_utils";
import { AuthUser, Token, User } from "../../models";

export const signUpController = async (req: Request, res: Response) => {
  const body = req.body;

  try {
    const user = await User.create(body);

    const publicUserInfo = getUserPublicInfo(user.toJSON());

    const { accessToken, refreshToken } = await generateTokens(
      publicUserInfo.userId
    );

    await updateRefreshToken({
      userId: user._id.toString(),
      refreshToken,
    });

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_MAX_AGE) * 1000, // 15 min (milliseconds)
    });

    res.status(201).json({
      accessToken,
      user: publicUserInfo,
    });
  } catch (error) {
    const errors = handleAuthRequestErrors(error as RequestError);
    res.status(400).json({
      name: "Bad Request",
      message: "Unable to create new user",
      errors,
    });
  }
};

export const signInController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    const publicUserInfo = getUserPublicInfo(user.toJSON());

    const { accessToken, refreshToken } = await generateTokens(
      publicUserInfo.userId
    );

    await updateRefreshToken({
      userId: user._id.toString(),
      refreshToken,
    });

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_MAX_AGE) * 1000, // 15 min (milliseconds)
    });

    res.status(200).json({
      accessToken,
      user: publicUserInfo,
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: "Unable to sign in with this credentials",
      errors: {
        credentials: error.message,
      },
    });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const cookieRefreshToken: string | undefined = req.cookies["refresh-token"];

  try {
    if (cookieRefreshToken) {
      jwt.verify(
        cookieRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
        async (error, decoded) => {
          if (error) {
            return res.status(403).json({
              name: error.name,
              message: error.message,
            });
          }

          const userId = (decoded as { userId: string }).userId;

          const token = await Token.findOne({ userId });
          const user = await User.findById(userId);

          if (user && token?.refreshToken === cookieRefreshToken) {
            const publicUserInfo = getUserPublicInfo(user.toJSON());

            const { accessToken, refreshToken } = await generateTokens(
              publicUserInfo.userId
            );

            await updateRefreshToken({
              userId,
              refreshToken,
            });

            res.cookie("refresh-token", refreshToken, {
              httpOnly: true,
              maxAge: Number(process.env.JWT_MAX_AGE) * 1000, // 15 min (milliseconds)
            });

            return res.status(200).json({
              accessToken,
              user: publicUserInfo,
            });
          }

          return res.status(404).json({
            name: "Not Found",
            message: "Wrong refresh token",
          });
        }
      );
    } else {
      return res.status(404).json({
        name: "Not Found",
        message: "Refresh token not found",
      });
    }
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: error.message,
    });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const { userId } = jwtDecode<AuthUser>(token ?? "");

  try {
    await Token.findOneAndDelete({ userId });

    res.clearCookie("refresh-token");

    res.status(200).json({
      name: "Success",
      message: "User logged from the system",
    });
  } catch (error: any) {
    res.status(400).json({
      name: "Bad Request",
      message: error.message,
    });
  }
};
