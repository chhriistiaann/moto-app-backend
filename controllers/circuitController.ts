import { Request, Response } from "express";
import Rider from "../models/dbModels/rider";
import { Op } from "sequelize";
import License from "../models/dbModels/license";
import LicensedRiders from "../models/dbModels/licensedRiders";
import Seasson from "../models/dbModels/seasson";
import Circuit from "../models/dbModels/circuit";
import Lap from "../models/dbModels/lap";
import Race from "../models/dbModels/race";
import Round from "../models/dbModels/round";
import Flag from "../models/dbModels/flag";
import CircuitNote from "../models/dbModels/circuitNote";
import { uploadImageToSupabase } from "../services/image_service";
import User from "../models/dbModels/user";
import { sortLapsByRoundType } from "../functions/podiumList";

interface AuthenticatedRequest extends Request {
  user?: any;
  licence?: any;
}

export const getCircuits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const licence = req.licence;

    const licencedRiderIds = new Set(
      (
        await Rider.findAll({
          attributes: ["id"],
          include: [
            {
              model: LicensedRiders,
              required: true,
              where: {
                id_license: licence.id,
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
        })
      ).map((r: any) => r.id)
    );

    const last3Seassons = await Seasson.findAll({
      order: [["end_date", "DESC"]],
      limit: 3,
    });

    const circuitos = await Circuit.findAll({
      include: [
        {
          model: Flag,
          required: false,
        },
        {
          model: Race,
          required: true,
          where: {
            id_seasson: {
              [Op.in]: last3Seassons.map((s: any) => s.id),
            },
          },
          include: [
            {
              model: Round,
              required: true,
              where: {
                id_type: 8,
              },
              include: [
                {
                  model: Lap,
                  required: true,
                  where: {
                    id_rider: Array.from(licencedRiderIds),
                  },
                },
              ],
            },
          ],
        },
      ],
      subQuery: false,
    });

    const formattedCircuits = circuitos.map((circuit: any) => ({
      id: circuit.id,
      name: circuit.name,
      image: circuit.image,
      silueta: circuit.silueta,
      distance: circuit.distance,
      laps: circuit.laps,
      flag: circuit.flag
        ? {
            id: circuit.flag.id,
            name: circuit.flag.name,
            image: circuit.flag.image,
          }
        : null,
    }));

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        circuits: formattedCircuits,
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

export const getCircuitDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id_circuit } = req.params;
    const { riders_ids } = req.body;
    // 1. Obtener las 3 últimas temporadas
    const last3Seassons = await Seasson.findAll({
      order: [["end_date", "DESC"]],
      limit: 3,
    });

    const seassonIds = last3Seassons.map((s: any) => s.id);

    // 2. Obtener todas las vueltas de carreras en este circuito, rondas tipo 8, riders dados
    const raceLaps: any[] = await Lap.findAll({
      where: {
        id_rider: riders_ids,
      },
      include: [
        {
          model: Round,
          as: "round",
          required: true,
          where: {
            id_type: 8,
          },
          include: [
            {
              model: Race,
              as: "race",
              required: true,
              where: {
                id_seasson: seassonIds,
                id_circuit: id_circuit,
              },
            },
          ],
        },
      ],
    });

    // 3. Agrupar vueltas por carrera y rider
    const lapsByRaceAndRider = new Map<number, Map<number, any[]>>();
    for (const lap of raceLaps) {
      const raceId = lap.round.race.id;
      const riderId = lap.id_rider;

      if (!lapsByRaceAndRider.has(raceId)) {
        lapsByRaceAndRider.set(raceId, new Map());
      }
      const raceMap = lapsByRaceAndRider.get(raceId)!;

      if (!raceMap.has(riderId)) {
        raceMap.set(riderId, []);
      }

      raceMap.get(riderId)!.push(lap);
    }

    // 4. Calcular estadísticas por corredor a través de las 3 carreras
    const riderStats = new Map<number, any>();

    for (const riderId of riders_ids) {
      let minTime = Infinity;
      let maxSpeed = 0;
      let bestSectors = [Infinity, Infinity, Infinity, Infinity];
      let bestPosition = Infinity;

      for (const [raceId, ridersLaps] of lapsByRaceAndRider.entries()) {
        const riderLaps = ridersLaps.get(riderId);
        if (!riderLaps) continue;

        // Mejor vuelta
        for (const lap of riderLaps) {
          if (lap.total_time && lap.total_time < minTime) {
            minTime = lap.total_time;
          }

          if (lap.top_speed && lap.top_speed > maxSpeed) {
            maxSpeed = lap.top_speed;
          }

          if (lap.sector1 && lap.sector1 < bestSectors[0])
            bestSectors[0] = lap.sector1;
          if (lap.sector2 && lap.sector2 < bestSectors[1])
            bestSectors[1] = lap.sector2;
          if (lap.sector3 && lap.sector3 < bestSectors[2])
            bestSectors[2] = lap.sector3;
          if (lap.sector4 && lap.sector4 < bestSectors[3])
            bestSectors[3] = lap.sector4;
        }

        // Calcular posición del rider en esta carrera
        const allRaceLaps = Array.from(ridersLaps.values()).flat();
        const positionsArray = sortLapsByRoundType(allRaceLaps, 8);
        const position = positionsArray.findIndex(
          (entry) => entry.riderId === riderId
        );

        if (position < bestPosition) {
          bestPosition = position;
        }
      }

      riderStats.set(riderId, {
        min_time: minTime,
        topSpeed: maxSpeed,
        best_seg1: bestSectors[0],
        best_seg2: bestSectors[1],
        best_seg3: bestSectors[2],
        best_seg4: bestSectors[3],
        ideal_lap:
          bestSectors[0] + bestSectors[1] + bestSectors[2] + bestSectors[3],
        bestPosition: bestPosition,
      });
    }

    // 5. Obtener las 2 últimas carreras en el circuito
    const lastRaces = await Race.findAll({
      where: {
        id_circuit: id_circuit,
        id_seasson: seassonIds,
      },
      order: [["day", "DESC"]],
      limit: 2,
    });

    const lastRaceRiderStats = new Map<number, any>();
    const previousLastRaceStats = new Map<number, any>();

    const lastRaceIds = lastRaces.map((r: any) => r.id);

    const rounds = await Round.findAll({
      where: {
        id_type: 8,
        id_race: lastRaceIds,
      },
    });

    const roundIds = rounds.map((r: any) => r.id);

    const laps: any = await Lap.findAll({
      where: {
        id_round: roundIds,
        id_rider: riders_ids,
      },
    });

    // Agrupar por carrera y rider
    const lapsByRace = new Map<number, Map<number, any[]>>();
    for (const lap of laps) {
      const round: any = rounds.find((r: any) => r.id === lap.id_round);
      if (!round) continue;

      const raceId = round.id_race;
      const riderId = lap.id_rider;

      if (!lapsByRace.has(raceId)) {
        lapsByRace.set(raceId, new Map());
      }

      const ridersMap = lapsByRace.get(raceId)!;

      if (!ridersMap.has(riderId)) {
        ridersMap.set(riderId, []);
      }

      ridersMap.get(riderId)!.push(lap);
    }

    // Calcular stats por carrera
    for (const [index, raceId] of lastRaceIds.entries()) {
      const riderMap = lapsByRace.get(raceId);
      if (!riderMap) continue;

      const mapToUse = index === 0 ? lastRaceRiderStats : previousLastRaceStats;

      for (const riderId of riders_ids) {
        const riderLaps = riderMap.get(riderId) || [];
        if (!riderLaps.length) continue;

        let minTime = Math.min(
          ...riderLaps.map((lap: any) => lap.total_time || Infinity)
        );
        let maxSpeed = Math.max(
          ...riderLaps.map((lap: any) => lap.top_speed || 0)
        );
        let bestSeg1 = Math.min(
          ...riderLaps.map((lap: any) => lap.sector1 || Infinity)
        );
        let bestSeg2 = Math.min(
          ...riderLaps.map((lap: any) => lap.sector2 || Infinity)
        );
        let bestSeg3 = Math.min(
          ...riderLaps.map((lap: any) => lap.sector3 || Infinity)
        );
        let bestSeg4 = Math.min(
          ...riderLaps.map((lap: any) => lap.sector4 || Infinity)
        );

        const total = riderLaps.reduce(
          (sum, lap) => sum + (lap.total_time || 0),
          0
        );

        const allLaps = Array.from(riderMap.values()).flat();
        const sortedLaps = sortLapsByRoundType(allLaps, 8);
        const position = sortedLaps.findIndex(
          (entry) => entry.riderId === riderId
        );
        mapToUse.set(riderId, {
          min_time: minTime,
          topSpeed: maxSpeed,
          best_seg1: bestSeg1,
          best_seg2: bestSeg2,
          best_seg3: bestSeg3,
          best_seg4: bestSeg4,
          ideal_lap: bestSeg1 + bestSeg2 + bestSeg3 + bestSeg4,
          bestPosition: position,
        });
      }
    }

    // 6. Calcular estadísticas generales del circuito
    const allTimes = raceLaps.map((lap: any) => lap.total_time || Infinity);
    const allSpeeds = raceLaps.map((lap: any) => lap.top_speed || 0);

    const bestSeg1 = Math.min(
      ...raceLaps.map((lap: any) => lap.sector1 || Infinity)
    );
    const bestSeg2 = Math.min(
      ...raceLaps.map((lap: any) => lap.sector2 || Infinity)
    );
    const bestSeg3 = Math.min(
      ...raceLaps.map((lap: any) => lap.sector3 || Infinity)
    );
    const bestSeg4 = Math.min(
      ...raceLaps.map((lap: any) => lap.sector4 || Infinity)
    );

    const circuitStats = {
      min_time: Math.min(...allTimes),
      topSpeed: Math.max(...allSpeeds),
      best_seg1: bestSeg1,
      best_seg2: bestSeg2,
      best_seg3: bestSeg3,
      best_seg4: bestSeg4,
      ideal_lap: bestSeg1 + bestSeg2 + bestSeg3 + bestSeg4,
    };

    // 8. Calcular evolución por rider
    const evolution = new Map<number, any>();

    // Ordenamos las 3 carreras por fecha descendente
    const last3Races = Array.from(lapsByRaceAndRider.keys()).sort(
      (a, b) => b - a
    );

    for (const riderId of riders_ids) {
      const minTimes: number[] = [];
      const topSpeeds: number[] = [];
      const totalTimes: number[] = [];
      const idealLaps: number[] = [];

      for (const raceId of last3Races) {
        const riderLaps = lapsByRaceAndRider.get(raceId)?.get(riderId) || [];

        if (riderLaps.length > 0) {
          const minTime = Math.min(
            ...riderLaps.map((lap: any) => lap.total_time || Infinity)
          );
          const topSpeed = Math.max(
            ...riderLaps.map((lap: any) => lap.top_speed || 0)
          );
          const totalTime = riderLaps.reduce(
            (sum, lap) => sum + (lap.total_time || 0),
            0
          );

          const bestSeg1 = Math.min(
            ...riderLaps.map((lap: any) =>
              lap.sector1 != null ? lap.sector1 : Infinity
            )
          );
          const bestSeg2 = Math.min(
            ...riderLaps.map((lap: any) =>
              lap.sector2 != null ? lap.sector2 : Infinity
            )
          );
          const bestSeg3 = Math.min(
            ...riderLaps.map((lap: any) =>
              lap.sector3 != null ? lap.sector3 : Infinity
            )
          );
          const bestSeg4 = Math.min(
            ...riderLaps.map((lap: any) =>
              lap.sector4 != null ? lap.sector4 : Infinity
            )
          );

          const idealLap = [bestSeg1, bestSeg2, bestSeg3, bestSeg4].includes(
            Infinity
          )
            ? 0
            : bestSeg1 + bestSeg2 + bestSeg3 + bestSeg4;

          minTimes.push(minTime);
          topSpeeds.push(topSpeed);
          totalTimes.push(totalTime);
          idealLaps.push(idealLap);
        } else {
          // Si no hay datos, se pone 0
          minTimes.push(0);
          topSpeeds.push(0);
          totalTimes.push(0);
          idealLaps.push(0);
        }
      }

      evolution.set(riderId, {
        minTime: minTimes,
        topSpeed: topSpeeds,
        totalTime: totalTimes,
        idealLap: idealLaps,
      });
    }

    const notes = await CircuitNote.findAll({
      where: {
        id_circuit: id_circuit,
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
          circuitStats: circuitStats,
          riderStats: Object.fromEntries(riderStats),
          lastRiderStats: Object.fromEntries(lastRaceRiderStats),
          previousLastRiderStats: Object.fromEntries(previousLastRaceStats),
          evolution: Object.fromEntries(evolution),
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
    const { id_circuit, id_rider } = req.params;
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

    const newNote: any = await CircuitNote.create({
      id_circuit,
      message,
      file: url,
      id_user: user.id,
      id_rider,
      id_licence: licence.id,
    });

    const realNote: any = await CircuitNote.findOne({
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

    const note = await CircuitNote.findByPk(id_note);

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
      const existingNote: any = await CircuitNote.findByPk(id_note);
      if (existingNote && existingNote.file && deleteImage) {
        url = null;
      } else {
        url = existingNote ? existingNote.file : null;
      }
    }

    const newNote: any = await CircuitNote.update(
      {
        message,
        file: url,
      },
      {
        where: { id: id_note },
        returning: true,
      }
    );

    const realNote: any = await CircuitNote.findOne({
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
