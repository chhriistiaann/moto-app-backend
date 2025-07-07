import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/token_service";
import User from "../models/dbModels/user";
import UserToken from "../models/dbModels/userTokens";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ code: "AUTH_NO_TOKEN" });
    return;
  }

  try {
    const user = verifyToken(token);
    const userModel: any = await User.findByPk(user.id);

    if (!userModel || !userModel.id_auth_token) {
      res.status(404).json({
        code: "AUTH_USER_NOT_FOUND",
      });
      return;
    }

    const userToken: any = await UserToken.findByPk(userModel.id_auth_token);

    if (!userToken || !userToken.is_valid || userToken.token !== token) {
      res.status(403).json({ code: "AUTH_TOKEN_INVALID" });
      return;
    }

    req.user = userModel;
    next();
  } catch (err) {
    res.status(401).json({ code: "AUTH_TOKEN_INVALID" });
    return;
  }
};
