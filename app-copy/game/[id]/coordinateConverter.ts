import proj4 from "proj4";

const epsgCode = 3857;
const epsgDef =
  "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs";


export function latLngToEpsg(
  lat: number,
  lng: number
): [number, number] {
  const wgs84 = "EPSG:4326";
  const target = `EPSG:${epsgCode}`;

  proj4.defs(target, epsgDef);

  const [x, y] = proj4(wgs84, target, [lng, lat]); // note: proj4 takes [lng, lat]
  return [Math.round(x), Math.round(y)];
}

export function epsgToLatLng(
  x: number,
  y: number,
): [number, number] {
  const wgs84 = "EPSG:4326";
  const source = `EPSG:${epsgCode}`;

  proj4.defs(source, epsgDef);

  const [lng, lat] = proj4(source, wgs84, [x, y]); // proj4 returns [lng, lat]
  return [lat, lng];
}
