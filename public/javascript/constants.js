export let EarthMass = 5972190e18;
export let EarthRadius = 6371 * 1000;
export let G = 6.673e-11;
export let MetersPerPixel = EarthRadius / 10;

export function toReal(pixels) {
    return pixels * MetersPerPixel;
}

export function fromReal(meters) {
    return meters / MetersPerPixel;
}