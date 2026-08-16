// Google Maps Drawing kutubxonasi uchun qo'shimcha tiplar
// (@types/google.maps da drawing namespace mavjud emas)

declare namespace google.maps.drawing {
  class DrawingManager {
    constructor(options?: {
      drawingMode?: any;
      drawingControl?: boolean;
      drawingControlOptions?: any;
      markerOptions?: any;
      polygonOptions?: any;
      circleOptions?: any;
      rectangleOptions?: any;
      polylineOptions?: any;
      map?: google.maps.Map | null;
    });
    setMap(map: google.maps.Map | null): void;
    setDrawingMode(mode: any): void;
    getDrawingMode(): any;
  }

  enum OverlayType {
    MARKER = "marker",
    POLYGON = "polygon",
    CIRCLE = "circle",
    RECTANGLE = "rectangle",
    POLYLINE = "polyline",
  }
}
