import { Request, Response } from "express";
import Lap from "../models/dbModels/lap";
import Round from "../models/dbModels/round";
import RoundType from "../models/dbModels/roundType";

export const getComparation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { first_rider, second_rider, first_race, second_race } = req.body;

    // 1. Obtener todas las vueltas de ambas carreras (todos los corredores)
    const allFirstRaceLaps: any[] = await Lap.findAll({
      include: [
        {
          model: Round,
          required: true,
          include: [{ model: RoundType, required: true }],
          where: { id_race: first_race },
        },
      ],
    });

    const allSecondRaceLaps: any[] = await Lap.findAll({
      include: [
        {
          model: Round,
          required: true,
          include: [{ model: RoundType, required: true }],
          where: { id_race: second_race },
        },
      ],
    });

    // 2. Filtrar solo las vueltas de cada corredor
    const firstLaps = allFirstRaceLaps.filter(
      (lap) => lap.id_rider === first_rider
    );
    const secondLaps = allSecondRaceLaps.filter(
      (lap) => lap.id_rider === second_rider
    );

    // 3. Agrupar por tipo de ronda
    const groupByType = (laps: any[]): Map<number, any[]> => {
      const map = new Map<number, any[]>();
      laps.forEach((lap) => {
        const typeId = lap.round.round_type.id;
        if (!map.has(typeId)) map.set(typeId, []);
        map.get(typeId)!.push(lap);
      });
      return map;
    };

    const firstMap = groupByType(firstLaps);
    const secondMap = groupByType(secondLaps);

    // 4. Tipos de ronda en común
    const commonTypes = Array.from(firstMap.keys()).filter((type) =>
      secondMap.has(type)
    );

    // 5. Rondas asociadas por tipo
    const firstRiderRounds = new Map<number, any>();
    const secondRiderRounds = new Map<number, any>();
    for (const typeId of commonTypes) {
      firstRiderRounds.set(typeId, firstMap.get(typeId)![0].round);
      secondRiderRounds.set(typeId, secondMap.get(typeId)![0].round);
    }

    // 6. Calcular posición REAL las rondas entre TODOS los corredores
    const calcFinalPosition = (
      allLaps: any[],
      riderId: number,
      roundTypeId: number,
      minLapsThresholdRatio = 0.9 // Ejemplo: mínimo 90% de vueltas del máximo para contar
    ): number => {
      // Filtrar vueltas por tipo de ronda
      const filtered = allLaps.filter(
        (lap) => lap.round?.round_type?.id === roundTypeId
      );

      // Contar número de vueltas por piloto
      const lapsCountByRider = new Map<number, number>();
      filtered.forEach((lap) => {
        const id = lap.id_rider;
        lapsCountByRider.set(id, (lapsCountByRider.get(id) ?? 0) + 1);
      });

      // Número máximo de vueltas completadas por algún piloto
      const maxLaps = Math.max(...lapsCountByRider.values());

      // Umbral mínimo de vueltas para contar (por ejemplo 90% de maxLaps)
      const minLaps = Math.ceil(maxLaps * minLapsThresholdRatio);

      // Sumar tiempos solo de pilotos que cumplen con el mínimo de vueltas
      const totalTimesByRider = new Map<number, number>();
      for (const lap of filtered) {
        const id = lap.id_rider;
        if ((lapsCountByRider.get(id) ?? 0) >= minLaps) {
          const current = totalTimesByRider.get(id) ?? 0;
          totalTimesByRider.set(id, current + (lap.total_time || 0));
        }
      }

      // Ordenar por tiempo ascendente
      const sorted = Array.from(totalTimesByRider.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      // Buscar la posición del riderId
      const pos = sorted.findIndex(([id]) => id === riderId);

      // Si no está o no cumple vueltas, devuelve 0 (fuera de posición)
      return pos >= 0 ? pos + 1 : 0;
    };

    const calcQ2 = (allLaps: any[], riderId: number): number => {
      const filtered = allLaps.filter((lap) => lap.round?.round_type?.id === 5);

      const bestLapByRider = new Map<number, number>();

      for (const lap of filtered) {
        const id = lap.id_rider;
        const lapTime = lap.total_time ?? Infinity;

        if (!bestLapByRider.has(id) || lapTime < bestLapByRider.get(id)!) {
          bestLapByRider.set(id, lapTime);
        }
      }

      const sorted = Array.from(bestLapByRider.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      const pos = sorted.findIndex(([id]) => id === riderId);
      return pos >= 0 ? pos + 1 : 0;
    };

    const firstQ2 = calcQ2(allFirstRaceLaps, first_rider);
    const secondQ2 = calcQ2(allSecondRaceLaps, second_rider);

    // 7. Calcular estadísticas por tipo
    const calcStats = (
      lapsByType: Map<number, any[]>,
      id: number,
      raceLaps: any[]
    ): Map<number, any> => {
      const statsMap = new Map<number, any>();
      for (const [typeId, laps] of lapsByType.entries()) {
        const totalTimes = laps.map((l) => l.total_time || 0);
        const topSpeeds = laps.map((l) => l.top_speed || 0);
        const sectors1 = laps.map((l) => l.sector1 || 0);
        const sectors2 = laps.map((l) => l.sector2 || 0);
        const sectors3 = laps.map((l) => l.sector3 || 0);
        const sectors4 = laps.map((l) => l.sector4 || 0);

        const avg = (arr: number[]) =>
          arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const best = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);

        const idealLap =
          best(sectors1) + best(sectors2) + best(sectors3) + best(sectors4);

        statsMap.set(typeId, {
          min_time: Math.min(...totalTimes),
          topSpeed: Math.max(...topSpeeds),
          avg_seg1: avg(sectors1),
          avg_seg2: avg(sectors2),
          avg_seg3: avg(sectors3),
          avg_seg4: avg(sectors4),
          avg_total: avg(totalTimes),
          best_seg1: best(sectors1),
          best_seg2: best(sectors2),
          best_seg3: best(sectors3),
          best_seg4: best(sectors4),
          ideal_lap: idealLap,
          bestPosition: calcFinalPosition(raceLaps, id, typeId),
        });
      }
      return statsMap;
    };

    const firstRiderStats = calcStats(firstMap, first_rider, allFirstRaceLaps);
    const secondRiderStats = calcStats(
      secondMap,
      second_rider,
      allSecondRaceLaps
    );

    // 8. Laps por tipo de ronda (solo comunes)
    const firstRiderLaps = new Map<number, any[]>();
    const secondRiderLaps = new Map<number, any[]>();
    for (const typeId of commonTypes) {
      firstRiderLaps.set(typeId, firstMap.get(typeId)!);
      secondRiderLaps.set(typeId, secondMap.get(typeId)!);
    }

    const formattedCommonTypes = commonTypes.map((typeId) => {
      const type = firstMap.get(typeId)![0].round.round_type;
      return {
        id: type.id,
        name: type.name,
      };
    });

    // 9. Enviar respuesta
    return res.status(200).json({
      code: "SUCCESS",
      data: {
        data: {
          roundTypes: formattedCommonTypes,
          firstRiderRounds: Object.fromEntries(firstRiderRounds),
          secondRiderRounds: Object.fromEntries(secondRiderRounds),
          firstQ2,
          secondQ2,
          firstRiderStats: Object.fromEntries(firstRiderStats),
          secondRiderStats: Object.fromEntries(secondRiderStats),
          firstRiderLaps: Object.fromEntries(firstRiderLaps),
          secondRiderLaps: Object.fromEntries(secondRiderLaps),
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
