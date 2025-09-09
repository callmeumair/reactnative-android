export function computeLeaveByTime(params: {
  etaSeconds: number;
  weatherDelaySeconds?: number;
  bufferMinutes?: number;
  arrivalTime: Date;
}): Date {
  const {etaSeconds, weatherDelaySeconds = 0, bufferMinutes = 5, arrivalTime} = params;
  const totalSeconds = etaSeconds + weatherDelaySeconds + bufferMinutes * 60;
  return new Date(arrivalTime.getTime() - totalSeconds * 1000);
}

