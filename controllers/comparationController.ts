import { Request, Response } from "express";
import Lap from "../models/dbModels/lap";
import Round from "../models/dbModels/round";
import RoundType from "../models/dbModels/roundType";
import { sortLapsByRoundType } from "../functions/podiumList";
import Rider from "../models/dbModels/rider";

// export const getComparation = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { first_rider, second_rider, race } = req.body;

//     // 1. Obtener todas las vueltas de ambas carreras (todos los corredores)
//     const raceLaps: any[] = await Lap.findAll({
//       include: [
//         {
//           model: Round,
//           required: true,
//           include: [{ model: RoundType, required: true }],
//           where: { id_race: race },
//         },
//       ],
//     });

//     // 2. Filtrar solo las vueltas de cada corredor
//     const firstLaps = raceLaps.filter((lap) => lap.id_rider === first_rider);
//     const secondLaps = raceLaps.filter((lap) => lap.id_rider === second_rider);

//     // 3. Agrupar por tipo de ronda
//     const groupByType = (laps: any[]): Map<number, any[]> => {
//       const map = new Map<number, any[]>();
//       laps.forEach((lap) => {
//         const typeId = lap.round.round_type.id;
//         if (!map.has(typeId)) map.set(typeId, []);
//         map.get(typeId)!.push(lap);
//       });
//       return map;
//     };

//     const firstMap = groupByType(firstLaps);
//     const secondMap = groupByType(secondLaps);

//     // 4. Tipos de ronda en común
//     const commonTypes = Array.from(firstMap.keys()).filter((type) =>
//       secondMap.has(type)
//     );

//     // 5. Rondas asociadas por tipo
//     const firstRiderRounds = new Map<number, any>();
//     const secondRiderRounds = new Map<number, any>();
//     for (const typeId of commonTypes) {
//       firstRiderRounds.set(typeId, firstMap.get(typeId)![0].round);
//       secondRiderRounds.set(typeId, secondMap.get(typeId)![0].round);
//     }

//     // 6. Calcular posición REAL las rondas entre TODOS los corredores
//     const calcFinalPosition = (
//       allLaps: any[],
//       riderId: number,
//       roundTypeId: number,
//       minLapsThresholdRatio = 0.9 // Ejemplo: mínimo 90% de vueltas del máximo para contar
//     ): number => {
//       // Filtrar vueltas por tipo de ronda
//       const filtered = allLaps.filter(
//         (lap) => lap.round?.round_type?.id === roundTypeId
//       );

//       // Contar número de vueltas por piloto
//       const lapsCountByRider = new Map<number, number>();
//       filtered.forEach((lap) => {
//         const id = lap.id_rider;
//         lapsCountByRider.set(id, (lapsCountByRider.get(id) ?? 0) + 1);
//       });

//       // Calcular el número máximo de vueltas hechas por algún piloto
//       const maxLaps = Math.max(...lapsCountByRider.values());

//       // Calcular el mínimo de vueltas requeridas (ej. 90%)
//       const minLaps = Math.ceil(maxLaps * minLapsThresholdRatio);

//       // Separar pilotos válidos e inválidos según el mínimo de vueltas
//       const totalTimesFullRiders: [number, number][] = [];
//       const totalTimesIncompleteRiders: [number, number][] = [];

//       const totalTimesByRider = new Map<number, number>();

//       for (const lap of filtered) {
//         const id = lap.id_rider;
//         const isValid = (lapsCountByRider.get(id) ?? 0) >= minLaps;
//         const current = totalTimesByRider.get(id) ?? 0;
//         totalTimesByRider.set(id, current + (lap.total_time || 0));
//       }

//       // Clasificar a válidos e inválidos solo si el tipo de ronda es 8
//       if (roundTypeId === 8) {
//         for (const [riderId, totalTime] of totalTimesByRider.entries()) {
//           const isValid = (lapsCountByRider.get(riderId) ?? 0) >= minLaps;
//           const entry: [number, number] = [riderId, totalTime];
//           if (isValid) {
//             totalTimesFullRiders.push(entry);
//           } else {
//             totalTimesIncompleteRiders.push(entry);
//           }
//         }
//       } else {
//         // Si no es tipo 8, todos son válidos
//         for (const [riderId, totalTime] of totalTimesByRider.entries()) {
//           totalTimesFullRiders.push([riderId, totalTime]);
//         }
//       }

//       // Ordenar válidos primero por tiempo, luego inválidos
//       totalTimesFullRiders.sort((a, b) => a[1] - b[1]);
//       totalTimesIncompleteRiders.sort((a, b) => a[1] - b[1]);

//       const sorted = [...totalTimesFullRiders, ...totalTimesIncompleteRiders];

//       // Buscar posición del rider
//       const pos = sorted.findIndex(([id]) => id === riderId);

