export const EarthMass = 5972190e18;
export const EarthRadius = 6371 * 1000;
export const G = 6.673e-11;
export const MetersPerPixel = EarthRadius / 10;

export function toReal(pixels) {
    return pixels * MetersPerPixel;
}

export function fromReal(meters) {
    return meters / MetersPerPixel;
}