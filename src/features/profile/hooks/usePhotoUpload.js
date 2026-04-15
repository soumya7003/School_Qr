// src/features/profile/hooks/usePhotoUpload.js
import { profileApi } from "@/features/profile/profile.api";
import { useState } from "react";

export function usePhotoUpload(studentId) {
  const [uploading, setUploading] = useState(false);

  const getPhotoUrl = (photoKey) => {
    if (!photoKey) return null;
    if (photoKey.startsWith("https://") || photoKey.startsWith("file://")) {
      return photoKey;
    }
    return `https://assets.getresqid.in/${photoKey}`;
  };

  const uploadPhotoToCloudflare = async (localUri) => {
    if (!localUri) return null;
    if (!localUri.startsWith("file://")) return localUri;

    setUploading(true);
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const fileSize = blob.size;
      const contentType = blob.type || "image/jpeg";

      const { uploadUrl, key, nonce } =
        await profileApi.generateStudentPhotoUploadUrl(
          studentId,
          contentType,
          fileSize,
        );

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": contentType },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const { photoUrl: photoKey } = await profileApi.confirmStudentPhotoUpload(
        studentId,
        key,
        nonce,
      );

      return photoKey;
    } catch (error) {
      if (__DEV__) console.error("[Upload] Failed:", error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadPhotoToCloudflare, getPhotoUrl };
}
