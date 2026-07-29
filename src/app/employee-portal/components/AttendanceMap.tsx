"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Map, { MapRef, Layer, Source, Marker, Popup } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from "lucide-react";

// Geografik doira (radius) yasash uchun yordamchi funksiya
const createGeoJSONCircle = function(center: [number, number], radiusInMeters: number, points = 64) {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

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

interface AttendanceMapProps {
    officeLat: number;
    officeLng: number;
    officeRadius: number;
    employeeLat?: number | null;
    employeeLng?: number | null;
}

export default function AttendanceMap({ officeLat, officeLng, officeRadius, employeeLat, employeeLng }: AttendanceMapProps) {
    const mapRef = useRef<MapRef>(null);

    const defaultCenter: [number, number] = [officeLng || 69.240562, officeLat || 41.311081];
    
    // Auto center map when employee location updates
    useEffect(() => {
        if (employeeLat && employeeLng && mapRef.current) {
             mapRef.current.flyTo({ center: [employeeLng, employeeLat], zoom: 16, duration: 1000 });
        }
    }, [employeeLat, employeeLng]);

    // Determine distance to color the radius
    let isInside = false;
    if (employeeLat && employeeLng && officeLat && officeLng) {
        const R = 6371e3; // metres
        const φ1 = employeeLat * Math.PI/180;
        const φ2 = officeLat * Math.PI/180;
        const Δφ = (officeLat-employeeLat) * Math.PI/180;
        const Δλ = (officeLng-employeeLng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        isInside = distance <= officeRadius;
    }

    const circleData = useMemo(() => {
        if (!officeLat || !officeLng) return null;
        return createGeoJSONCircle([officeLng, officeLat], officeRadius);
    }, [officeLat, officeLng, officeRadius]);

    const circleColor = isInside ? '#10b981' : '#3b82f6';

    const [showPopup, setShowPopup] = useState(true);

    return (
        <div style={{ height: "300px", width: "100%", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative", zIndex: 1 }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: defaultCenter[0],
                    latitude: defaultCenter[1],
                    zoom: 15.5,
                    pitch: 60,
                    bearing: -20
                }}
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

                {/* 3D Binolar qatlami - Maket shaklida */}
                <Layer 
                    id="3d-buildings"
                    source="carto"
                    source-layer="building"
                    type="fill-extrusion"
                    minzoom={13}
                    paint={{
                        "fill-extrusion-color": [
                            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], ["get", "height"], 20],
                            0, "#475569", 
                            20, "#64748b",
                            50, "#94a3b8",
                            100, "#e2e8f0"
                        ],
                        "fill-extrusion-height": [
                            "interpolate", ["linear"], ["zoom"],
                            13, 0,
                            13.5, ["coalesce", ["get", "render_height"], ["get", "height"], 20]
                        ],
                        "fill-extrusion-base": [
                            "interpolate", ["linear"], ["zoom"],
                            13, 0,
                            13.5, ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0]
                        ],
                        "fill-extrusion-opacity": 0.95
                    }}
                />
                {/* Office Radius Circle */}
                {circleData && (
                    <Source id="office-radius" type="geojson" data={circleData}>
                        <Layer 
                            id="radius-fill"
                            type="fill"
                            paint={{
                                "fill-color": circleColor,
                                "fill-opacity": 0.2
                            }}
                        />
                        <Layer 
                            id="radius-outline"
                            type="line"
                            paint={{
                                "line-color": circleColor,
                                "line-width": 2
                            }}
                        />
                    </Source>
                )}

                {/* Employee Location Marker & Popup */}
                {employeeLat && employeeLng && (
                    <>
                        <Marker longitude={employeeLng} latitude={employeeLat} anchor="bottom" onClick={() => setShowPopup(true)}>
                            <div className="text-red-500 hover:text-red-700 transition-colors cursor-pointer drop-shadow-md">
                                <MapPin size={32} fill="currentColor" stroke="white" strokeWidth={1.5} />
                            </div>
                        </Marker>

                        {showPopup && (
                            <Popup
                                longitude={employeeLng}
                                latitude={employeeLat}
                                anchor="bottom"
                                onClose={() => setShowPopup(false)}
                                offset={[0, -32]}
                                closeButton={true}
                                closeOnClick={false}
                                className="styled-popup"
                            >
                                <div className="text-sm p-1">
                                    <p className="mb-1 text-gray-600">Sizning joylashuvingiz</p>
                                    <p className="font-semibold text-gray-900">{isInside ? "Ofis hududidasiz ✅" : "Ofis hududidan tashqarida ❌"}</p>
                                </div>
                            </Popup>
                        )}
                    </>
                )}
            </Map>
        </div>
    );
}

