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

    const raceLaps: any = await Lap.findAll({
      include: [
        {
          model: Round,
          as: "round",
          where: {
            id_type: 8,
          },
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

    raceLaps.forEach((lap: any) => {
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

    for (const [raceId, laps] of raceLapsMap.entries()) {
      const lapsByRider: Map<number, any[]> = new Map();
      laps.forEach((lap: any) => {
        const riderId = lap.id_rider;
        if (!lapsByRider.has(riderId)) {
          lapsByRider.set(riderId, []);
        }
        lapsByRider.get(riderId)!.push(lap);
      });

      const positions: Map<number, number> = new Map();

      for (const [riderId, riderLaps] of lapsByRider.entries()) {
        const totalTime = riderLaps.reduce((sum: number, lap: any) => {
          return sum + (lap.time || 0);
        }, 0);
        positions.set(riderId, totalTime);
      }

      const sortedPositions = Array.from(positions.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      if (lapsByRider.has(Number(id_rider))) {
        totalRaces++;
      }

      if (
        sortedPositions.length > 0 &&
        sortedPositions[0][0] === Number(id_rider)
      ) {
        totalWins++;
      }

      if (sortedPositions.length > 0) {
        const position = sortedPositions.findIndex(
          ([riderId]) => riderId === Number(id_rider)
        );
        if (position >= 0 && position < 3) {
          totalPodiums++;
        }
      }
    }

    // q2
    const q2Laps: any = await Lap.findAll({
      include: [
        {
          model: Round,
          as: "round",
          where: {
            id_type: 5,
          },
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

    const q2LapsMap: Map<number, any[]> = new Map();

    q2Laps.forEach((lap: any) => {
      const raceId = lap.round?.race?.id;
      if (raceId) {
        if (!q2LapsMap.has(raceId)) {
          q2LapsMap.set(raceId, []);
        }
        q2LapsMap.get(raceId)!.push(lap);
      }
    });

    let totalPoles = 0;

    for (const [raceId, laps] of q2LapsMap.entries()) {
      // Agrupar vueltas por piloto
      const bestLapByRider: Map<number, number> = new Map();

      laps.forEach((lap: any) => {
        const riderId = lap.id_rider;
        const lapTime = lap.time ?? Infinity;

        // Guardar mejor tiempo (mínimo)
        if (
          !bestLapByRider.has(riderId) ||
          lapTime < bestLapByRider.get(riderId)!
        ) {
          bestLapByRider.set(riderId, lapTime);
        }
      });

      // Ordenar pilotos por mejor vuelta ascendente
      const sortedPositions = Array.from(bestLapByRider.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      // Si el primer puesto es el rider que buscamos, suma una pole
      if (
        sortedPositions.length > 0 &&
        sortedPositions[0][0] === Number(id_rider)
      ) {
        totalPoles++;
      }
    }

    // team history

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

    console.log(
      "Searching for riders with name:",
      name,
      "and dorsal:",
      realDorsal
    );

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

    console.log("Riders found:", ridersFormatted.length);

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
