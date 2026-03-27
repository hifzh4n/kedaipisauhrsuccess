function getDesktopBridge() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.desktopBridge || null;
}

function getFilenameFromDisposition(contentDisposition, fallbackFilename) {
    if (!contentDisposition) {
        return fallbackFilename;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (plainMatch?.[1]) {
        return plainMatch[1];
    }

    return fallbackFilename;
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('Failed to read file data.'));
                return;
            }

            resolve(result.split(',')[1]);
        };

        reader.onerror = () => reject(new Error('Failed to read file data.'));
        reader.readAsDataURL(blob);
    });
}

function getExtension(filename) {
    const parts = String(filename || '').split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export async function saveBlobFile(blob, filename) {
    const desktopBridge = getDesktopBridge();

    if (desktopBridge?.saveFile) {
        const base64 = await blobToBase64(blob);
        const result = await desktopBridge.saveFile({
            filename,
            base64,
            mimeType: blob.type || '',
            extension: getExtension(filename),
        });

        if (result?.canceled) {
            return result;
        }

        if (!result?.ok) {
            throw new Error(result?.error || 'Failed to save file.');
        }

        return result;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return { ok: true, filename };
}

export async function saveResponseFile(response, fallbackFilename) {
    const filename = getFilenameFromDisposition(
        response.headers.get('content-disposition'),
        fallbackFilename
    );
    const blob = await response.blob();

    return saveBlobFile(blob, filename);
}

export async function downloadRouteFile(url, fallbackFilename) {
    const response = await fetch(url, {
        headers: {
            Accept: '*/*',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error('Download failed.');
    }

    return saveResponseFile(response, fallbackFilename);
}