//       // Si no está o no cumple, devolver 0
//       return pos >= 0 ? pos + 1 : 0;
//     };

//     const calcQ2 = (allLaps: any[], riderId: number): number => {
//       const filtered = allLaps.filter((lap) => lap.round?.round_type?.id === 5);

//       const bestLapByRider = new Map<number, number>();

//       for (const lap of filtered) {
//         const id = lap.id_rider;
//         const lapTime = lap.total_time ?? Infinity;

//         if (!bestLapByRider.has(id) || lapTime < bestLapByRider.get(id)!) {
//           bestLapByRider.set(id, lapTime);
//         }
//       }

//       const sorted = Array.from(bestLapByRider.entries()).sort(
//         (a, b) => a[1] - b[1]
//       );

//       const pos = sorted.findIndex(([id]) => id === riderId);
//       return pos >= 0 ? pos + 1 : 0;
//     };

//     const firstQ2 = calcQ2(firstLaps, first_rider);
//     const secondQ2 = calcQ2(secondLaps, second_rider);

//     // 7. Calcular estadísticas por tipo
//     const calcStats = (
//       lapsByType: Map<number, any[]>,
//       id: number,
//       raceLaps: any[]
//     ): Map<number, any> => {
//       const statsMap = new Map<number, any>();
//       for (const [typeId, laps] of lapsByType.entries()) {
//         const totalTimes = laps.map((l) => l.total_time || 0);
//         const topSpeeds = laps.map((l) => l.top_speed || 0);
//         const sectors1 = laps.map((l) => l.sector1 || 0);
//         const sectors2 = laps.map((l) => l.sector2 || 0);
//         const sectors3 = laps.map((l) => l.sector3 || 0);
//         const sectors4 = laps.map((l) => l.sector4 || 0);

//         const avg = (arr: number[]) =>
//           arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
//         const best = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);

//         const idealLap =
//           best(sectors1) + best(sectors2) + best(sectors3) + best(sectors4);

//         statsMap.set(typeId, {
//           min_time: Math.min(...totalTimes),
//           topSpeed: Math.max(...topSpeeds),
//           avg_seg1: avg(sectors1),
//           avg_seg2: avg(sectors2),
//           avg_seg3: avg(sectors3),
//           avg_seg4: avg(sectors4),
//           avg_total: avg(totalTimes),
//           best_seg1: best(sectors1),
//           best_seg2: best(sectors2),
//           best_seg3: best(sectors3),
//           best_seg4: best(sectors4),
//           ideal_lap: idealLap,
//           bestPosition: calcFinalPosition(raceLaps, id, typeId),
//         });
//       }
//       return statsMap;
//     };

//     const firstRiderStats = calcStats(firstMap, first_rider, firstLaps);
//     const secondRiderStats = calcStats(secondMap, second_rider, secondLaps);

//     // 8. Laps por tipo de ronda (solo comunes)
//     const firstRiderLaps = new Map<number, any[]>();
//     const secondRiderLaps = new Map<number, any[]>();
//     for (const typeId of commonTypes) {
//       firstRiderLaps.set(typeId, firstMap.get(typeId)!);
//       secondRiderLaps.set(typeId, secondMap.get(typeId)!);
//     }

//     const formattedCommonTypes = commonTypes.map((typeId) => {
//       const type = firstMap.get(typeId)![0].round.round_type;
//       return {
//         id: type.id,
//         name: type.name,
//       };
//     });

//     // 9. Enviar respuesta
//     return res.status(200).json({
//       code: "SUCCESS",
//       data: {
//         data: {
//           roundTypes: formattedCommonTypes,
//           firstRiderRounds: Object.fromEntries(firstRiderRounds),
//           secondRiderRounds: Object.fromEntries(secondRiderRounds),
//           firstQ2,
//           secondQ2,
//           firstRiderStats: Object.fromEntries(firstRiderStats),
//           secondRiderStats: Object.fromEntries(secondRiderStats),
//           firstRiderLaps: Object.fromEntries(firstRiderLaps),
//           secondRiderLaps: Object.fromEntries(secondRiderLaps),
//         },
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       code: "INTERNAL_SERVER_ERROR",
//       message: "An unexpected error occurred. Please try again later.",
//     });
//   }
// };

