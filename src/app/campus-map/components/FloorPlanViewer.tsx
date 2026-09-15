import React, { useState } from "react";
import { FloorPlan, FloorRoom } from "../types";
import {
  Layers, DoorOpen, Laptop, GraduationCap, Building2, User,
  Sparkles, CheckCircle, Search, Info
} from "lucide-react";

interface FloorPlanViewerProps {
  floors: FloorPlan[];
  buildingName: string;
  buildingCode: string;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  floors,
  buildingName,
  buildingCode,
}) => {
  const [selectedFloorIndex, setSelectedFloorIndex] = useState<number>(0);
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<FloorRoom | null>(null);

  if (!floors || floors.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
        <p className="text-xs">Architectural floor plans are currently being digitized for this building.</p>
      </div>
    );
  }

  const currentFloor = floors[selectedFloorIndex] || floors[0];

  const filteredRooms = currentFloor.rooms.filter((room) => {
    if (!roomFilter.trim()) return true;
    const q = roomFilter.toLowerCase();
    return (
      room.name.toLowerCase().includes(q) ||
      room.roomNumber.toLowerCase().includes(q) ||
      room.type.toLowerCase().includes(q)
    );
  });

  const getRoomTypeBadgeColor = (type: FloorRoom["type"]) => {
    switch (type) {
      case "Classroom":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "Lab":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
      case "Faculty Office":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
      case "Seminar Hall":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "Restroom":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Floor Level Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
        {floors.map((floor, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedFloorIndex(idx);
              setSelectedRoom(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFloorIndex === idx
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Visual Floor Layout Diagram Preview */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-inner border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-200">
              {buildingCode} • {currentFloor.name} Layout
            </span>
          </div>
          <span className="text-[11px] text-slate-400">{filteredRooms.length} Registered Rooms</span>
        </div>

        {/* 2D Interactive Grid Floor Layout Map */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {currentFloor.rooms.map((room, idx) => {
            const isSelected = selectedRoom?.roomNumber === room.roomNumber;
            return (
              <div
                key={idx}
                onClick={() => setSelectedRoom(room)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-600/30 border-blue-400 shadow-md ring-2 ring-blue-500/50"
                    : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/80"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-300">
                    {room.roomNumber}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getRoomTypeBadgeColor(
                      room.type
                    )}`}
                  >
                    {room.type}
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-white line-clamp-1">{room.name}</h5>
                {room.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {room.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Room Details Spotlight */}
      {selectedRoom && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                {selectedRoom.roomNumber}
              </span>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{selectedRoom.name}</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${getRoomTypeBadgeColor(
                  selectedRoom.type
                )}`}
              >
                {selectedRoom.type}
              </span>
            </div>
            {selectedRoom.description && (
              <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedRoom.description}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedRoom(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
