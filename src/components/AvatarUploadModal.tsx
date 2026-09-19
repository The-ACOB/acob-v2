"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-[#222222] rounded-xl w-full max-w-md p-6 text-white">
        <h2 className="text-lg font-medium mb-4">Update Profile Picture</h2>

        {!imageSrc ? (
          <div className="border-2 border-dashed border-[#333] rounded-lg p-8 text-center cursor-pointer hover:border-[#555] transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-file-input"
            />
            <label
              htmlFor="avatar-file-input"
              className="cursor-pointer text-sm text-gray-400"
            >
              Click to select an image from your device
            </label>
          </div>
        ) : (
          <div>
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden mb-4">
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
              <label className="text-xs text-gray-400 block mb-1">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom profile picture"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setImageSrc(null);
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          {imageSrc && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set Profile Picture"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
