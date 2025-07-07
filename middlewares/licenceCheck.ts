import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import UserLicenses from "../models/dbModels/userLicenses";
import License from "../models/dbModels/license";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const verifyUserLicencePermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id; // Asegúrate que authenticateToken ponga req.user con id
  const licenceId = parseInt(req.params.id_licence);

  if (!userId) {
    res.status(401).json({ code: "AUTH_USER_NOT_FOUND" });
    return;
  }
  if (isNaN(licenceId)) {
    res.status(400).json({ code: "INVALID_LICENCE_ID" });
    return;
  }

  try {
    const userLicence: any = await UserLicenses.findOne({
      where: {
        id_user: userId,
        id_licence: licenceId,
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
    });

    if (!userLicence) {
      res.status(403).json({
        code: "LICENCE_NOT_FOUND_OR_INACTIVE",
      });
      return;
    }

    req.licence = userLicence.license;
    next();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected error" });
    return;
  }
};

export const verifyPermissionsManageNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const licence = req.licence;

  const licenceHistory: any = await UserLicenses.findOne({
    where: {
      id_user: user.id,
      id_licence: licence.id,
      end_date: {
        [Op.or]: [null, { [Op.gt]: new Date() }],
      },
    },
  });

  if (licenceHistory.admin || licenceHistory.can_manage_notes) {
    next();
  } else {
    res.status(403).json({
      code: "PERMISSION_DENIED",
      message: "You do not have permission to manage notes for this licence.",
    });
  }
};

export const verifyPermissionsManageRiders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const licence = req.licence;

  const licenceHistory: any = await UserLicenses.findOne({
    where: {
      id_user: user.id,
      id_licence: licence.id,
      end_date: {
        [Op.or]: [null, { [Op.gt]: new Date() }],
      },
    },
  });

  if (licenceHistory.admin || licenceHistory.can_modify_riders) {
    next();
  } else {
    res.status(403).json({
      code: "PERMISSION_DENIED",
      message: "You do not have permission to manage notes for this licence.",
    });
  }
};

export const verifyPermissionsAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const licence = req.licence;

  const licenceHistory: any = await UserLicenses.findOne({
    where: {
      id_user: user.id,
      id_licence: licence.id,
      end_date: {
        [Op.or]: [null, { [Op.gt]: new Date() }],
      },
    },
  });

  if (licenceHistory.admin) {
    next();
  } else {
    res.status(403).json({
      code: "PERMISSION_DENIED",
      message: "You do not have permission to manage notes for this licence.",
    });
  }
};
