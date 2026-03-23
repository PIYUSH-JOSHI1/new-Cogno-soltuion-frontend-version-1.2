/**
 * Cogno Solution - Shared Header Component
 * Injects a consistent header across all pages with:
 * - Real profile picture from Supabase
 * - Dark mode toggle
 * - Notifications
 * - User dropdown menu
 */

(function () {
    'use strict';

    async function renderSharedHeader(options = {}) {
        const { pageTitle = 'Cogno Solution', extraButtons = '' } = options;

        // Wait for supabase
        const maxWait = 3000;
        const start = Date.now();
        while (typeof CognoSupabase === 'undefined' && Date.now() - start < maxWait) {
            await new Promise(r => setTimeout(r, 100));
        }

        let user = null;
        let profile = null;
        let avatarUrl = '../assets/images/avatars/default.svg';
        let userName = 'User';

        try {
            const result = await CognoSupabase.getSession();
            const session = result?.session;
            const userObj = session?.user;
            
            if (userObj) {
                user = userObj;
                profile = user.user_metadata;
                userName = profile?.full_name || user.email?.split('@')[0] || 'User';

                // Try to get avatar from profiles table (uploaded image)
                try {
                    const { data: profileRow } = await CognoSupabase.client
                        .from('profiles')
                        .select('avatar_url, full_name')
                        .eq('id', user.id)
                        .single();

                    if (profileRow?.avatar_url) {
                        avatarUrl = profileRow.avatar_url;
                    }
                    if (profileRow?.full_name) {
                        userName = profileRow.full_name;
                    }
                } catch (e) {
                    console.warn('Could not fetch profile row for header', e);
                }
                
                // fallback to metadata avatar
                if (avatarUrl === '../assets/images/avatars/default.svg' && profile?.avatar_url) {
                    avatarUrl = profile.avatar_url;
                }
            }
        } catch (e) {
            console.warn('Header: could not load user', e);
        }

        // Find target header
        const headerEl = document.querySelector('header.navbar, header.topbar');
        if (!headerEl) return;

        // Inject user info into the existing header
        const avatarImg = headerEl.querySelector('#user-avatar-img');
        const userNameEl = headerEl.querySelector('#user-name');

        if (avatarImg) {
            avatarImg.src = avatarUrl;
            avatarImg.style.cssText = 'width:100%; height:100%; object-fit:cover; border-radius:50%;';
            avatarImg.onerror = () => { avatarImg.src = '../assets/images/avatars/default.svg'; };
        }
        if (userNameEl) {
            userNameEl.textContent = userName;
        }

        // Also update any sidebar avatar
        const sidebarAvatar = document.querySelector('#sidebar-avatar-img');
        if (sidebarAvatar) {
            sidebarAvatar.src = avatarUrl;
        }

        // Store globally for other components
        window._cognoUser = user;
        window._cognoProfile = profile;
        window._cognoAvatarUrl = avatarUrl;
        window._cognoUserName = userName;
    }

    // Run after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => renderSharedHeader());
    } else {
        renderSharedHeader();
    }

    // Expose for manual calls
    window.CognoHeader = { render: renderSharedHeader };
})();
