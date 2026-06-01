"use client";

import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ImageIcon, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageViewerModalProps {
  imageUrl?: string | null;
  altText: string;
  onClose: () => void;
}

export function ImageViewerModal({ imageUrl, altText, onClose }: ImageViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm overlay-enter" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center modal-enter pointer-events-none">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 md:top-0 md:-right-12 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full h-full rounded-2xl overflow-hidden pointer-events-auto flex items-center justify-center">
          {imageUrl ? (
             <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                centerOnInit
                wheel={{ step: 0.1 }}
             >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Controls overlay for desktop/accessibility */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 z-10">
                      <button onClick={() => zoomOut()} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <button onClick={() => resetTransform()} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button onClick={() => zoomIn()} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                       <img
                         src={imageUrl}
                         alt={altText}
                         className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                       />
                    </TransformComponent>
                  </div>
                )}
             </TransformWrapper>
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-black/50 rounded-xl border border-white/10">
               <ImageIcon className="w-16 h-16 text-white/30" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
