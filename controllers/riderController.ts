import { Request, Response } from "express";
import Lap from "../models/dbModels/lap";
import Round from "../models/dbModels/round";
import Race from "../models/dbModels/race";
import Rider from "../models/dbModels/rider";
import TeamHistory from "../models/dbModels/teamHistory";
import Team from "../models/dbModels/team";
import { literal, Op, where } from "sequelize";
import Flag from "../models/dbModels/flag";
import NumberHistory from "../models/dbModels/numberHistory";
import CategoryHistory from "../models/dbModels/categoryHistory";
import { sortLapsByRoundType } from "../functions/podiumList";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id_rider, id_seasson } = req.params;

    const allLaps: any = await Lap.findAll({
      include: [
        {
          model: Round,
          as: "round",
          include: [
            {
              model: Race,
              as: "race",
              where: { id_seasson: id_seasson },
            },
          ],
        },
      ],
    });

    const raceLapsMap: Map<number, any[]> = new Map();

    allLaps.forEach((lap: any) => {
      const raceId = lap.round?.race?.id;
      if (raceId) {
        if (!raceLapsMap.has(raceId)) {
          raceLapsMap.set(raceId, []);
        }
        raceLapsMap.get(raceId)!.push(lap);
      }
    });

    var totalRaces = 0;
    var totalWins = 0;
    var totalPodiums = 0;
    var totalPoles = 0;

    for (const [raceId, laps] of raceLapsMap.entries()) {
      const sortedLaps = sortLapsByRoundType(laps, 8);
      if (sortedLaps.length === 0) continue;


      const riderId = Number(id_rider);

      const position = sortedLaps.findIndex(
        (entry) => entry.riderId === riderId
      );

      if (position === 0) {
        totalWins++;
        totalPodiums++;
      } else if (position > 0 && position <= 2) {
        totalPodiums++;
      }

      if (position >= 0) {
        totalRaces++;
      }

      const q2Laps = sortLapsByRoundType(laps, 5);
      const polePositionId = q2Laps.length > 0 ? q2Laps[0].riderId : null;

      if (q2Laps.length > 0 && polePositionId === riderId) {
        totalPoles++;
      }
    }

    const teamHistory = await TeamHistory.findAll({
      where: {
        id_rider: id_rider,
      },
      include: [
        {
          model: Team,
          required: true,
        },
      ],
    });

    const teamHistoryFormatted = teamHistory.map((history: any) => ({
      id: history.id,
      team: history.team,
      start_date: history.start_date,
      end_date: history.end_date,
    }));

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        stats: {
          totalRaces,
          totalWins,
          totalPodiums,
          totalPoles,
          teamHistory: teamHistoryFormatted,
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

export const updateRider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { birth, place_of_birth, tiktok, instagram } = req.body;
    const { id_rider } = req.params;

    const rider = await Rider.update(
      {
        birth: birth || null,
        place_of_birth: place_of_birth || null,
        tiktok: tiktok || null,
        instagram: instagram || null,
      },
      {
        where: { id: id_rider },
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

export const searchRider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, dorsal } = req.body;
    const licence = req.licence;

    var realDorsal = dorsal;

    if (dorsal == -1) {
      realDorsal = null;
    }

    if (name == "" && dorsal == "") {
      return res.status(200).json({
        code: "SUCCESS",
        data: {
          riders: {},
        },
      });
    }

    const normalizedName = name
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const riders = await Rider.findAll({
      where: {
        ...(name && {
          [Op.and]: [
            where(literal(`unaccent(lower("rider"."name"))`), {
              [Op.like]: `%${normalizedName}%`,
            }),
          ],
        }),
      },
      include: [
        {
          model: CategoryHistory,
          required: true,
          where: {
            id_category: licence.id_category,
            end_date: {
              [Op.or]: [null, { [Op.gt]: new Date() }],
            },
          },
        },
        {
          model: TeamHistory,
          required: false,
          where: {
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
          model: NumberHistory,
          required: false,
          where: {
            ...(realDorsal && { number: realDorsal }),
            end_date: {
              [Op.or]: [null, { [Op.gt]: new Date() }],
            },
          },
        },
      ],
    });

    const ridersFormatted = riders.map((rider: any) => {
      const currentTeam = rider.team_histories?.[0]?.team || null;
      const flag = rider.flag;
      const numberHistory = rider.number_histories?.[0] || null;

      return {
        id: rider.id,
        name: rider.name,
        birth: rider.birth,
        place_of_birth: rider.place_of_birth,
        image: rider.image,
        number: numberHistory?.number || null,
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
