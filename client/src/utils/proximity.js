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

export function getBearing(fromCoord, toCoord) {
  if (!fromCoord || !toCoord || typeof fromCoord.lat !== 'number' || typeof toCoord.lat !== 'number') {
    return 0;
  }
  const lat1 = (fromCoord.lat * Math.PI) / 180;
  const lat2 = (toCoord.lat * Math.PI) / 180;
  const dLng = ((toCoord.lng - fromCoord.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

export function getCompassLabel(bearing) {
  const directions = [
    { label: 'PÓŁNOC (N)', code: 'N' },
    { label: 'PŁN-WSCHÓD (NE)', code: 'NE' },
    { label: 'WSCHÓD (E)', code: 'E' },
    { label: 'PŁD-WSCHÓD (SE)', code: 'SE' },
    { label: 'POŁUDNIE (S)', code: 'S' },
    { label: 'PŁD-ZACHÓD (SW)', code: 'SW' },
    { label: 'ZACHÓD (W)', code: 'W' },
    { label: 'PŁN-ZACHÓD (NW)', code: 'NW' },
  ];
  const idx = Math.round(bearing / 45) % 8;
  return directions[idx];
}

export function calculateProximity({ myPosition, myPlayer, players = [], radarPings = [], pingRadius = 200 }) {
  if (!myPosition || typeof myPosition.lat !== 'number') {
    return null;
  }

  const isHider = myPlayer?.role === 'HIDER';
  const isSeeker = myPlayer?.role === 'SEEKER';

  if (isHider) {
    const seekers = players.filter((p) => p.role === 'SEEKER' && p.position && typeof p.position.lat === 'number');
    if (seekers.length === 0) return null;

    let closestSeeker = null;
    let minDistance = Infinity;

    for (const seeker of seekers) {
      const dist = Math.round(getDistanceMeters(myPosition, seeker.position));
      if (dist < minDistance) {
        minDistance = dist;
        closestSeeker = seeker;
      }
    }

    if (!closestSeeker) return null;

    const distToCircleEdge = minDistance - pingRadius;
    const isInsideCircle = minDistance <= pingRadius;
    const bearing = getBearing(myPosition, closestSeeker.position);
    const compass = getCompassLabel(bearing);

    let threatLevel = 'SAFE';
    if (minDistance <= 100) threatLevel = 'CRITICAL';
    else if (minDistance <= 300) threatLevel = 'DANGER';
    else if (minDistance <= 700) threatLevel = 'CAUTION';

    return {
      type: 'HIDER_PROXIMITY',
      targetName: closestSeeker.name,
      carModel: closestSeeker.carModel,
      carColor: closestSeeker.carColor,
      carPlate: closestSeeker.carPlate,
      distance: minDistance,
      distToCircleEdge,
      isInsideCircle,
      bearing,
      compass,
      threatLevel,
    };
  }

  if (isSeeker) {
    if (!radarPings || radarPings.length === 0) return null;

    const rankedPings = radarPings
      .filter((p) => typeof p.lat === 'number')
      .map((ping) => {
        const centerDist = Math.round(getDistanceMeters(myPosition, ping));
        const radius = ping.radius || pingRadius || 200;
        const edgeDist = Math.max(0, centerDist - radius);
        const bearing = getBearing(myPosition, ping);
        const compass = getCompassLabel(bearing);

        return {
          ...ping,
          centerDist,
          edgeDist,
          isInside: centerDist <= radius,
          bearing,
          compass,
        };
      })
      .sort((a, b) => a.edgeDist - b.edgeDist);

    if (rankedPings.length === 0) return null;
    const best = rankedPings[0];

    let proximityLevel = 'FAR';
    if (best.isInside) proximityLevel = 'INSIDE';
    else if (best.edgeDist <= 150) proximityLevel = 'NEAR';
    else if (best.edgeDist <= 500) proximityLevel = 'APPROACHING';

    return {
      type: 'SEEKER_PROXIMITY',
      targetName: best.name || 'Uciekinier',
      carModel: best.carModel || 'Auto',
      carColor: best.carColor,
      carPlate: best.carPlate,
      distToCenter: best.centerDist,
      distToCircleEdge: best.edgeDist,
      isInsideCircle: best.isInside,
      bearing: best.bearing,
      compass: best.compass,
      proximityLevel,
      allTargets: rankedPings,
    };
  }

  return null;
}
