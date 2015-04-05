export const EarthMass = 5972190e18; // kilograms
export const EarthRadius = 6371000; // meters
export const G = 6.673e-11;
export const MetersPerPixel = EarthRadius / 10;
export const LightSpeed = 299792458; // m/s
export const TimeScale = 20; // Simulated seconds in real seconds.

export function toReal(pixels) {
    return pixels * MetersPerPixel;
}

export function fromReal(meters) {
    return meters / MetersPerPixel;
}