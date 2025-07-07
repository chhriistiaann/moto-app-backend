import jwt, { Secret, SignOptions } from "jsonwebtoken";
import UserToken from "../models/dbModels/userTokens";
import User from "../models/dbModels/user";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "nose";

export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
export const generateAndSaveToken = async (user: any): Promise<string> => {
  const userModel: any = await User.findByPk(user.id);
  if (userModel.id_auth_token) {
    await UserToken.update(
      { is_valid: false },
      { where: { id: userModel.id_auth_token } }
    );
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
  });
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp! * 1000);

  // Guarda el token en la DB
  const savedToken: any = await UserToken.create({
    token: token,
    expiration_date: expiresAt,
    is_valid: true,
  });

  await User.update(
    { id_auth_token: savedToken.id, notificationToken: null },
    { where: { id: user.id } }
  );

  return token;
};
