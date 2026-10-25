const EARTH_RADIUS_METERS = 6371000;

export function getDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord2.lat !== 'number') {
    return Infinity;
  }

  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function isInsideZone(coord, zoneCenter, zoneRadiusMeters) {
  if (!coord || !zoneCenter || !zoneRadiusMeters) return true;
  const dist = getDistanceMeters(coord, zoneCenter);
  return dist <= zoneRadiusMeters;
}

export function fuzzCoordinate(coord, radiusMeters = 200) {
  if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
    return null;
  }

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusMeters;

  const deltaLat = (distance * Math.cos(angle)) / 111320;
  const deltaLng = (distance * Math.sin(angle)) / (111320 * Math.cos((coord.lat * Math.PI) / 180));

  return {
    lat: Number((coord.lat + deltaLat).toFixed(6)),
    lng: Number((coord.lng + deltaLng).toFixed(6)),
    radius: radiusMeters,
  };
}
