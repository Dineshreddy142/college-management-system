import React, { useState, useRef, useEffect } from "react";
import { CampusLocation } from "../types";
import {
  X, Compass, RotateCcw, ZoomIn, ZoomOut, ArrowLeft, ArrowRight,
  Sparkles, Info, Maximize2, MapPin
} from "lucide-react";

interface VirtualTourViewerProps {
  location: CampusLocation;
  onClose: () => void;
}

export const VirtualTourViewer: React.FC<VirtualTourViewerProps> = ({
  location,
  onClose,
}) => {
  const tourData = location.virtualTour;
  const [pitch, setPitch] = useState<number>(0);
  const [yaw, setYaw] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse drag handling for 360 panorama look-around
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setYaw((prev) => (prev + deltaX * 0.25) % 360);
    setPitch((prev) => Math.max(-45, Math.min(45, prev - deltaY * 0.25)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    setYaw((prev) => (prev + deltaX * 0.3) % 360);
    setPitch((prev) => Math.max(-45, Math.min(45, prev - deltaY * 0.3)));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none animate-in fade-in duration-300">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Campus Map</span>
          </button>
          <span className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs">{tourData?.title || location.name}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 360 Panorama Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
      >
        {/* Equirectangular Pan Layer */}
        <div
          className="absolute inset-0 w-[200%] h-[200%] transition-transform duration-75"
          style={{
            backgroundImage: `url(${tourData?.sceneImage || location.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translate(-25%, -25%) scale(${zoom}) translate(${yaw * 4}px, ${pitch * 4}px)`,
          }}
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        {/* Hotspots Overlay */}
        {tourData?.spots?.map((spot) => (
          <div
            key={spot.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHotspot(selectedHotspot === spot.id ? null : spot.id);
            }}
            className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${50 + (spot.yaw - yaw) * 0.8}%`,
              top: `${50 + (pitch - spot.pitch) * 0.8}%`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-purple-600/50 animate-ping absolute" />
              <div className="w-6 h-6 rounded-full bg-white text-purple-700 shadow-xl flex items-center justify-center border-2 border-purple-600 group-hover:scale-125 transition-transform">
                <Info className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Hotspot Popup Card */}
            {(selectedHotspot === spot.id || false) && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs border border-white/20 shadow-2xl animate-in fade-in duration-150">
                <h5 className="font-bold text-purple-300">{spot.title}</h5>
                <p className="text-[11px] text-slate-300 mt-1">{spot.info}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Floating Instructions & Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-white">
        <span className="text-xs text-slate-300 hidden sm:inline">
          Click and drag anywhere to look 360° around
        </span>
        <span className="w-px h-4 bg-white/20 hidden sm:inline" />
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
          className="p-1.5 hover:text-blue-400"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
          className="p-1.5 hover:text-blue-400"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setYaw(0);
            setPitch(0);
            setZoom(1);
          }}
          className="p-1.5 hover:text-blue-400"
          title="Reset Perspective"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
