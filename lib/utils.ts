export function autoIntegerScale(baseW: number, baseH: number) {
// Fit into viewport with integer scaling.
const vw = Math.min(window.innerWidth - 64, 1200); // leave padding
const vh = Math.min(window.innerHeight - 240, 1400);
const maxScaleW = Math.floor(vw / baseW);
const maxScaleH = Math.floor(vh / baseH);
return Math.max(1, Math.min(maxScaleW, maxScaleH));
}
