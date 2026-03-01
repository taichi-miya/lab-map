"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Lab = {
  id: string;
  name: string;
  faculty_name: string | null;
  map_x: number | null;
  map_y: number | null;
};

export default function ExplorePage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selected, setSelected] = useState<Lab | null>(null);

  useEffect(() => {
    supabase
      .from("labs")
      .select("id,name,faculty_name,map_x,map_y")
      .then(({ data, error }) => {
        console.log("data:", data);
        console.log("error:", error);
        setLabs(data ?? []);
      });
  }, []);

  const placed = labs.map((lab, i) => ({
    ...lab,
    x: lab.map_x ?? 100 + (i % 5) * 130,
    y: lab.map_y ?? 100 + Math.floor(i / 5) * 120,
  }));

  return (
    <main className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Tohoku Lab Map</h1>
      <svg width={800} height={600} className="border rounded bg-gray-50">
        {placed.map((lab) => (
          <g
            key={lab.id}
            onClick={() => setSelected(lab)}
            className="cursor-pointer"
          >
            <circle
              cx={lab.x}
              cy={lab.y}
              r={18}
              fill={selected?.id === lab.id ? "#f59e0b" : "#3b82f6"}
              opacity={0.85}
            />
            <text
              x={lab.x}
              y={lab.y + 30}
              textAnchor="middle"
              fontSize={10}
              fill="#1e293b"
            >
              {lab.name.slice(0, 12)}
            </text>
          </g>
        ))}
      </svg>

      {selected && (
        <div className="mt-4 p-4 border rounded w-full max-w-md bg-white shadow">
          <p className="font-bold">{selected.name}</p>
          <p className="text-sm text-gray-500">{selected.faculty_name}</p>
          <Link
            href={`/lab/${selected.id}`}
            className="text-blue-600 underline text-sm"
          >
            詳細を見る →
          </Link>
        </div>
      )}
    </main>
  );
}
