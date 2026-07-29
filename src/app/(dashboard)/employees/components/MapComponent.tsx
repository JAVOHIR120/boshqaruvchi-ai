"use client";

import { useRef, useMemo, useEffect } from "react";
import Map, { MapRef, Layer, Source, Marker } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';

// Geografik doira (radius) yasash uchun yordamchi funksiya
const createGeoJSONCircle = function(center: [number, number], radiusInMeters: number, points = 64) {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInMeters / 1000;
    const ret = [];
    // 1 gradus kenglik (latitude) taxminan 110.574 km
    // 1 gradus uzunlik (longitude) kenglikka qarab o'zgaradi (111.320 * cos(lat))
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]); // yopiq aylana bo'lishi uchun oxirgi nuqta birinchisiga teng

    return {
        type: "FeatureCollection" as const,
        features: [{
            type: "Feature" as const,
            geometry: {
                type: "Polygon" as const,
                coordinates: [ret]
            },
            properties: {}
        }]
    };
};

export default function MapComponent({ lat, lng, radius }: { lat: number, lng: number, radius: number }) {
    const mapRef = useRef<MapRef>(null);

    const validLat = isNaN(lat) || lat === 0 ? 41.311081 : lat;
    const validLng = isNaN(lng) || lng === 0 ? 69.240562 : lng;
    const validRadius = isNaN(radius) || radius <= 0 ? 50 : radius;

    // Radius obyekti (memoized for performance)
    const circleData = useMemo(() => createGeoJSONCircle([validLng, validLat], validRadius), [validLng, validLat, validRadius]);

    // Update map view when lat/lng change
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.flyTo({ center: [validLng, validLat], duration: 1000 });
        }
    }, [validLat, validLng]);

    return (
        <div style={{ height: "100%", width: "100%", borderRadius: "16px", overflow: "hidden", position: "relative", zIndex: 1, backgroundColor: "var(--background-color)" }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: validLng,
                    latitude: validLat,
                    zoom: 15.5,
                    pitch: 60,   // 3D qiyalik burchagi (tashlagan rasmingizdek)
                    bearing: -20 // Biroz burilgan
                }}
                // Dark Matter uslubi - 3D maket (architectural mockup) stilida
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                interactive={true}
                attributionControl={false}
            >
                {/* Suv havzalari (Daryolar, anhorlar) - Neon Cyan */}
                <Layer
                    id="cyber-water"
                    source="carto"
                    source-layer="water"
                    type="fill"
                    paint={{
                        "fill-color": "#06b6d4", // Glowing ko'k-yashil
                        "fill-opacity": 0.25
                    }}
                />

                {/* Cyberpunk Yo'llar */}
                <Layer
                    id="cyber-roads"
                    source="carto"
                    source-layer="transportation"
                    type="line"
                    paint={{
                        "line-color": "#3b82f6", // Neon ko'k yorug'lik
                        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 1.5],
                        "line-opacity": 0.5
                    }}
                />

                {/* Parklar va Yashilliklar */}
                <Layer
                    id="cyber-parks"
                    source="carto"
                    source-layer="park"
                    type="fill"
                    paint={{
                        "fill-color": "#064e3b", // To'q sirli yashil
                        "fill-opacity": 0.3
                    }}
                />

                {/* 3D Binolar qatlami - barcha binolarni tepaga ko'tarish */}
                <Layer 
                    id="3d-buildings"
                    source="carto"
                    source-layer="building"
                    type="fill-extrusion"
                    minzoom={13}
                    paint={{
                        "fill-extrusion-color": [
                            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], ["get", "height"], 20],
                            0, "#475569", // Past binolar to'qroq
                            20, "#64748b", // O'rta binolar (eng ko'p)
                            50, "#94a3b8", // Baland binolar oqroq porlaydi
                            100, "#e2e8f0" // O'ta baland binolar oq
                        ],
                        "fill-extrusion-height": [
                            "interpolate", ["linear"], ["zoom"],
                            13, 0,
                            13.5, ["coalesce", ["get", "render_height"], ["get", "height"], 20] // Default balandlik qo'shildi!
                        ],
                        "fill-extrusion-base": [
                            "interpolate", ["linear"], ["zoom"],
                            13, 0,
                            13.5, ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0]
                        ],
                        "fill-extrusion-opacity": 0.95
                    }}
                />

                {/* Radiusni chizuvchi qatlam */}
                <Source id="radius-circle" type="geojson" data={circleData}>
                    <Layer 
                        id="radius-fill"
                        type="fill"
                        paint={{
                            "fill-color": "#22c55e", // Yashil
                            "fill-opacity": 0.15
                        }}
                    />
                    <Layer 
                        id="radius-outline"
                        type="line"
                        paint={{
                            "line-color": "#22c55e",
                            "line-dasharray": [2, 2],
                            "line-width": 2
                        }}
                    />
                </Source>

                {/* Markaziy lokatsiya belgisi (Premium Marker) */}
                <Marker longitude={validLng} latitude={validLat} anchor="center">
                    <div style={{ backgroundColor: "var(--primary-color)", width: "28px", height: "28px", borderRadius: "50%", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ width: "10px", height: "10px", backgroundColor: "white", borderRadius: "50%" }}></div>
                        <div className="absolute -inset-1 rounded-full border border-[var(--primary-color)] opacity-50 animate-ping" style={{ animationDuration: '2s' }}></div>
                    </div>
                </Marker>
            </Map>
        </div>
    );
}

