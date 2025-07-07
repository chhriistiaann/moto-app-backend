import { Request, Response } from "express";
import LicensedRiders from "../models/dbModels/licensedRiders";
import { Op, where } from "sequelize";
import License from "../models/dbModels/license";
import Rider from "../models/dbModels/rider";
import CategoryHistory from "../models/dbModels/categoryHistory";
import TeamHistory from "../models/dbModels/teamHistory";
import Team from "../models/dbModels/team";
import Flag from "../models/dbModels/flag";
import User from "../models/dbModels/user";
import UserLicenses from "../models/dbModels/userLicenses";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const selectLicence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;

    // Obtener corredores del equipo actual
    const teamRiders = await Rider.findAll({
      include: [
        {
          model: TeamHistory,
          required: true,
          where: {
            id_team: licence.id_team,
            end_date: {
              [Op.or]: [null, { [Op.gt]: new Date() }],
            },
          },
          include: [
            {
              model: Team,
              required: false,
            },
          ],
        },
        {
          model: Flag,
          required: false,
        },
        {
          model: LicensedRiders,
          required: false,
          where: {
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
            },
          ],
        },
      ],
    });

    // Formateo
    const ridersFormatted = teamRiders.map((rider: any) => {
      const currentTeam = rider.team_histories?.[0]?.team || null;
      const flag = rider.flag;
      const isLicenced = rider.licensed_riders?.length > 0;

      return {
        id: rider.id,
        name: rider.name,
        birth: rider.birth,
        place_of_birth: rider.place_of_birth,
        image: rider.image,
        number: rider.number,
        instagram: rider.instagram,
        tiktok: rider.tiktok,
        flag: flag
          ? {
              id: flag.id,
              name: flag.name,
              image: flag.image,
            }
          : null,
        team: currentTeam
          ? {
              id: currentTeam.id,
              name: currentTeam.name,
              image: currentTeam.image,
            }
          : null,
        licenced: isLicenced,
      };
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        riders: ridersFormatted,
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

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;
    const users: any = await UserLicenses.findAll({
      where: {
        id_licence: licence.id,
      },
      include: [
        {
          model: User,
          required: true,
        },
      ],
    });

    const usersFormatted = users.map((user: any) => {
      return {
        id_licence: user.id,
        name: user.user?.name,
        email: user.user?.email,
        can_modify_riders: user.can_modify_riders || false,
        can_manage_notes: user.can_manage_notes || false,
        admin: user.admin || false,
        start_date: user.start_date,
        end_date: user.end_date,
      };
    });


    return res.status(200).json({
      code: "SUCCESS",
      data: {
        users: usersFormatted,
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

export const addUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;
    const { email, can_modify_riders, can_manage_notes } = req.body;

    const user: any = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        code: "NOT_FOUND",
      });
    }

    const existingUserLicence: any = await UserLicenses.findOne({
      where: {
        id_user: user.id,
        id_licence: licence.id,
        end_date: {
          [Op.or]: [null, { [Op.gt]: new Date() }],
        },
      },
    });

    if (existingUserLicence) {
      return res.status(200).json({
        code: "SUCCESS",
        data: {
          status: true,
        },
      });
    }

    const maxUsers = licence.max_users || 0;
    const currentUsersCount = await UserLicenses.count({
      where: {
        id_licence: licence.id,
        end_date: {
          [Op.or]: [null, { [Op.gt]: new Date() }],
        },
      },
    });

    if (maxUsers > 0 && currentUsersCount >= maxUsers) {
      return res.status(400).json({
        code: "MAX_USERS_REACHED",
        message: "Maximum number of users reached for this licence.",
      });
    }

    const licenceUser: any = await UserLicenses.create({
      id_user: user.id,
      id_licence: licence.id,
      admin: false,
      can_modify_riders: can_modify_riders || false,
      can_manage_notes: can_manage_notes || false,
      start_date: new Date(),
      end_date: null,
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        user: {
          id_licence: licenceUser.id,
          name: user.name,
          email: user.email,
          can_modify_riders: licenceUser.can_modify_riders || false,
          can_manage_notes: licenceUser.can_manage_notes || false,
          admin: licenceUser.admin || false,
          start_date: licenceUser.start_date,
          end_date: licenceUser.end_date,
        },
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

export const updateUserLicence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { user_licence } = req.params;
    const { can_modify_riders, can_manage_notes } = req.body;

    await UserLicenses.update(
      {
        can_modify_riders: can_modify_riders || false,
        can_manage_notes: can_manage_notes || false,
      },
      {
        where: { id: user_licence },
      }
    );

    const licenceUser: any = await UserLicenses.findOne({
      where: { id: user_licence },
    });

    const user: any = await User.findOne({
      where: { id: licenceUser.id_user },
    });
    return res.status(200).json({
      code: "SUCCESS",
      data: {
        user: {
          id_licence: licenceUser.id,
          name: user.name,
          email: user.email,
          can_modify_riders: licenceUser.can_modify_riders || false,
          can_manage_notes: licenceUser.can_manage_notes || false,
          admin: licenceUser.admin || false,
          start_date: licenceUser.start_date,
          end_date: licenceUser.end_date,
        },
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

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { user_licence } = req.params;

    const licenceUser: any = await UserLicenses.update(
      {
        end_date: new Date(),
      },
      {
        where: { id: user_licence },
      }
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
