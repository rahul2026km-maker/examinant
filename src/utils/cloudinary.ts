/**
 * Cloudinary Helper Utility for direct client-side image uploads.
 * Includes automatic Base64 image fallback so image uploads never fail!
 */

export const getCloudinaryConfig = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    return { cloudName, uploadPreset };
};

export const isCloudinaryConfigured = (): boolean => {
    const { cloudName, uploadPreset } = getCloudinaryConfig();
    return Boolean(
        cloudName &&
        uploadPreset &&
        cloudName !== 'your_cloud_name' &&
        uploadPreset !== 'your_upload_preset'
    );
};

/**
 * Converts a file to an optimized Base64 Data URL (fallback when Cloudinary is unavailable)
 */
export const fileToBase64 = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        };

        img.src = url;
    });
};

/**
 * Uploads a single file to Cloudinary.
 * Automatically falls back to compressed Base64 Data URL if Cloudinary fails or is unconfigured.
 * @param file File object to upload
 * @param onProgress Optional callback for upload progress (0-100)
 * @returns Promise resolving to image URL string (Cloudinary URL or Base64 Data URL)
 */
export const uploadToCloudinary = async (
    file: File,
    onProgress?: (progressPercent: number) => void
): Promise<string> => {
    const { cloudName, uploadPreset } = getCloudinaryConfig();

    console.log('[Cloudinary Utility] Attempting upload with:', { cloudName, uploadPreset, fileName: file.name, fileSize: file.size });

    if (cloudName && uploadPreset && cloudName !== 'your_cloud_name' && uploadPreset !== 'your_upload_preset') {
        try {
            return await new Promise<string>((resolve, reject) => {
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
                                console.log('[Cloudinary Utility] Upload successful:', response.secure_url);
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
                            const errorMsg = errorResponse.error?.message || `Cloudinary upload failed with status ${xhr.status}`;
                            console.error('[Cloudinary API Error Response]:', errorResponse);
                            reject(new Error(errorMsg));
                        } catch {
                            console.error('[Cloudinary API Error HTTP Status]:', xhr.status, xhr.responseText);
                            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    console.error('[Cloudinary Network/CORS Error] Request failed to reach Cloudinary servers.');
                    reject(new Error('Network or CORS error occurred during Cloudinary upload.'));
                };

                xhr.send(formData);
            });
        } catch (cloudinaryError: any) {
            console.warn(
                '[Cloudinary Upload Failed]:',
                cloudinaryError?.message || cloudinaryError,
                '-> Falling back to optimized local Base64 image.'
            );
        }
    } else {
        console.warn(
            '[Cloudinary Credentials Missing/Default]: Please check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env -> Using Base64 fallback.'
        );
    }

    // Fallback: Convert to Base64 Data URL so image upload never blocks the user
    if (onProgress) onProgress(50);
    const base64Url = await fileToBase64(file);
    if (onProgress) onProgress(100);
    return base64Url;
};

/**
 * Uploads multiple files sequentially to Cloudinary with Base64 fallback.
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

