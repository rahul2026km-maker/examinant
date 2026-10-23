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
export const fileToBase64 = (file: File, maxWidth = 800, quality = 0.75): Promise<string> => {
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

import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a single file to Cloudinary (or Firebase Storage if Cloudinary is unavailable).
 * Specially optimized for PDF question papers and multimedia documents.
 * @param file File object to upload
 * @param onProgress Optional callback for upload progress (0-100)
 * @returns Promise resolving to public HTTPS URL string
 */
export const uploadToCloudinary = async (
    file: File,
    onProgress?: (progressPercent: number) => void,
    resourceType: 'image' | 'video' | 'auto' | 'raw' = 'auto'
): Promise<string> => {
    const { cloudName, uploadPreset } = getCloudinaryConfig();

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isVideo = file.type.startsWith('video/');
    const endpointType = resourceType !== 'auto'
        ? resourceType
        : (isPDF ? 'auto' : (isVideo ? 'video' : 'image'));

    console.log('[Upload Utility] Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        isPDF,
        endpointType
    });

    // 1. For PDFs/Videos/Raw files: Primary Direct Local / Server Upload (/upload-file)
    if (isPDF || isVideo || resourceType === 'raw') {
        try {
            const localResult = await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/upload-file');
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));

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
                            const data = JSON.parse(xhr.responseText);
                            if (data.url) {
                                console.log('[Upload Utility] Local upload succeeded:', data.url);
                                resolve(data.url);
                                return;
                            }
                        } catch { }
                    }
                    reject(new Error(`Local upload response status ${xhr.status}`));
                };

                xhr.onerror = () => reject(new Error('Local endpoint not reachable'));
                xhr.send(file);
            });

            if (onProgress) onProgress(100);
            return localResult;
        } catch (localErr) {
            console.warn('[Upload Utility] Local endpoint skipped, trying cloud providers...', localErr);
        }
    }

    // 2. Secondary: Cloudinary direct upload
    if (cloudName && uploadPreset && cloudName !== 'your_cloud_name' && uploadPreset !== 'your_upload_preset') {
        try {
            return await new Promise<string>((resolve, reject) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`);

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
                        } catch {
                            reject(new Error('Failed to parse Cloudinary response.'));
                        }
                    } else {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            const errorMsg = errorResponse.error?.message || `Cloudinary upload failed with status ${xhr.status}`;
                            reject(new Error(errorMsg));
                        } catch {
                            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network or CORS error occurred during Cloudinary upload.'));
                };

                xhr.send(formData);
            });
        } catch (cloudinaryError: any) {
            console.warn(
                '[Cloudinary Upload Failed]:',
                cloudinaryError?.message || cloudinaryError,
                '-> Switching to Firebase Storage fallback...'
            );
        }
    }

    // 2. Secondary: Firebase Storage bucket upload (ideal for PDFs of any size)
    if (storage) {
        try {
            console.log('[Firebase Storage] Uploading document to bucket...');
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storageRef = ref(storage, `pyqs/${Date.now()}_${safeName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        if (onProgress) onProgress(progress);
                    },
                    (err) => reject(err),
                    async () => {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('[Firebase Storage] Upload successful:', downloadUrl);
                        resolve(downloadUrl);
                    }
                );
            });
        } catch (firebaseErr: any) {
            console.warn('[Firebase Storage Fallback Failed]:', firebaseErr);
        }
    }

    // 3. Tertiary Fallback: for images, compress to lightweight Base64 (always works)
    if (!isPDF && !isVideo) {
        if (onProgress) onProgress(50);
        const base64Url = await fileToBase64(file, 1000, 0.8);
        if (onProgress) onProgress(100);
        return base64Url;
    }

    throw new Error('Unable to upload PDF file. Please ensure Cloudinary or Firebase Storage is online.');
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

