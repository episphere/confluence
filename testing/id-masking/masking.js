/**
 * Generates a deterministic masked ID using HMAC-SHA256 and Base64.
 * @param {string} id - The original sensitive ID.
 * @param {string} key - The secret key.
 * @returns {Promise<string>} - The 12-character URL-safe Base64 masked ID.
 */
export async function maskId(id, key) {
    if (!id || !key) return '';
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const idData = encoder.encode(id);

    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    // Generate the signature
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, idData);

    // Convert to Base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Make URL-safe and truncate to 12 chars
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
        .substring(0, 12);
}

/**
 * Generates a random 32-character secret key.
 */
export function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    const randomValues = new Uint32Array(32);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
}
