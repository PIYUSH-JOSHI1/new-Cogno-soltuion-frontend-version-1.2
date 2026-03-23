/**
 * COGNO SOLUTION - Global Configuration
 * ======================================
 * Set your production URLs here ONCE and all pages use them automatically.
 * 
 * HOW TO UPDATE:
 *   1. Set RENDER_BACKEND_URL to your Render backend URL (e.g. https://cogno-backend.onrender.com)
 *   2. Set VERCEL_FRONTEND_URL to your Vercel frontend URL (e.g. https://cogno.vercel.app)
 */

const CognoConfig = {
    // ✏️ SET THIS: Your Render backend URL (no trailing slash)
    RENDER_BACKEND_URL: 'https://new-cogno-version-1-1-backend.onrender.com',


    VERCEL_FRONTEND_URL: 'https://cognosolution.vercel.app',

    /**
     * Automatically get the correct backend URL
     * - On localhost → uses local Flask server
     * - On production → uses Render URL above
     */
    getBackendUrl() {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
            return `http://${host}:5000`;
        }
        return this.RENDER_BACKEND_URL;
    },

    getFrontendUrl() {
        const host = window.location.hostname;
        
        // Correctly handle subdirectory on localhost (e.g. /frontend/)
        let basePath = '/';
        if (typeof CognoPaths !== 'undefined') {
            basePath = CognoPaths.getBasePath();
        } else {
            // Fallback detection if CognoPaths is not yet loaded
            const path = window.location.pathname;
            if (path.includes('/frontend/')) {
                const index = path.indexOf('/frontend/');
                basePath = path.substring(0, index + '/frontend/'.length);
            }
        }

        if (host === 'localhost' || host === '127.0.0.1') {
            const origin = window.location.origin;
            return (origin + basePath).replace(/\/$/, '');
        }
        return this.VERCEL_FRONTEND_URL;
    },

    /**
     * Returns the correct email redirect URL for Supabase signup
     */
    getEmailRedirectUrl() {
        return `${this.getFrontendUrl()}/auth/verify-email.html`;
    },

    /**
     * Returns the correct reset password redirect URL
     */
    getResetPasswordUrl() {
        return `${this.getFrontendUrl()}/auth/reset-password.html`;
    }
};

window.CognoConfig = CognoConfig;
