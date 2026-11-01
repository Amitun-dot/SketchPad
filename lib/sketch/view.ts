export interface View {
  zoom: number;
  panX: number;
  panY: number;
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function screenToWorld(view: View, screenX: number, screenY: number): [number, number] {
  return [(screenX - view.panX) / view.zoom, (screenY - view.panY) / view.zoom];
}

export function zoomAt(view: View, screenX: number, screenY: number, zoom: number): View {
  const next = clampZoom(zoom);
  const ratio = next / view.zoom;
  return {
    zoom: next,
    panX: screenX - (screenX - view.panX) * ratio,
    panY: screenY - (screenY - view.panY) * ratio,
  };
}

export function initialView(width: number, height: number): View {
  return { zoom: 1, panX: width / 2, panY: height / 2 };
}

export function viewsEqual(a: View, b: View): boolean {
  return a.zoom === b.zoom && a.panX === b.panX && a.panY === b.panY;
}
