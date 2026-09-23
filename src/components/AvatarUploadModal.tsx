"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (newUrl: string) => void;
};

export default function AvatarUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.jpg");

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUploadComplete(data.url);
      setImageSrc(null);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#222222] bg-[#0c0c0c] p-6 text-white">
        <h2 className="mb-4 text-lg font-medium">Update Profile Picture</h2>

        {!imageSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-[#333] p-8 text-center transition hover:border-[#555]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="pointer-events-none text-sm text-gray-400">
              Click anywhere here to select an image from your device
            </p>
          </div>
        ) : (
          <div>
            <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-xs text-gray-400">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom profile picture"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full cursor-pointer accent-white"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setImageSrc(null);
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-400 transition hover:text-white"
          >
            Cancel
          </button>

          {imageSrc && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set Profile Picture"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
