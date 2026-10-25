import { getDistanceMeters } from './proximity';

export class GpsFilter {
  constructor(options = {}) {
    this.maxAcceptableAccuracy = options.maxAcceptableAccuracy || 40;
    this.stationaryDeadband = options.stationaryDeadband || 7;
    this.minSpeedForMovement = options.minSpeedForMovement || 4.5;
    this.minSpeedForHeading = options.minSpeedForHeading || 6.0;
    this.maxFeasibleSpeed = options.maxFeasibleSpeed || 180;
    this.smoothingAlpha = options.smoothingAlpha || 0.45;

    this.smoothedPos = null;
    this.lastRawPos = null;
    this.lastTimestamp = null;
    this.lastHeading = 0;
    this.lastSpeed = 0;
    this.isMoving = false;
    this.consecutiveStationaryCount = 0;
  }

  reset() {
    this.smoothedPos = null;
    this.lastRawPos = null;
    this.lastTimestamp = null;
    this.lastHeading = 0;
    this.lastSpeed = 0;
    this.isMoving = false;
    this.consecutiveStationaryCount = 0;
  }

  calculateBearing(from, to) {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return Math.round((brng + 360) % 360);
  }

  filter(raw) {
    const now = Date.now();
    const rawAccuracy = Math.round(raw.accuracy || 15);
    const rawSpeedKmH = typeof raw.speed === 'number' && raw.speed > 0 ? Math.round(raw.speed * 3.6) : null;
    const rawHeading = typeof raw.heading === 'number' && !isNaN(raw.heading) && raw.heading >= 0 ? raw.heading : null;

    if (!this.smoothedPos || !this.lastTimestamp) {
      this.smoothedPos = { lat: raw.lat, lng: raw.lng };
      this.lastRawPos = { lat: raw.lat, lng: raw.lng };
      this.lastTimestamp = now;
      this.lastHeading = rawHeading || 0;
      this.lastSpeed = rawSpeedKmH || 0;
      this.isMoving = (rawSpeedKmH || 0) >= this.minSpeedForMovement;

      return {
        lat: this.smoothedPos.lat,
        lng: this.smoothedPos.lng,
        accuracy: rawAccuracy,
        speed: this.lastSpeed,
        heading: this.lastHeading,
        isMoving: this.isMoving,
        isStationary: !this.isMoving,
        statusLabel: this.isMoving ? `W ruchu (${this.lastSpeed} km/h)` : 'Stoi w ukryciu',
      };
    }

    const dt = Math.max(0.2, (now - this.lastTimestamp) / 1000);
    const distFromSmoothed = getDistanceMeters(this.smoothedPos, { lat: raw.lat, lng: raw.lng });

    const calculatedSpeedKmH = Math.round((distFromSmoothed / dt) * 3.6);
    if (calculatedSpeedKmH > this.maxFeasibleSpeed && distFromSmoothed > 50) {
      return {
        lat: this.smoothedPos.lat,
        lng: this.smoothedPos.lng,
        accuracy: rawAccuracy,
        speed: this.lastSpeed,
        heading: this.lastHeading,
        isMoving: this.isMoving,
        isStationary: !this.isMoving,
        statusLabel: 'Filtrowanie zakłóceń GPS',
        rejectedAnomaly: true,
      };
    }

    let currentSpeed = 0;
    if (rawSpeedKmH !== null) {
      currentSpeed = rawSpeedKmH;
    } else {
      currentSpeed = calculatedSpeedKmH;
    }

    currentSpeed = Math.min(currentSpeed, this.maxFeasibleSpeed);

    const dynamicDeadband = Math.max(this.stationaryDeadband, rawAccuracy * 0.45);

    if (distFromSmoothed < dynamicDeadband && currentSpeed < this.minSpeedForMovement) {
      this.consecutiveStationaryCount += 1;
      this.isMoving = false;
      this.lastSpeed = 0;

      this.smoothedPos = {
        lat: Number((this.smoothedPos.lat * 0.96 + raw.lat * 0.04).toFixed(6)),
        lng: Number((this.smoothedPos.lng * 0.96 + raw.lng * 0.04).toFixed(6)),
      };
    } else {
      this.consecutiveStationaryCount = 0;
      this.isMoving = true;
      this.lastSpeed = Math.max(currentSpeed, Math.round(calculatedSpeedKmH * 0.8));

      if (distFromSmoothed >= 3) {
        const calculatedBearing = this.calculateBearing(this.smoothedPos, { lat: raw.lat, lng: raw.lng });
        if (rawHeading !== null && rawHeading > 0) {
          this.lastHeading = Math.round(rawHeading * 0.6 + calculatedBearing * 0.4);
        } else {
          this.lastHeading = calculatedBearing;
        }
      }

      const dynamicAlpha = Math.max(0.3, Math.min(0.85, 1 - (rawAccuracy / 60)));
      this.smoothedPos = {
        lat: Number((this.smoothedPos.lat * (1 - dynamicAlpha) + raw.lat * dynamicAlpha).toFixed(6)),
        lng: Number((this.smoothedPos.lng * (1 - dynamicAlpha) + raw.lng * dynamicAlpha).toFixed(6)),
      };
    }

    this.lastRawPos = { lat: raw.lat, lng: raw.lng };
    this.lastTimestamp = now;

    return {
      lat: this.smoothedPos.lat,
      lng: this.smoothedPos.lng,
      accuracy: rawAccuracy,
      speed: this.lastSpeed,
      heading: this.lastHeading,
      isMoving: this.isMoving,
      isStationary: !this.isMoving,
      statusLabel: this.isMoving ? `W ruchu (${this.lastSpeed} km/h)` : 'Stoi w ukryciu',
    };
  }
}

export const defaultGpsFilter = new GpsFilter();
