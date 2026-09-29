export interface MapPoint {
  lng: number;
  lat: number;
}
export interface MapInfoWindow {
  addEventListener(event: 'close', callback: () => void): void;
}
export interface MapIcon {
  getIconUrl(): string;
}
export interface MapPixelPoint {
  x: number;
  y: number;
}
export interface MapMarker {
  setIcon(icon: MapIcon): void;
  addEventListener(event: 'click', callback: () => void): void;
}
export interface DeviceMap {
  centerAndZoom(point: MapPoint, zoom: number): void;
  enableScrollWheelZoom(): void;
  clearOverLays(): void;
  addOverLay(marker: MapMarker): void;
  setViewport(points: MapPoint[]): void;
  checkResize(): void;
  closeInfoWindow(): void;
  openInfoWindow(info: MapInfoWindow, point: MapPoint): void;
  remove?: () => void;
}
export interface Tianditu {
  Map: new (container: string) => DeviceMap;
  LngLat: new (longitude: number, latitude: number) => MapPoint;
  Point: new (x: number, y: number) => MapPixelPoint;
  Icon: new (options: {
    className?: string;
    iconUrl: string;
    iconSize: MapPixelPoint;
    iconAnchor: MapPixelPoint;
  }) => MapIcon;
  Marker: new (point: MapPoint, options?: { icon: MapIcon }) => MapMarker;
  InfoWindow: new (
    content?: HTMLElement | string,
    options?: {
      minWidth: number;
      maxWidth: number;
      autoPan?: boolean;
      closeButton?: boolean;
      offset?: MapPixelPoint;
      autoPanPadding?: MapPixelPoint;
    },
  ) => MapInfoWindow;
}

declare global {
  interface Window {
    T: Tianditu;
  }
}
