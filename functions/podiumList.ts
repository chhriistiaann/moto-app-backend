export const sortLapsByRoundType = (laps: any[], roundTypeId: number) => {
  if (roundTypeId === 8) {
    return sortLapsByTotalTime(laps);
  } else {
    return sortLapsByMinTime(laps, roundTypeId);
  }
};

// Para rondas tipo 8: ordenar por tiempo total (suma de laps)
const sortLapsByTotalTime = (allLaps: any[]) => {
  // Filtrar solo laps tipo 8
  const filtered = allLaps.filter((lap) => lap.round?.id_type === 8);

  // Map para contar laps y sumar totalTime por rider
  const lapsCountByRider = new Map<number, number>();
  const totalTimeByRider = new Map<number, number>();
  const minTimeByRider = new Map<number, number>();

  for (const lap of filtered) {
    const riderId = lap.id_rider;
    const lapTime = lap.total_time ?? 0;

    // Contar vueltas
    lapsCountByRider.set(riderId, (lapsCountByRider.get(riderId) ?? 0) + 1);

    // Sumar totalTime
    totalTimeByRider.set(
      riderId,
      (totalTimeByRider.get(riderId) ?? 0) + lapTime
    );

    // Guardar minTime (mejor vuelta)
    if (
      !minTimeByRider.has(riderId) ||
      lapTime < minTimeByRider.get(riderId)!
    ) {
      minTimeByRider.set(riderId, lapTime);
    }
  }

  const maxLaps = Math.max(...lapsCountByRider.values());

  const fullRiders: any[] = [];
  const incompleteRiders: any[] = [];

  for (const riderId of totalTimeByRider.keys()) {
    const riderLapCount = lapsCountByRider.get(riderId) ?? 0;
    const totalTime = totalTimeByRider.get(riderId)!;
    const minTime = minTimeByRider.get(riderId)!;

    const riderData = {
      riderId,
      totalTime,
      minTime,
      completedAllLaps: riderLapCount === maxLaps,
    };

    if (riderLapCount === maxLaps) {
      fullRiders.push(riderData);
    } else {
      incompleteRiders.push(riderData);
    }
  }

  // Ordenar full riders por totalTime ascendente
  fullRiders.sort((a, b) => a.totalTime - b.totalTime);
  // Ordenar incomplete riders también por totalTime ascendente
  incompleteRiders.sort((a, b) => b.totalTime - a.totalTime);

  return [...fullRiders, ...incompleteRiders];
};

// Para rondas tipo 1 a 7: ordenar por mejor vuelta (minTime)
const sortLapsByMinTime = (allLaps: any[], roundTypeId: number) => {
  // Filtrar laps del tipo específico
  const filtered = allLaps.filter((lap) => lap.round?.id_type === roundTypeId);

  const bestLapByRider = new Map<number, number>();
  const totalTimeByRider = new Map<number, number>();

  for (const lap of filtered) {
    const riderId = lap.id_rider;
    const lapTime = lap.total_time ?? Infinity;

    // Mejor vuelta
    if (
      !bestLapByRider.has(riderId) ||
      lapTime < bestLapByRider.get(riderId)!
    ) {
      bestLapByRider.set(riderId, lapTime);
    }

    // Sumar totalTime (igual que antes)
    totalTimeByRider.set(
      riderId,
      (totalTimeByRider.get(riderId) ?? 0) + lapTime
    );
  }

  // Crear array con ambos tiempos
  const sorted = Array.from(bestLapByRider.entries())
    .map(([riderId, minTime]) => ({
      riderId,
      minTime,
      totalTime: totalTimeByRider.get(riderId) ?? 0,
    }))
    // Ordenar por mejor vuelta (minTime) ascendente
    .sort((a, b) => a.minTime - b.minTime);

  return sorted;
};
