"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect } from "react";
import {
	Circle,
	MapContainer,
	Marker,
	Popup,
	TileLayer,
	useMap,
} from "react-leaflet";

export interface LeafletMapProps {
	studentCoords: { latitude: number; longitude: number };
	checkpointCoords?: { latitude: number; longitude: number };
	radiusMeters?: number;
	studentName?: string;
	checkpointLabel?: string;
	className?: string;
	height?: string;
}

// Custom modern SVG icons to prevent Leaflet marker image missing bugs
const createStudentIcon = () =>
	L.divIcon({
		className: "custom-leaflet-marker",
		html: `
			<div class="relative flex items-center justify-center">
				<div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
				<div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
					</svg>
				</div>
			</div>
		`,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -16],
	});

const createCheckpointIcon = () =>
	L.divIcon({
		className: "custom-leaflet-marker",
		html: `
			<div class="relative flex items-center justify-center">
				<div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
					</svg>
				</div>
			</div>
		`,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -16],
	});

// Helper component to auto-fit bounds
function FitBounds({
	studentCoords,
	checkpointCoords,
}: {
	studentCoords: { latitude: number; longitude: number };
	checkpointCoords?: { latitude: number; longitude: number };
}) {
	const map = useMap();

	useEffect(() => {
		if (studentCoords && checkpointCoords) {
			const bounds = L.latLngBounds([
				[studentCoords.latitude, studentCoords.longitude],
				[checkpointCoords.latitude, checkpointCoords.longitude],
			]);
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
		} else if (studentCoords) {
			map.setView([studentCoords.latitude, studentCoords.longitude], 16);
		}
	}, [map, studentCoords, checkpointCoords]);

	return null;
}

export default function LeafletMap({
	studentCoords,
	checkpointCoords,
	radiusMeters = 100,
	studentName = "Mahasiswa",
	checkpointLabel = "Titik Kampus",
	className = "w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm",
	height = "320px",
}: LeafletMapProps) {
	const centerLat = studentCoords.latitude || -5.40145;
	const centerLon = studentCoords.longitude || 105.2114;

	return (
		<div className={className} style={{ height, width: "100%" }}>
			<MapContainer
				center={[centerLat, centerLon]}
				zoom={16}
				scrollWheelZoom={false}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				{/* Fit Bounds */}
				<FitBounds
					studentCoords={studentCoords}
					checkpointCoords={checkpointCoords}
				/>

				{/* Student Marker */}
				{studentCoords && (
					<Marker
						position={[studentCoords.latitude, studentCoords.longitude]}
						icon={createStudentIcon()}
					>
						<Popup>
							<div className="text-xs p-1">
								<p className="font-bold text-blue-600 mb-0.5">{studentName}</p>
								<p className="text-slate-600 text-[11px]">
									Posisi GPS: {studentCoords.latitude.toFixed(6)},{" "}
									{studentCoords.longitude.toFixed(6)}
								</p>
							</div>
						</Popup>
					</Marker>
				)}

				{/* Checkpoint Marker & Radius Circle */}
				{checkpointCoords && (
					<>
						<Marker
							position={[checkpointCoords.latitude, checkpointCoords.longitude]}
							icon={createCheckpointIcon()}
						>
							<Popup>
								<div className="text-xs p-1">
									<p className="font-bold text-rose-600 mb-0.5">
										{checkpointLabel}
									</p>
									<p className="text-slate-600 text-[11px]">
										Radius toleransi: {radiusMeters} meter
									</p>
								</div>
							</Popup>
						</Marker>

						<Circle
							center={[checkpointCoords.latitude, checkpointCoords.longitude]}
							radius={radiusMeters}
							pathOptions={{
								color: "#E11D48",
								fillColor: "#FB7185",
								fillOpacity: 0.15,
								weight: 2,
								dashArray: "4, 6",
							}}
						/>
					</>
				)}
			</MapContainer>
		</div>
	);
}
