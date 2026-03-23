/**
 * COGNO SOLUTION - Activity Tracker
 * Universal score saving and progress tracking for all learning activities
 * 
 * Usage in games:
 *   1. Include this script: <script src="../../js/activity-tracker.js"></script>
 *   2. Call on game end: await CognoTracker.saveActivity({ ... });
 */

const CognoTracker = {
    // Activity configuration
    config: {
        notifyDoctorThreshold: 80, // Notify doctor when score >= 80%
        celebrateThreshold: 90,    // Show celebration animation >= 90%
        minDurationSeconds: 5      // Minimum valid activity duration
    },

    // Module and activity definitions
    modules: {
        dyslexia: {
            name: 'Dyslexia',
            icon: 'fa-book-reader',
            color: '#0066cc',
            activities: {
                'text-reader': { name: 'Text Reader', maxScore: 100 },
                'text-simplifier': { name: 'Text Simplifier', maxScore: 100 },
                'letter-match': { name: 'Letter Match', maxScore: 130 },
                'word-builder': { name: 'Word Builder', maxScore: 100 },
                'sight-words': { name: 'Sight Words', maxScore: 100 },
                'rhyme-time': { name: 'Rhyme Time', maxScore: 100 },
                'spelling-bee': { name: 'Spelling Bee', maxScore: 100 },
                'word-scramble': { name: 'Word Scramble', maxScore: 100 }
            }
        },
        dyscalculia: {
            name: 'Dyscalculia',
            icon: 'fa-calculator',
            color: '#10b981',
            activities: {
                'number-line': { name: 'Number Line', maxScore: 100 },
                'counting': { name: 'Counting', maxScore: 100 },
                'number-match': { name: 'Number Match', maxScore: 100 },
                'addition': { name: 'Addition', maxScore: 100 },
                'subtraction': { name: 'Subtraction', maxScore: 100 },
                'multiplication': { name: 'Multiplication', maxScore: 100 },
                'division': { name: 'Division', maxScore: 100 },
                'math-pop': { name: 'Math Pop', maxScore: 100 },
                'number-puzzle': { name: 'Number Puzzle', maxScore: 100 }
            }
        },
        dysgraphia: {
            name: 'Dysgraphia',
            icon: 'fa-pen-fancy',
            color: '#f59e0b',
            activities: {
                'letter-tracing': { name: 'Letter Tracing', maxScore: 100 },
                'letter-formation': { name: 'Letter Formation', maxScore: 100 },
                'alphabet-practice': { name: 'Alphabet Practice', maxScore: 100 },
                'word-tracing': { name: 'Word Tracing', maxScore: 100 },
                'spelling-write': { name: 'Spelling Write', maxScore: 100 },
                'copy-practice': { name: 'Copy Practice', maxScore: 100 },
                'free-draw': { name: 'Free Draw', maxScore: 100 },
                'shape-tracing': { name: 'Shape Tracing', maxScore: 100 },
                'sentence-write': { name: 'Sentence Write', maxScore: 100 }
            }
        },
        dyspraxia: {
            name: 'Dyspraxia',
            icon: 'fa-hand-paper',
            color: '#8b5cf6',
            activities: {
                'balloon-pop': { name: 'Balloon Pop', maxScore: 100 },
                'catch-stars': { name: 'Catch Stars', maxScore: 100 },
                'mirror-me': { name: 'Mirror Me', maxScore: 100 },
                'freeze-dance': { name: 'Freeze Dance', maxScore: 100 },
                'tightrope-walk': { name: 'Tightrope Walk', maxScore: 100 },
                'obstacle-course': { name: 'Obstacle Course', maxScore: 100 },
                'finger-tap': { name: 'Finger Tap', maxScore: 100 },
                'drag-drop': { name: 'Drag & Drop', maxScore: 100 },
                'track-path': { name: 'Track Path', maxScore: 100 },
                'balance-beam': { name: 'Balance Beam', maxScore: 60 }
            }
        }
    },

    /**
     * Initialize tracker (call on page load)
     */
    async init() {
        // Wait for Supabase client to be ready
        if (typeof CognoSupabase === 'undefined') {
            console.warn('CognoTracker: CognoSupabase not loaded, will retry...');
            await this.waitForSupabase();
        }

        // Get current user
        this.user = await this.getCurrentUser();
        console.log('🎮 CognoTracker initialized', this.user ? `for ${this.user.email}` : '(guest mode)');

        return this;
    },

    /**
     * Wait for Supabase client to be available
     */
    waitForSupabase(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (typeof CognoSupabase !== 'undefined') {
                    resolve(true);
                } else if (Date.now() - start > timeout) {
                    reject(new Error('Supabase client not available'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser() {
        try {
            if (typeof CognoSupabase === 'undefined') return null;

            const { user, profile } = await CognoSupabase.getCurrentUser();
            if (!user) return null;

            return {
                id: user.id,
                email: user.email,
                name: profile?.full_name || user.email.split('@')[0],
                role: profile?.role || 'student',
                avatarUrl: profile?.avatar_url
            };
        } catch (error) {
            console.error('CognoTracker: Error getting user:', error);
            return null;
        }
    },

    /**
     * Save activity progress to Supabase
     * @param {Object} activity - Activity data
     * @param {string} activity.moduleId - Module ID (dyslexia, dyscalculia, etc.)
     * @param {string} activity.activityId - Activity ID (balloon-pop, letter-match, etc.)
     * @param {number} activity.score - Score achieved
     * @param {number} [activity.maxScore] - Maximum possible score (optional, uses default)
     * @param {number} activity.duration - Time spent in seconds
     * @param {number} [activity.accuracy] - Accuracy percentage (0-100)
     * @param {Object} [activity.metadata] - Additional activity data
     */
    async saveActivity(activity) {
        try {
            // Validate required fields
            if (!activity.moduleId || !activity.activityId) {
                console.error('CognoTracker: moduleId and activityId are required');
                return { success: false, error: 'Missing required fields' };
            }

            // Refresh user if needed
            if (!this.user) {
                this.user = await this.getCurrentUser();
            }

            // Allow guest mode - just log locally
            if (!this.user) {
                console.log('CognoTracker: Guest mode - activity not saved to database');
                this.showLocalFeedback(activity);
                return { success: true, guest: true };
            }

            // Get module and activity info
            const moduleInfo = this.modules[activity.moduleId];
            const activityInfo = moduleInfo?.activities?.[activity.activityId];

            const maxScore = activity.maxScore || activityInfo?.maxScore || 100;
            const percentage = Math.min(100, Math.round((activity.score / maxScore) * 100));
            const accuracy = activity.accuracy ?? percentage;

            // Prepare record for student_progress table
            const progressRecord = {
                student_id: this.user.id,
                module_type: activity.moduleId,
                activity_type: activityInfo?.name || activity.activityId,
                activity_id: activity.activityId,
                score: activity.score,
                max_score: maxScore,
                accuracy: accuracy,
                time_spent_seconds: activity.duration || 0,
                completed: percentage >= 50, // Consider complete if >= 50%
                attempts: 1, // Will increment via upsert logic
                data: {
                    completion_percentage: percentage,
                    ...(activity.metadata || {})
                },
                updated_at: new Date().toISOString()
            };

            console.log('CognoTracker: Saving activity progress...', progressRecord);

            // Upsert to student_progress table
            const { data, error } = await CognoSupabase.client
                .from('student_progress')
                .upsert(progressRecord, {
                    onConflict: 'student_id,module_type,activity_id'
                })
                .select();

            if (error) {
                console.error('CognoTracker: Database error:', error);
                // Still show feedback even if save fails
                this.showLocalFeedback(activity, percentage);
                return { success: false, error: error.message };
            }

            console.log('CognoTracker: ✅ Activity saved!', data);

            // Log to activity_logs for history
            await this.logActivityHistory(activity, percentage);

            // Check for achievements
            await this.checkAchievements(activity.moduleId, percentage);

            // Notify doctor of activity completion
            await this.notifyDoctor(activity, percentage);

            // Always email test score to patient
            await this.notifyPatientScore(activity, percentage);

            // Show success feedback
            this.showSuccessFeedback(activity, percentage);

            return { success: true, data, percentage };

        } catch (error) {
            console.error('CognoTracker: Error saving activity:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Log activity to activity_logs table for history tracking
     */
    async logActivityHistory(activity, percentage) {
        try {
            const moduleInfo = this.modules[activity.moduleId];
            const activityInfo = moduleInfo?.activities?.[activity.activityId];

            await CognoSupabase.logActivity('activity_completed', {
                module_type: activity.moduleId,
                module_name: moduleInfo?.name,
                activity_id: activity.activityId,
                activity_name: activityInfo?.name || activity.activityId,
                score: activity.score,
                percentage: percentage,
                duration: activity.duration
            });
        } catch (error) {
            console.error('CognoTracker: Error logging activity history:', error);
        }
    },

    /**
     * Check and unlock achievements based on activity
     */
    async checkAchievements(moduleId, percentage) {
        try {
            if (!this.user) return;

            const achievementsToCheck = [];

            // First activity ever
            const { data: allProgress } = await CognoSupabase.client
                .from('student_progress')
                .select('id')
                .eq('student_id', this.user.id);

            if (allProgress?.length === 1) {
                achievementsToCheck.push({
                    type: 'milestone',
                    id: 'first_activity',
                    title: 'First Steps',
                    description: 'Complete your first activity',
                    icon: '🌟'
                });
            }

            // Perfect score
            if (percentage === 100) {
                achievementsToCheck.push({
                    type: 'performance',
                    id: `perfect_${moduleId}`,
                    title: 'Perfect Score!',
                    description: `Get 100% on a ${this.modules[moduleId]?.name} activity`,
                    icon: '🏆'
                });
            }

            // Module mastery (complete all activities in a module)
            const moduleActivities = Object.keys(this.modules[moduleId]?.activities || {});
            const { data: moduleProgress } = await CognoSupabase.client
                .from('student_progress')
                .select('activity_id')
                .eq('student_id', this.user.id)
                .eq('module_type', moduleId)
                .eq('completed', true);

            const completedActivities = new Set(moduleProgress?.map(p => p.activity_id) || []);
            if (moduleActivities.length > 0 && moduleActivities.every(a => completedActivities.has(a))) {
                achievementsToCheck.push({
                    type: 'mastery',
                    id: `mastery_${moduleId}`,
                    title: `${this.modules[moduleId]?.name} Master`,
                    description: `Complete all ${this.modules[moduleId]?.name} activities`,
                    icon: '👑'
                });
            }

            // Save any new achievements
            for (const achievement of achievementsToCheck) {
                // Check if already earned
                const { data: existing } = await CognoSupabase.client
                    .from('user_achievements')
                    .select('id')
                    .eq('user_id', this.user.id)
                    .eq('achievement_id', achievement.id)
                    .single();

                if (!existing) {
                    const { error } = await CognoSupabase.client
                        .from('user_achievements')
                        .insert({
                            user_id: this.user.id,
                            achievement_type: achievement.type,
                            achievement_id: achievement.id,
                            title: achievement.title,
                            description: achievement.description,
                            icon: achievement.icon,
                            xp_reward: percentage >= 90 ? 50 : 25,
                            unlocked_at: new Date().toISOString()
                        });

                    if (!error) {
                        this.showAchievementUnlocked(achievement);
                        // Trigger email notification
                        if (typeof CognoAPI !== 'undefined' && CognoAPI.Email) {
                            CognoAPI.Email.sendAchievementNotification(
                                this.user.name,
                                this.user.email,
                                achievement.title,
                                achievement.description
                            ).catch(e => console.error('Failed to send achievement email:', e));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('CognoTracker: Error checking achievements:', error);
        }
    },

    /**
     * Notify linked doctor about student progress
     */
    async notifyDoctor(activity, percentage) {
        try {
            if (!this.user) return;

            // Find linked doctor (using doctor_patients table)
            const { data: link } = await CognoSupabase.client
                .from('doctor_patients')
                .select('doctor_id')
                .eq('patient_id', this.user.id)
                .eq('status', 'active')
                .single();

            if (!link?.doctor_id) {
                console.log('CognoTracker: No linked doctor found');
                return;
            }

            // Fetch doctor's profile for their email
            const { data: doctorProfile } = await CognoSupabase.client
                .from('profiles')
                .select('full_name, email')
                .eq('id', link.doctor_id)
                .single();

            if (!doctorProfile?.email) {
                console.log('CognoTracker: Doctor email not found');
                return;
            }

            const moduleInfo = this.modules[activity.moduleId];
            const activityInfo = moduleInfo?.activities?.[activity.activityId];
            const activityName = activityInfo?.name || activity.activityId;
            const moduleName = moduleInfo?.name || activity.moduleId;

            // Create notification for doctor (using notifications table)
            const notification = {
                user_id: link.doctor_id,
                title: percentage >= 90 ? '🌟 Excellent Progress!' : '✅ Activity Completed',
                message: `${this.user.name} scored ${percentage}% on ${activityName} (${moduleName})`,
                type: percentage >= 90 ? 'achievement' : 'info',
                read: false,
                data: {
                    patient_id: this.user.id,
                    patient_name: this.user.name,
                    module_id: activity.moduleId,
                    activity_id: activity.activityId,
                    score: activity.score,
                    percentage: percentage
                },
                created_at: new Date().toISOString()
            };

            await CognoSupabase.client
                .from('notifications')
                .insert(notification);

            // Send Email to Doctor
            const doctorEmailBody = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; background-color: #f1f5f9; color: #1e293b;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white;">
                            <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Patient Activity Update</h2>
                            <p style="margin-top: 5px; font-size: 14px; opacity: 0.8;">New progress data for your clinic</p>
                        </div>
                        
                        <div style="padding: 40px;">
                            <p style="font-size: 16px; color: #334155;">Hello <strong style="color: #1e293b;">Dr. ${doctorProfile.full_name || 'Specialist'}</strong>,</p>
                            <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                                This is an automated update to inform you that your patient, <strong>${this.user.name}</strong>, has completed a new learning activity.
                            </p>
                            
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                                    <span style="color: #64748b;">Module:</span>
                                    <span style="font-weight: 600;">${moduleName}</span>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                                    <span style="color: #64748b;">Activity:</span>
                                    <span style="font-weight: 600;">${activityName}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #64748b;">Score Result:</span>
                                    <span style="font-size: 28px; font-weight: 800; color: #3b82f6;">${percentage}%</span>
                                </div>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${typeof CognoConfig !== 'undefined' ? CognoConfig.getFrontendUrl() : 'https://cognosolution.vercel.app'}/doctor/dashboard.html" 
                                   style="background-color: #1e293b; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                                    Review Patient Dashboard
                                </a>
                            </div>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cogno Solution Clinician Portal</p>
                        </div>
                    </div>
                </div>
            `;

            const backendUrl = typeof CognoConfig !== 'undefined' ? CognoConfig.getBackendUrl() : (typeof RENDER_BACKEND_URL !== 'undefined' ? RENDER_BACKEND_URL : 'https://new-cogno-soltuion-version-1-2.onrender.com');

            // Fire and forget email to doctor
            fetch(backendUrl + '/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: doctorProfile.email,
                    subject: `Cogno Patient Alert: ${this.user.name} - ${percentage}% on ${activityName}`,
                    body: doctorEmailBody,
                    is_html: true
                })
            }).catch(e => console.error("Could not send doctor notification email", e));

            console.log('CognoTracker: Doctor notified of progress via email and dashboard');

        } catch (error) {
            console.error('CognoTracker: Error in notifyDoctor:', error);
        }
    },

    /**
     * Send email notification to patient/student about their score
     */
    async notifyPatientScore(activity, percentage) {
        try {
            if (!this.user || !this.user.email) return;

            const moduleInfo = this.modules[activity.moduleId];
            const activityInfo = moduleInfo?.activities?.[activity.activityId];
            const activityName = activityInfo?.name || activity.activityId;
            const moduleName = moduleInfo?.name || activity.moduleId;

            const emailBody = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; background-color: #f1f5f9; color: #1e293b;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center; color: white;">
                            <div style="font-size: 40px; margin-bottom: 20px;">🏆</div>
                            <h2 style="margin: 0; font-size: 28px; font-weight: 700;">Outstanding Effort!</h2>
                            <p style="margin-top: 10px; font-size: 16px; opacity: 0.9;">You're making incredible progress</p>
                        </div>
                        
                        <div style="padding: 40px;">
                            <p style="font-size: 18px; color: #334155;">Hi <strong style="color: #1e293b;">${this.user.name || 'Student'}</strong>,</p>
                            <p style="font-size: 16px; line-height: 1.6; color: #475569;">Fantastic work! You've just completed <strong>${activityName}</strong> in your <strong>${moduleName}</strong> learning path.</p>
                            
                            <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; margin-bottom: 5px;">Your Score</div>
                                <div style="font-size: 64px; font-weight: 800; color: #3b82f6; line-height: 1;">${percentage}%</div>
                                <div style="margin-top: 15px; display: inline-block; padding: 6px 16px; background: #dcfce7; color: #166534; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                    Activity Verified ✅
                                </div>
                            </div>
                            
                            <p style="font-size: 15px; color: #64748b; text-align: center; font-style: italic;">"The expert in anything was once a beginner. Keep going!"</p>
                            
                            <div style="text-align: center; margin-top: 40px;">
                                <a href="${typeof CognoConfig !== 'undefined' ? CognoConfig.getFrontendUrl() : 'https://cognosolution.vercel.app'}/dashboard/child-dashboard.html" style="background-color: #3b82f6; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">View My Progress Board</a>
                            </div>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; 2026 Cogno Solution. Transforming learning journeys.</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Use global configuration for correct backend URL
            const backendUrl = typeof CognoConfig !== 'undefined' 
                ? CognoConfig.getBackendUrl() 
                : (typeof RENDER_BACKEND_URL !== 'undefined' ? RENDER_BACKEND_URL : 'https://new-cogno-soltuion-version-1-2.onrender.com');
            
            fetch(backendUrl + '/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: this.user.email,
                    subject: `Cogno Solution - Score: ${percentage}% in ${activityName}`,
                    body: emailBody,
                    is_html: true
                })
            }).catch(e => console.error("Could not send patient score email", e));

        } catch (error) {
            console.error('CognoTracker: Error in notifyPatientScore:', error);
        }
    },

    /**
     * Show success feedback to user
     */
    showSuccessFeedback(activity, percentage) {
        const moduleInfo = this.modules[activity.moduleId];
        const activityInfo = moduleInfo?.activities?.[activity.activityId];

        let message = '';
        let type = 'success';

        if (percentage >= 90) {
            message = `🌟 Excellent! ${percentage}% on ${activityInfo?.name || 'activity'}!`;
        } else if (percentage >= 70) {
            message = `✅ Great job! ${percentage}% on ${activityInfo?.name || 'activity'}!`;
        } else if (percentage >= 50) {
            message = `👍 Good effort! ${percentage}% on ${activityInfo?.name || 'activity'}`;
        } else {
            message = `Keep practicing! ${percentage}% - You'll improve!`;
            type = 'info';
        }

        // Use CognoNotifications if available
        if (typeof CognoNotifications !== 'undefined' && CognoNotifications.toast) {
            CognoNotifications.toast[type](message);
        } else {
            // Fallback to custom toast
            this.showToast(message, type);
        }
    },

    /**
     * Show local feedback for guest mode
     */
    showLocalFeedback(activity, percentage) {
        const message = `Score saved locally! Log in to track your progress.`;
        this.showToast(message, 'info');
    },

    /**
     * Show achievement unlocked notification
     */
    showAchievementUnlocked(achievement) {
        const message = `🎉 Achievement Unlocked: ${achievement.title}!`;

        if (typeof CognoNotifications !== 'undefined' && CognoNotifications.toast) {
            CognoNotifications.toast.success(message);
        } else {
            this.showToast(message, 'success');
        }
    },

    /**
     * Custom toast notification fallback
     */
    showToast(message, type = 'success') {
        // Create toast container if not exists
        let container = document.getElementById('cogno-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'cogno-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: 'Inter', 'Lexend', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        // Add animation keyframes if not exists
        if (!document.getElementById('cogno-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'cogno-toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Get user's progress summary for a module
     */
    async getModuleProgress(moduleId) {
        try {
            if (!this.user) return null;

            const { data, error } = await CognoSupabase.client
                .from('student_progress')
                .select('*')
                .eq('student_id', this.user.id)
                .eq('module_type', moduleId);

            if (error) throw error;

            const activities = this.modules[moduleId]?.activities || {};
            const totalActivities = Object.keys(activities).length;
            const completedActivities = data?.filter(p => p.completed)?.length || 0;
            const avgScore = data?.length > 0
                ? Math.round(data.reduce((sum, p) => sum + ((p.score / p.max_score) * 100 || 0), 0) / data.length)
                : 0;

            return {
                totalActivities,
                completedActivities,
                completionPercentage: Math.round((completedActivities / totalActivities) * 100),
                averageScore: avgScore,
                activities: data || []
            };
        } catch (error) {
            console.error('CognoTracker: Error getting module progress:', error);
            return null;
        }
    },

    /**
     * Get all achievements for current user
     */
    async getAchievements() {
        try {
            if (!this.user) return [];

            const { data, error } = await CognoSupabase.client
                .from('user_achievements')
                .select('*')
                .eq('user_id', this.user.id)
                .order('earned_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('CognoTracker: Error getting achievements:', error);
            return [];
        }
    },

    /**
     * Generate certificate data for download
     */
    async generateCertificate(moduleId) {
        try {
            if (!this.user) return null;

            const progress = await this.getModuleProgress(moduleId);
            if (!progress || progress.completionPercentage < 70) {
                return { error: 'Complete at least 70% of the module to earn a certificate' };
            }

            const moduleInfo = this.modules[moduleId];

            return {
                success: true,
                certificate: {
                    studentName: this.user.name,
                    moduleName: moduleInfo?.name || moduleId,
                    completionPercentage: progress.completionPercentage,
                    averageScore: progress.averageScore,
                    completedActivities: progress.completedActivities,
                    totalActivities: progress.totalActivities,
                    earnedAt: new Date().toISOString(),
                    certificateId: `COGNO-${moduleId.toUpperCase()}-${this.user.id.substring(0, 8)}-${Date.now()}`
                }
            };
        } catch (error) {
            console.error('CognoTracker: Error generating certificate:', error);
            return { error: error.message };
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CognoTracker.init());
} else {
    CognoTracker.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognoTracker;
}

// Make globally available
window.CognoTracker = CognoTracker;

console.log('📊 CognoTracker loaded - ready to track learning activities');
