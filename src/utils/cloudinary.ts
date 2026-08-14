/**
 * Cloudinary Helper Utility for direct client-side image uploads.
 */

export const getCloudinaryConfig = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    return { cloudName, uploadPreset };
};

export const isCloudinaryConfigured = (): boolean => {
    const { cloudName, uploadPreset } = getCloudinaryConfig();
    return Boolean(cloudName && uploadPreset && cloudName !== 'your_cloud_name' && uploadPreset !== 'your_upload_preset');
};

/**
 * Uploads a single file to Cloudinary.
 * @param file File object to upload
 * @param onProgress Optional callback for upload progress (0-100)
 * @returns Promise resolving to secure download URL string
 */
export const uploadToCloudinary = (
    file: File,
    onProgress?: (progressPercent: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { cloudName, uploadPreset } = getCloudinaryConfig();

        if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name' || uploadPreset === 'your_upload_preset') {
            return reject(
                new Error(
                    'Cloudinary is not configured yet. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.'
                )
            );
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(Math.round(percentComplete));
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.secure_url) {
                        resolve(response.secure_url);
                    } else {
                        reject(new Error('Cloudinary response did not contain secure_url.'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Cloudinary response.'));
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject(
                        new Error(
                            errorResponse.error?.message || `Cloudinary upload failed with status ${xhr.status}`
                        )
                    );
                } catch {
                    reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error('Network error occurred during Cloudinary upload.'));
        };

        xhr.send(formData);
    });
};

/**
 * Uploads multiple files sequentially or in parallel to Cloudinary.
 * @param files Array of files to upload
 * @param onProgress Overall progress callback (0-100)
 */
export const uploadMultipleToCloudinary = async (
    files: File[],
    onProgress?: (progressPercent: number) => void
): Promise<string[]> => {
    const urls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const url = await uploadToCloudinary(file, (fileProgress) => {
            if (onProgress) {
                const overall = ((i + fileProgress / 100) / totalFiles) * 100;
                onProgress(Math.round(overall));
            }
        });
        urls.push(url);
    }

    if (onProgress) {
        onProgress(100);
    }

    return urls;
};
