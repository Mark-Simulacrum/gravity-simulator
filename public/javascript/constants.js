export const EarthMass = 5972190e18; // kilograms
export const EarthRadius = 6371000; // meters
export const G = 6.673e-11;
export const MetersPerPixel = EarthRadius / 10;
export const LightSpeed = 299792458; // m/s
export const TimeScale = 20; // Simulated seconds in real seconds.

export const KilometersPerPixel = MetersPerPixel / 1000;
export const MilesPerPixel = KilometersPerPixel * 0.62;
export const EarthRadiiPerPixel = MetersPerPixel / EarthRadius;

const selector = document.getElementById("measurement-selector");
const options = [MilesPerPixel, KilometersPerPixel, EarthRadiiPerPixel];
const textOptions = ["mi", "km", "earth-radii"];
export function toDisplayUnit(pixels) {
	const selectedIndex = selector.selectedIndex;

	return pixels * options[selectedIndex];
}

export function getDisplayUnit() {
	return textOptions[selector.selectedIndex];
}

export function toReal(pixels) {
    return pixels * MetersPerPixel;
}

export function fromReal(meters) {
    return meters / MetersPerPixel;
}