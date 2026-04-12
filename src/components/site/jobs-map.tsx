"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Job } from "@/lib/data";
import { formatSalary } from "@/lib/data";
import { type Locale, lhref } from "@/lib/i18n/config";

// Custom minimal pin: black drop with white dot
const pinIcon = L.divIcon({
  className: "hw-pin",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      background: #0d0d0d;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.22);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ffffff;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

function FitBounds({ jobs }: { jobs: Job[] }) {
  const map = useMap();
  useEffect(() => {
    if (!jobs.length) return;
    const bounds = L.latLngBounds(jobs.map((j) => [j.lat, j.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [jobs, map]);
  return null;
}

export default function JobsMap({
  jobs,
  locale,
}: {
  jobs: Job[];
  locale: Locale;
}) {
  return (
    <MapContainer
      center={[43.7384, 7.4246]}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#f5f5f5" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds jobs={jobs} />
      {jobs.map((j) => (
        <Marker key={j.id} position={[j.lat, j.lng]} icon={pinIcon}>
          <Popup className="hw-popup">
            <div className="min-w-[220px]">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                {j.company.name}
              </p>
              <Link
                href={lhref(locale, `/jobs/${j.slug}`)}
                className="mt-1 block text-[15px] font-bold leading-tight text-neutral-900 hover:underline"
              >
                {j.title}
              </Link>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600">
                <span>{j.type}</span>
                <span>·</span>
                <span>{j.location}</span>
              </div>
              {formatSalary(j) && (
                <p className="mt-1 text-[12px] font-medium text-neutral-900">
                  {formatSalary(j)}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
