export interface Train {
  currentX: number;
  currentY: number;
  trainId: string;
  timestamp: number;    // war timeStamp
  line: Line;
  lineOrigin: Station;
  lineDestination: Station;
  departureTime: number;
  arrivalTime: number;
  lastLeavingStation: Station;
  nextPendingStation: Station;
  // fromStation und toStation entfernt
}

export type Station = {
  stationName: string;
  xCoordinate: number;
  yCoordinate: number;
  arrivalTime: number;
  departureTime: number;
}


type Line = {
  name: string;
}