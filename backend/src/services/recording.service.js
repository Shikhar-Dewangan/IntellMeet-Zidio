import { buildCloudinaryFolder, uploadFileToCloudinary, deleteFileFromCloudinary } from "../utils/FileUplode.js";

const uploadRecordingToCloudinary = async (localFilePath, context = {}) => {
    if (!localFilePath) {
        throw new Error("Recording file path is required");
    }

    const folder = buildCloudinaryFolder({
        entityType: "recordings",
        userId: context.userId,
    });

    const result = await uploadFileToCloudinary(localFilePath, folder);
    return result;
};

const deleteRecordingFromCloudinary = async (publicId, userId) => {
    if (!publicId || !userId) {
        return false;
    }

    const ownedFolder = buildCloudinaryFolder({ entityType: "recordings", userId });

    if (!publicId.startsWith(`${ownedFolder}/`)) {
        return false;
    }

    const result = await deleteFileFromCloudinary(publicId, "video");
    return result?.result === "ok" || result?.result === "not found";
};

export {
    uploadRecordingToCloudinary,
    deleteRecordingFromCloudinary,
};
