import { FlattenMaps, Types } from "mongoose";
import { Token, AuthUser } from "../../models";
import jwt from "jsonwebtoken";

export const createToken = (userId: string, token_secret: string) => {
  const token = jwt.sign({ userId }, token_secret, {
    expiresIn: Number(process.env.JWT_MAX_AGE),
  });

  return token;
};

export const updateRefreshToken = async ({
  userId,
  refreshToken,
}: {
  userId: string;
  refreshToken: string;
}) => {
  const token = await Token.updateOne(
    { userId },
    { $set: { userId, refreshToken, createdAt: Date.now() } },
    { upsert: true }
  );

  return token;
};

export const generateTokens = async (userId: string) => {
  const accessToken = createToken(userId, process.env.ACCESS_TOKEN_SECRET!);

  const refreshToken = createToken(userId, process.env.REFRESH_TOKEN_SECRET!);

  return {
    accessToken,
    refreshToken,
  };
};

export const getUserPublicInfo = (
  user: FlattenMaps<
    AuthUser & {
      _id: Types.ObjectId;
    }
  >
): AuthUser => {
  return {
    userId: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};
