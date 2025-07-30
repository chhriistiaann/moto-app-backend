import User from "../models/dbModels/user";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateAndSaveToken } from "../services/token_service";
import UserLicenses from "../models/dbModels/userLicenses";
import { Op, where } from "sequelize";
import License from "../models/dbModels/license";
import Team from "../models/dbModels/team";
import Category from "../models/dbModels/category";
import UserToken from "../models/dbModels/userTokens";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        code: "AUTH_USER_NOT_FOUND",
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        code: "AUTH_INVALID_PASSWORD",
        message: "Invalid password",
      });
    }

    const token = await generateAndSaveToken({
      id: user.id,
      email: user.email,
    });

    const userLicenses = await UserLicenses.findAll({
      where: {
        id_user: user.id,
        end_date: {
          [Op.or]: [null, { [Op.gt]: new Date() }],
        },
      },
      include: [
        {
          model: License,
          required: true,
          where: {
            start_date: { [Op.lte]: new Date() },
            end_date: { [Op.gte]: new Date() },
          },
          include: [{ model: Team }, { model: Category }],
        },
      ],
    });

    const licensesFormatted = userLicenses.map((ul: any) => ({
      id: ul.license.id,
      team: ul.license.team,
      category: ul.license.category,
      admin: ul.admin,
      can_modify_riders: ul.can_modify_riders,
      can_manage_notes: ul.can_manage_notes,
    }));

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        token,
        licenses: licensesFormatted,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const tempUser = await User.findOne({ where: { email } });
    if (tempUser) {
      return res.status(400).json({
        code: "AUTH_USER_ALREADY_EXISTS",
        message: "User already exists",
      });
    } else {
      const newUser: any = await User.create({
        email,
        password: hashedPassword,
        name: email.split("@")[0], // Default name from email
      });

      const token = await generateAndSaveToken({
        id: newUser.id,
        email: newUser.email,
      });

      return res.status(200).json({
        code: "SUCCESS",
        data: {
          token,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    const user = await User.update({ name }, { where: { id: userId } });
    return res.status(200).json({
      code: "SUCCESS",
      data: {
        status: true,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export const logoutUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    const userToken = req.user?.id_auth_token;

    const token = await UserToken.update(
      { is_valid: false },
      { where: { id: userToken } }
    );

    const user = await User.update(
      { id_auth_token: null, notification_token: null },
      { where: { id: userId } }
    );
    return res.status(200).json({
      code: "SUCCESS",
      data: {
        status: true,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};