export const getComparation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { riders, race } = req.body; // riders: number[], race: number

    console.log("Riders:", riders);

    // 1. Obtener todas las laps de los riders dentro de ese race
    const allLaps = await Lap.findAll({
      include: [
        {
          model: Round,
          required: true,
          where: { id_race: race },
          include: [
            {
              model: RoundType,
              required: true,
            },
          ],
        },
      ],
    });

    // 2. Agrupar laps por round
    const lapsByRound = new Map<number, any[]>();

    allLaps.forEach((lap: any) => {
      const roundId = lap.round.id;
      if (!lapsByRound.has(roundId)) lapsByRound.set(roundId, []);
      lapsByRound.get(roundId)!.push(lap);
    });

    const statsByRound: Map<number, any> = new Map();
    const q2PositionsList: any[] = [];

    for (const [roundId, laps] of lapsByRound.entries()) {
      statsByRound.set(roundId, {
        pos: [],
        min_time: [],
        topSpeed: [],
        avg_seg1: [],
        avg_seg2: [],
        avg_seg3: [],
        avg_seg4: [],
        avg_total: [],
        ideal_lap: [],
        best_seg1: [],
        best_seg2: [],
        best_seg3: [],
        best_seg4: [],
        laps: [],
      });

      const roundType = laps[0].round.id_type;
      const roundPositions = sortLapsByRoundType(laps, roundType);

      for (const riderId of riders) {
        if (laps[0].round.id_type === 5) {
          const q2Positions = sortLapsByRoundType(laps, 5);
          const q2Position = q2Positions.findIndex(
            (entry) => entry.riderId === riderId
          );

          q2PositionsList.push({
            id: riderId,
            value: q2Position + 1,
          });
        }

        const position = roundPositions.findIndex(
          (entry) => entry.riderId === riderId
        );

        const riderLaps = laps.filter((lap) => lap.id_rider === riderId);
        const totalTimes = riderLaps.map((l) => l.total_time || 0);
        const topSpeeds = riderLaps.map((l) => l.top_speed || 0);
        const sectors1 = riderLaps.map((l) => l.sector1 || 0);
        const sectors2 = riderLaps.map((l) => l.sector2 || 0);
        const sectors3 = riderLaps.map((l) => l.sector3 || 0);
        const sectors4 = riderLaps.map((l) => l.sector4 || 0);

        const avg = (arr: number[]) =>
          arr.length > 0
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
            : 0;
        const best = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);

        const idealLap =
          best(sectors1) + best(sectors2) + best(sectors3) + best(sectors4);

        statsByRound
          .get(roundId)!
          .pos.push({ id: riderId, value: position + 1 });
        statsByRound
          .get(roundId)!
          .min_time.push({ id: riderId, value: Math.min(...totalTimes) });
        statsByRound
          .get(roundId)!
          .topSpeed.push({ id: riderId, value: Math.max(...topSpeeds) });
        statsByRound
          .get(roundId)!
          .avg_seg1.push({ id: riderId, value: avg(sectors1) });
        statsByRound
          .get(roundId)!
          .avg_seg2.push({ id: riderId, value: avg(sectors2) });
        statsByRound
          .get(roundId)!
          .avg_seg3.push({ id: riderId, value: avg(sectors3) });
        statsByRound
          .get(roundId)!
          .avg_seg4.push({ id: riderId, value: avg(sectors4) });
        statsByRound
          .get(roundId)!
          .avg_total.push({ id: riderId, value: avg(totalTimes) });
        statsByRound
          .get(roundId)!
          .best_seg1.push({ id: riderId, value: best(sectors1) });
        statsByRound
          .get(roundId)!
          .best_seg2.push({ id: riderId, value: best(sectors2) });
        statsByRound
          .get(roundId)!
          .best_seg3.push({ id: riderId, value: best(sectors3) });
        statsByRound
          .get(roundId)!
          .best_seg4.push({ id: riderId, value: best(sectors4) });
        statsByRound.get(roundId)!.ideal_lap.push({
          id: riderId,
          value: idealLap,
        });
        statsByRound.get(roundId)!.laps.push({
          id: riderId,
          laps: riderLaps,
          totalTime: riderLaps.reduce(
            (sum, lap) => sum + (lap.total_time || 0),
            0
          ),
        });
      }
    }

    // obtener las rondas que coinciden con los riders
    const availableRounds = Array.from(lapsByRound.keys()).filter((roundId) => {
      const laps = lapsByRound.get(roundId)!;
      return riders.every((riderId: any) =>
        laps.some((lap: any) => lap.id_rider === riderId)
      );
    });

    const availableRoundsModels: any = await Round.findAll({
      where: {
        id: availableRounds,
      },
      include: [
        {
          model: RoundType,
          required: true,
        },
      ],
    });

    const formattedAvailableRounds = availableRoundsModels.map(
      (round: any) => ({
        id: round.id,
        temperature: round.temperature,
        wind: round.wind,
        humidity: round.humidity,
        start_time: round.start_time,
        round_type: {
          id: round.round_type.id,
          name: round.round_type.name,
        },
      })
    );

    const statsObject = Object.fromEntries(statsByRound.entries());

    return res.status(200).json({
      code: "SUCCESS",
      data: {
        availableRounds: formattedAvailableRounds,
        stats: statsObject,
        q2: q2PositionsList,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error. Please try again later.",
    });
  }
};
