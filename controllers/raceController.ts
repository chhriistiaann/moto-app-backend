import { Request, Response } from "express";
import Lap from "../models/dbModels/lap";
import Round from "../models/dbModels/round";
import Race from "../models/dbModels/race";
import Category from "../models/dbModels/category";
import Seasson from "../models/dbModels/seasson";
import Circuit from "../models/dbModels/circuit";
import Flag from "../models/dbModels/flag";
import Rider from "../models/dbModels/rider";
import RaceHighlights from "../models/dbModels/raceHighlights";
import RaceNote from "../models/dbModels/raceNote";
import User from "../models/dbModels/user";
import RoundType from "../models/dbModels/roundType";
import { uploadImageToSupabase } from "../services/image_service";
import { Op } from "sequelize";
import NumberHistory from "../models/dbModels/numberHistory";
import Team from "../models/dbModels/team";
import TeamHistory from "../models/dbModels/teamHistory";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const getSeassons = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;

    const seassons = await Seasson.findAll({
      where: {
        id_category: licence.id_category,
      },
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        seassons: seassons,
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

export const getRaces = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id_seasson } = req.params;

    const races = await Race.findAll({
      where: { id_seasson },
      include: [
        {
          model: Circuit,
          required: true,
          include: [
            {
              model: Flag,
              required: true,
            },
          ],
        },
        {
          model: Seasson,
          required: true,
        },
      ],
    });

    const formattedRaces = races.map((race: any) => ({
      id: race.id,
      day: race.day,
      circuit: {
        id: race.circuit.id,
        name: race.circuit.name,
        image: race.circuit.image,
        silueta: race.circuit.silueta,
        distance: race.circuit.distance,
        laps: race.circuit.laps,
        flag: {
          id: race.circuit.flag.id,
          name: race.circuit.flag.name,
          image: race.circuit.flag.image,
        },
      },
      seasson: {
        id: race.seasson.id,
        name: race.seasson.name,
        start_date: race.seasson.start_date,
        end_date: race.seasson.end_date,
      },
    }));

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        races: formattedRaces,
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

export const getRaceDetails = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id_race } = req.params;
    const { riders_ids } = req.body;

    const allLaps: any = await Lap.findAll({
      include: [
        {
          model: Round,
          required: true,
          where: {
            id_race: id_race,
          },
          include: [
            {
              model: RoundType,
              required: true,
            },
          ],
        },
        {
          model: Rider,
          required: true,
        },
      ],
    });

    const roundsModels: any = Array.from(
      new Map(allLaps.map((lap: any) => [lap.round.id, lap.round])).values()
    );

    const lapsByRound = new Map<any, any[]>();

    for (const lap of allLaps) {
      const roundId = lap.round.id;

      if (!lapsByRound.has(roundId)) {
        lapsByRound.set(roundId, []);
      }

      lapsByRound.get(roundId)!.push(lap);
    }

    const roundStats = new Map<number, any>();
    const userStatsByRound = new Map<number, Map<number, any>>();

    for (const [roundId, laps] of lapsByRound.entries()) {
      const lapsByRider = new Map<any, any[]>();
      for (const lap of laps) {
        const riderId = lap.rider.id;

        if (!lapsByRider.has(riderId)) {
          lapsByRider.set(riderId, []);
        }

        lapsByRider.get(riderId)!.push(lap);
      }

      const minTimes = new Map<any, number>();

      for (const [riderId, riderLaps] of lapsByRider.entries()) {
        const minTime = Math.min(
          ...riderLaps.map((lap: any) => lap.total_time)
        );
        minTimes.set(riderId, minTime);
      }

      const avgMinTime =
        Array.from(minTimes.values()).reduce((acc, time) => acc + time, 0) /
        minTimes.size;

      const avgMinTimeInt = Math.floor(avgMinTime);

      const minTime = Math.min(...Array.from(minTimes.values()));
      const riderIdWithMinTime = Array.from(minTimes.entries()).find(
        ([, time]) => time === minTime
      );

      var currentRiderDorsal: any = null;

      if (riderIdWithMinTime) {
        currentRiderDorsal = await NumberHistory.findOne({
          where: {
            id_rider: riderIdWithMinTime[0],
            end_date: {
              [Op.or]: [{ [Op.is]: null }, { [Op.gt]: new Date() }],
            },
          },
        });
      }

      const topSpeed = Math.max(...laps.map((lap: any) => lap.top_speed));

      const positionsList = new Map<number, any>();

      for (const [riderId, riderLaps] of lapsByRider.entries()) {
        const minTime = Math.min(
          ...riderLaps.map((lap: any) => lap.total_time)
        );

        const totalTime = riderLaps.reduce(
          (acc: number, lap: any) => acc + lap.total_time,
          0
        );

        positionsList.set(riderId, {
          riderId: riderId,
          minTime: minTime,
          totalTime: totalTime,
        });
      }

      const positionsArray = Array.from(positionsList.values());

      const roundModel: any = await Round.findByPk(roundId);

      if (roundModel.id_type === 4 || roundModel.id_type === 5) {
        positionsArray.sort((a, b) => a.minTime - b.minTime);
      } else if (roundModel.id_type === 8) {
        // Paso 1: Obtener cantidad de vueltas por piloto
        const riderLapCounts = new Map<number, number>(); // riderId -> count
        for (const [riderId, laps] of lapsByRider.entries()) {
          riderLapCounts.set(riderId, laps.length);
        }

        // Paso 2: Calcular el máximo de vueltas hechas por un piloto
        const maxLaps = Math.max(...Array.from(riderLapCounts.values()));

        // Paso 3: Calcular el 90% mínimo requerido
        const minLapsRequired = Math.ceil(maxLaps * 0.9);

        // Paso 4: Separar pilotos que cumplen o no con el mínimo
        const fullRiders: typeof positionsArray = [];
        const incompleteRiders: typeof positionsArray = [];

        for (const pos of positionsArray) {
          const lapsCount = riderLapCounts.get(pos.riderId) || 0;
          if (lapsCount >= minLapsRequired) {
            fullRiders.push(pos);
          } else {
            incompleteRiders.push(pos);
          }
        }

        // Paso 5: Ordenar los que cumplen por totalTime
        fullRiders.sort((a, b) => a.totalTime - b.totalTime);
        incompleteRiders.sort((a, b) => a.totalTime - b.totalTime);
        // Paso 6: Recombinar
        positionsArray.length = 0;
        positionsArray.push(...fullRiders, ...incompleteRiders);
      } else {
        positionsArray.sort((a, b) => a.totalTime - b.totalTime);
      }

      const tmpRiders_ids = Array.from(lapsByRider.keys());
      const riders = await Rider.findAll({
        where: {
          id: tmpRiders_ids,
        },
        include: [
          {
            model: TeamHistory,
            required: true,
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

        return {
          id: rider.id,
          name: rider.name,
          birth: rider.birth,
          place_of_birth: rider.place_of_birth,
          image: rider.image,
          number: rider.number_histories?.[0]?.number || null,
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

      const roundStat = {
        avgMinTime: avgMinTimeInt,
        minTime: minTime,
        riderIdWithMinTime: currentRiderDorsal
          ? currentRiderDorsal.number
          : null,
        topSpeed: topSpeed,
        positions: positionsArray,
        riders: ridersFormatted,
      };
      roundStats.set(roundId, roundStat);

      const ridersStatsMap = new Map<number, any>();

      for (const riderId of riders_ids) {
        const riderLaps = lapsByRider.get(riderId) || [];
        const totalTime = riderLaps.reduce(
          (acc: number, lap: any) => acc + lap.total_time,
          0
        );

        const topSpeed = riderLaps.reduce(
          (max: number, lap: any) => Math.max(max, lap.top_speed),
          0
        );

        const seg1 = riderLaps.reduce(
          (min: number, lap: any) => Math.min(min, lap.sector1),
          Infinity
        );

        const seg2 = riderLaps.reduce(
          (min: number, lap: any) => Math.min(min, lap.sector2),
          Infinity
        );

        const seg3 = riderLaps.reduce(
          (min: number, lap: any) => Math.min(min, lap.sector3),
          Infinity
        );

        const seg4 = riderLaps.reduce(
          (min: number, lap: any) => Math.min(min, lap.sector4),
          Infinity
        );

        const positionIndex = positionsArray.findIndex(
          (pos) => pos.riderId === riderId
        );

        const userStat = {
          laps: riderLaps.length,
          total: totalTime,
          min_time: minTimes.get(riderId) || null,
          topSpeed: topSpeed,
          bestPosition: positionIndex !== -1 ? positionIndex + 1 : null,
          best_seg1: seg1,
          best_seg2: seg2,
          best_seg3: seg3,
          best_seg4: seg4,
          ideal_lap: seg1 + seg2 + seg3 + seg4,
        };
        ridersStatsMap.set(riderId, userStat);
      }
      userStatsByRound.set(roundId, ridersStatsMap);
    }

    const roundStatsObject = Object.fromEntries(roundStats);
    const userStatsObject: Record<number, Record<number, any>> = {};
    for (const [roundId, ridersMap] of userStatsByRound.entries()) {
      userStatsObject[roundId] = Object.fromEntries(ridersMap);
    }

    const highlights = await RaceHighlights.findAll({
      where: {
        id_race: id_race,
      },
    });

    const notes = await RaceNote.findAll({
      where: {
        id_race: id_race,
      },
      include: [
        {
          model: User,
          required: true,
          attributes: ["name"],
        },
      ],
    });

    const formattedNotes = notes.map((note: any) => ({
      id: note.id,
      message: note.message,
      file: note.file,
      time: note.time,
      user: note.user.name,
      id_rider: note.id_rider,
    }));

    // agrupa las formattedNotes por id_rider
    const notesByRider: Record<number, any[]> = {};
    formattedNotes.forEach((note) => {
      const riderId = note.id_rider || 0;
      if (!notesByRider[riderId]) {
        notesByRider[riderId] = [];
      }
      notesByRider[riderId].push(note);
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        data: {
          roundsModels,
          roundStats: roundStatsObject,
          userStats: userStatsObject,
          highlights,
          notes: notesByRider,
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

export const newNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id_race, id_rider } = req.params;
    const user = req.user;
    const { image, message, filename } = req.body;
    const licence = req.licence;

    var url = null;
    if (image && filename) {
      const buffer = Buffer.from(image.data || image);

      url = await uploadImageToSupabase(buffer, filename);
    } else {
      url = null;
    }
    const newNote: any = await RaceNote.create({
      id_race,
      message,
      file: url,
      id_user: user.id,
      id_rider,
      id_licence: licence.id,
    });

    const realNote: any = await RaceNote.findOne({
      where: { id: newNote.id },
      include: [
        {
          model: User,
          required: true,
          attributes: ["name"],
        },
      ],
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        note: {
          id: realNote.id,
          message: realNote.message,
          file: realNote.file,
          time: realNote.time,
          user: realNote.user.name,
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

export const deleteNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id_note } = req.params;

    const note = await RaceNote.findByPk(id_note);

    if (note) {
      await note.destroy();
    }

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        deleted: true,
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

export const updateNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id_note } = req.params;
    const { image, message, filename, deleteImage } = req.body;

    var url = null;
    if (image && filename) {
      const buffer = Buffer.from(image.data || image);

      url = await uploadImageToSupabase(buffer, filename);
    } else {
      const existingNote: any = await RaceNote.findByPk(id_note);
      if (existingNote && existingNote.file && deleteImage) {
        url = null;
      } else {
        url = existingNote ? existingNote.file : null;
      }
    }

    const newNote: any = await RaceNote.update(
      {
        message,
        file: url,
      },
      {
        where: { id: id_note },
        returning: true,
      }
    );

    const realNote: any = await RaceNote.findOne({
      where: { id: id_note },
      include: [
        {
          model: User,
          required: true,
          attributes: ["name"],
        },
      ],
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        note: {
          id: realNote.id,
          message: realNote.message,
          file: realNote.file,
          time: realNote.time,
          user: realNote.user.name,
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

export const searchRaces = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, seasson_id } = req.body;

    if (name == "" && seasson_id == "") {
      return res.status(200).json({
        code: "SUCCESS",
        data: {
          races: {},
        },
      });
    }

    const races = await Race.findAll({
      where: {
        ...(seasson_id && { id_seasson: seasson_id }),
      },
      include: [
        {
          model: Circuit,
          required: true,
          where: {
            ...(name && { name: { [Op.iLike]: `%${name}%` } }),
          },
          include: [
            {
              model: Flag,
              required: true,
            },
          ],
        },
        {
          model: Seasson,
          required: true,
        },
      ],
    });

    const racesFormatted = races.map((race: any) => {
      const circuit = race.circuit;

      return {
        id: race.id,
        day: race.day,
        circuit: circuit
          ? {
              id: circuit.id,
              name: circuit.name,
              image: circuit.image,
              silueta: circuit.silueta,
              distance: circuit.distance,
              laps: circuit.laps,
              flag: {
                id: circuit.flag.id,
                name: circuit.flag.name,
                image: circuit.flag.image,
              },
            }
          : null,
        seasson: {
          id: race.seasson.id,
          name: race.seasson.name,
          start_date: race.seasson.start_date,
          end_date: race.seasson.end_date,
        },
      };
    });

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        races: racesFormatted,
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
