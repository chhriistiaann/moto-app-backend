import { Request, Response } from "express";
import Lap from "../models/dbModels/lap";
import Round from "../models/dbModels/round";
import Race from "../models/dbModels/race";
import Rider from "../models/dbModels/rider";
import TeamHistory from "../models/dbModels/teamHistory";
import Team from "../models/dbModels/team";
import Seasson from "../models/dbModels/seasson";
import { Op } from "sequelize";
import Flag from "../models/dbModels/flag";
import NumberHistory from "../models/dbModels/numberHistory";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const getRanking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;

    const { id_seasson } = req.params;
    const seasson: any = await Seasson.findByPk(id_seasson);

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

    const riders: any[] = [];

    raceLaps.forEach((lap: any) => {
      const riderId = lap.id_rider;
      if (!riders.includes(riderId)) {
        riders.push(riderId);
      }
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

    const sortedRaceLapsMap: Map<number, any[]> = new Map(
      [...raceLapsMap.entries()].sort((a, b) => {
        const dateA = a[1][0]?.round?.race?.date;
        const dateB = b[1][0]?.round?.race?.date;
        return dateA < dateB ? -1 : 1;
      })
    );

    const listPointsByRider: Map<number, number[]> = new Map();

    var raceNumber = 0;

    for (const [raceId, laps] of sortedRaceLapsMap.entries()) {
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

      // Añadir puntos a corredores que participaron
      sortedPositions.forEach(([riderId, totalTime], index) => {
        const points = getPointsForPosition(index + 1);
        if (!listPointsByRider.has(riderId)) {
          listPointsByRider.set(riderId, []);
        }
        listPointsByRider.get(riderId)!.push(points);
      });

      // Asegurar que todos los corredores tengan puntos por esta carrera
      riders.forEach((riderId) => {
        if (!listPointsByRider.has(riderId)) {
          listPointsByRider.set(riderId, []);
        }
        const pointsArray = listPointsByRider.get(riderId)!;
        // Si aún no se ha agregado un punto por esta carrera, agregar 0
        if (pointsArray.length < raceNumber + 1) {
          pointsArray.push(0);
        }
      });

      raceNumber++;
    }

    var ranking: any[] = [];

    listPointsByRider.forEach((pointsArray, riderId) => {
      const totalPoints = pointsArray.reduce((sum, points) => sum + points, 0);
      ranking.push({
        id_rider: riderId,
        totalPoints: totalPoints,
      });
    });

    const currentRankingSorted = [...ranking].sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    const listPointsByRiderBeforeLastRace: Map<number, number[]> = new Map();

    listPointsByRider.forEach((pointsArray, riderId) => {
      const cloned = pointsArray.slice(0, -1); // elimina el último valor
      listPointsByRiderBeforeLastRace.set(riderId, cloned);
    });

    const previousRanking: { id_rider: number; totalPoints: number }[] = [];

    listPointsByRiderBeforeLastRace.forEach((pointsArray, riderId) => {
      const totalPoints = pointsArray.reduce((sum, points) => sum + points, 0);
      previousRanking.push({
        id_rider: riderId,
        totalPoints,
      });
    });

    // Ordenar de mayor a menor puntos (posición 1 es el mejor)
    previousRanking.sort((a, b) => b.totalPoints - a.totalPoints);

    const riderList: any[] = [];

    ranking = await Promise.all(
      ranking.map(async (rider) => {
        const currentPos = currentRankingSorted.findIndex(
          (r) => r.id_rider === rider.id_rider
        );
        const prevPos = previousRanking.findIndex(
          (r) => r.id_rider === rider.id_rider
        );

        let modePosition = 0;
        if (prevPos !== -1) {
          if (currentPos < prevPos) modePosition = 1;
          else if (currentPos > prevPos) modePosition = -1;
        }

        const riderModel: any = await Rider.findOne({
          where: { id: rider.id_rider },
          include: [
            {
              model: TeamHistory,
              required: false,
              where: {
                start_date: {
                  [Op.lte]: seasson.end_date,
                },
                [Op.or]: [
                  { end_date: null },
                  { end_date: { [Op.gte]: seasson.start_date } },
                ],
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
                end_date: {
                  [Op.or]: [null, { [Op.gt]: new Date() }],
                },
              },
            },
          ],
        });

        const formmatedRider: any = {
          id: riderModel!.id,
          name: riderModel!.name,
          image: riderModel.image,
          number: riderModel.number_histories?.[0]?.number || null,
          flag: riderModel.flag
            ? {
                id: riderModel.flag.id,
                name: riderModel.flag.name,
                image: riderModel.flag.image,
              }
            : null,
          team: riderModel.team_histories?.[0]?.team
            ? {
                id: riderModel.team_histories[0].team.id,
                name: riderModel.team_histories[0].team.name,
                image: riderModel.team_histories[0].team.image,
              }
            : null,
        };

        riderList.push(formmatedRider);

        return {
          rider: rider.id_rider,
          totalPoints: rider.totalPoints,
          modePosition: modePosition,
        };
      })
    );

    // turn listPointsByRider to object
    const listPointsByRiderObject = Object.fromEntries(listPointsByRider);

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        stats: {
          ranking,
          listPointsByRider: listPointsByRiderObject,
          riderList,
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

const getPointsForPosition = (position: number): number => {
  const pointsTable = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  return pointsTable[position - 1] || 0;
};
