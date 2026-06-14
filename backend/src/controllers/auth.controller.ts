import { User } from "../models/user.model.js";
import { createAuthTokens, verifyRefreshToken } from "../services/token.service.js";
import { hashPassword, verifyPassword } from "../services/password.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

function tokenPayload(user: { id?: string; _id?: unknown; role?: unknown; tokenVersion?: unknown }) {
  return {
    sub: user.id ?? String(user._id),
    role: user.role as "user" | "admin" | "moderator",
    tokenVersion: Number(user.tokenVersion)
  };
}

export const register = asyncHandler(async (req, res) => {
  const { email, username, displayName, password } = req.body;
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }]
  });

  if (existingUser) {
    throw new AppError("Email or username is already registered", 409);
  }

  const user = await User.create({
    email,
    username,
    displayName,
    passwordHash: await hashPassword(password)
  });
  const tokens = createAuthTokens(tokenPayload(user));

  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  res.status(201).json({ user, tokens });
});

export const login = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }]
  }).select("+passwordHash +refreshTokenHash");

  if (!user || !(await verifyPassword(password, String(user.passwordHash)))) {
    throw new AppError("Invalid credentials", 401);
  }

  const tokens = createAuthTokens(tokenPayload(user));
  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  user.presence = "online";
  user.lastSeenAt = null;
  await user.save();

  res.json({ user, tokens });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select("+refreshTokenHash");

  if (
    !user ||
    !user.isActive ||
    user.tokenVersion !== payload.tokenVersion ||
    !user.refreshTokenHash ||
    !(await verifyPassword(refreshToken, String(user.refreshTokenHash)))
  ) {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokens = createAuthTokens(tokenPayload(user));
  user.refreshTokenHash = await hashPassword(tokens.refreshToken);
  await user.save();

  res.json({ user, tokens });
});

export const logout = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      refreshTokenHash: null,
      presence: "offline",
      lastSeenAt: new Date()
    },
    $inc: { tokenVersion: 1 }
  });

  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const user = await User.findById(req.user.id);
  res.json({ user });
});
