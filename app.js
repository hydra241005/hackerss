// AstroWellness Hub Application with Authentication JavaScript
class AstroWellnessHub {
    constructor() {
        this.currentPage = 'home';
        this.currentUser = null;
        this.charts = {};
        this.healthData = this.initializeHealthData();
        this.authData = this.initializeAuthData();
        
        this.init();
    }

    initializeHealthData() {
        return {
            psychological: {
                maleAnxiety: 22.8,
                femaleAnxiety: 85.2,
                maleDepression: 34.8,
                femaleDepression: 43.2,
                severeMentalDisorders: 60,
                spaceAdaptationSyndrome: 70
            },
            physical: {
                boneDensityLoss: 1.5,
                muscleMassLoss: 7,
                exerciseHours: 2.5,
                recoveryMonths: 36,
                calciumIncrease: 50
            },
            mission: {
                averageISSDays: 168,
                marsCommDelay: 30,
                longDurationThreshold: 600,
                typicalCrewSize: 6
            }
        };
    }

    initializeAuthData() {
        return {
            users: JSON.parse(localStorage.getItem('astrowellness_users') || '[]'),
            currentSession: JSON.parse(localStorage.getItem('astrowellness_session') || 'null')
        };
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.setupBackToTop();
        this.animateOnScroll();
        this.initializeAuth();
        
        // Set initial page state
        this.showPage('home');
    }

    initializeAuth() {
        // Check for existing session
        if (this.authData.currentSession) {
            const user = this.authData.users.find(u => u.id === this.authData.currentSession.userId);
            if (user) {
                this.currentUser = user;
                this.updateAuthUI();
            } else {
                // Clear invalid session
                this.logout();
            }
        }

        // Setup authentication form handlers
        this.setupAuthForms();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Auth switches
        const authSwitches = document.querySelectorAll('.auth-switch');
        authSwitches.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                if (target) {
                    this.showPage(target);
                }
            });
        });

        // Password strength checker
        const signupPassword = document.getElementById('signup-password');
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Confirm password validation
        const confirmPassword = document.getElementById('confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => this.validatePasswordMatch());
        }

        // Email validation
        const signupEmail = document.getElementById('signup-email');
        if (signupEmail) {
            signupEmail.addEventListener('blur', (e) => this.validateEmail(e.target.value, 'signup-email-error'));
        }

        // Profile edit toggle
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.toggleProfileEdit());
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.cancelProfileEdit());
        }
    }

    setupEventListeners() {
        // Navigation links - Fixed to handle all navigation properly
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const target = href.substring(1);
                    console.log('Navigation clicked:', target);
                    this.showPage(target);
                }
            });
        });

        // Logo click to return home
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('home');
            });
            logo.style.cursor = 'pointer';
        }

        // Hero buttons - Fixed event handling
        const heroButtons = document.querySelectorAll('.hero-btn');
        heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = button.getAttribute('data-target');
                console.log('Hero button clicked:', target);
                if (target) {
                    this.showPage(target);
                }
            });
        });

        // Auth buttons - Fixed to properly handle login/signup navigation
        const authButtons = document.querySelectorAll('.auth-btn');
        authButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = button.getAttribute('data-target');
                console.log('Auth button clicked:', target);
                if (target) {
                    this.showPage(target);
                }
            });
        });

        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUserMenu();
            });
        }

        // Profile navigation - Add specific handler for profile link
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href="#profile"]') || e.target.closest('a[href="#profile"]')) {
                e.preventDefault();
                this.showPage('profile');
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Back to top button
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Window events
        window.addEventListener('scroll', () => {
            this.handleScroll();
            this.updateBackToTopVisibility();
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-dropdown')) {
                this.closeUserMenu();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Clear previous errors
        this.clearFormErrors(['login-email-error', 'login-password-error']);
        
        // Basic validation
        if (!email || !password) {
            this.showFormMessage('login-message', 'Please fill in all fields.', 'error');
            return;
        }

        // Simulate loading
        this.setFormLoading('login-form', true);

        // Check credentials
        setTimeout(() => {
            const user = this.authData.users.find(u => u.email === email);
            
            if (!user) {
                this.showFormMessage('login-message', 'No account found with this email address.', 'error');
                this.setFormLoading('login-form', false);
                return;
            }

            // In a real app, you'd hash and compare passwords
            if (user.password !== password) {
                this.showFormMessage('login-message', 'Invalid email or password.', 'error');
                this.setFormLoading('login-form', false);
                return;
            }

            // Successful login
            this.currentUser = user;
            const session = {
                userId: user.id,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };

            localStorage.setItem('astrowellness_session', JSON.stringify(session));
            this.authData.currentSession = session;

            this.showFormMessage('login-message', 'Welcome back! You\'re now logged in.', 'success');
            this.setFormLoading('login-form', false);

            // Update UI and redirect
            setTimeout(() => {
                this.updateAuthUI();
                this.showPage('dashboard');
            }, 1000);

        }, 1000); // Simulate network delay
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {};
        
        for (let [key, value] of formData.entries()) {
            userData[key] = value;
        }

        // Clear previous errors
        this.clearAllFormErrors();

        // Validate form
        const validation = this.validateSignupForm(userData);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            this.showFormMessage('signup-message', 'Please correct the highlighted fields.', 'error');
            return;
        }

        // Check if email already exists
        if (this.authData.users.find(u => u.email === userData.email)) {
            this.showFormError('signup-email-error', 'An account with this email already exists.');
            this.showFormMessage('signup-message', 'An account with this email already exists.', 'error');
            return;
        }

        // Simulate loading
        this.setFormLoading('signup-form', true);

        // Create user account
        setTimeout(() => {
            const newUser = {
                id: Date.now(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || '',
                organization: userData.organization,
                userType: userData.userType,
                experience: userData.experience,
                specialization: userData.specialization || '',
                password: userData.password, // In real app, this would be hashed
                joinDate: new Date().toISOString(),
                newsletter: userData.newsletter === 'on'
            };

            this.authData.users.push(newUser);
            localStorage.setItem('astrowellness_users', JSON.stringify(this.authData.users));

            // Auto-login after signup
            this.currentUser = newUser;
            const session = {
                userId: newUser.id,
                loginTime: new Date().toISOString(),
                rememberMe: false
            };

            localStorage.setItem('astrowellness_session', JSON.stringify(session));
            this.authData.currentSession = session;

            this.showFormMessage('signup-message', 'Welcome to AstroWellness Hub! Your account has been created successfully.', 'success');
            this.setFormLoading('signup-form', false);

            // Update UI and redirect
            setTimeout(() => {
                this.updateAuthUI();
                this.showPage('dashboard');
            }, 2000);

        }, 1500); // Simulate network delay
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const firstName = document.getElementById('edit-first-name').value.trim();
        const lastName = document.getElementById('edit-last-name').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();
        const specialization = document.getElementById('edit-specialization').value;

        // Update user data
        this.currentUser.firstName = firstName;
        this.currentUser.lastName = lastName;
        this.currentUser.phone = phone;
        this.currentUser.specialization = specialization;

        // Update in storage
        const userIndex = this.authData.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.authData.users[userIndex] = this.currentUser;
            localStorage.setItem('astrowellness_users', JSON.stringify(this.authData.users));
        }

        // Update UI
        this.updateProfileDisplay();
        this.updateAuthUI();
        this.toggleProfileEdit();

        // Show success message
        this.showFormMessage('profile-message', 'Your profile information has been updated successfully.', 'success');
    }

    validateSignupForm(data) {
        const errors = {};
        let isValid = true;

        // Required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'organization', 'userType', 'experience'];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                errors[field] = 'This field is required.';
                isValid = false;
            }
        });

        // Email validation
        if (data.email && !this.validateEmailFormat(data.email)) {
            errors.email = 'Please enter a valid email address.';
            isValid = false;
        }

        // Phone validation (if provided)
        if (data.phone && !this.validatePhoneFormat(data.phone)) {
            errors.phone = 'Please enter a valid phone number.';
            isValid = false;
        }

        // Password validation
        if (data.password) {
            const passwordCheck = this.validatePassword(data.password);
            if (!passwordCheck.isValid) {
                errors.password = passwordCheck.message;
                isValid = false;
            }
        }

        // Confirm password
        if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
            isValid = false;
        }

        // Terms acceptance
        if (!data.termsAccepted) {
            errors.terms = 'You must accept the Terms of Service and Privacy Policy.';
            isValid = false;
        }

        return { isValid, errors };
    }

    validatePassword(password) {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long.' };
        }

        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
        }

        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
        }

        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number.' };
        }

        return { isValid: true, message: 'Strong password' };
    }

    validateEmailFormat(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    validatePhoneFormat(phone) {
        const phonePattern = /^[+]?[1-9]\d{1,14}$/;
        return phonePattern.test(phone.replace(/\s/g, ''));
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;

        if (!password) {
            strengthIndicator.textContent = '';
            strengthIndicator.className = 'password-strength';
            return;
        }

        const validation = this.validatePassword(password);
        
        if (!validation.isValid) {
            strengthIndicator.textContent = 'Weak password';
            strengthIndicator.className = 'password-strength weak';
        } else if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            strengthIndicator.textContent = 'Very strong password';
            strengthIndicator.className = 'password-strength strong';
        } else {
            strengthIndicator.textContent = 'Strong password';
            strengthIndicator.className = 'password-strength strong';
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorElement = document.getElementById('confirm-password-error');

        if (confirmPassword && password !== confirmPassword) {
            this.showFormError('confirm-password-error', 'Passwords do not match.');
        } else {
            this.clearFormError('confirm-password-error');
        }
    }

    validateEmail(email, errorElementId) {
        if (email && !this.validateEmailFormat(email)) {
            this.showFormError(errorElementId, 'Please enter a valid email address.');
        } else {
            this.clearFormError(errorElementId);
        }
    }

    showValidationErrors(errors) {
        Object.keys(errors).forEach(field => {
            const errorElementId = field === 'termsAccepted' ? 'terms-error' : `${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`;
            this.showFormError(errorElementId, errors[field]);
        });
    }

    showFormError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearFormError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    clearFormErrors(elementIds) {
        elementIds.forEach(id => this.clearFormError(id));
    }

    clearAllFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    showFormMessage(elementId, message, type) {
        const messageElement = document.getElementById(elementId);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `form-message ${type}`;
        }
    }

    setFormLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                if (isLoading) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = formId === 'login-form' ? 'Sign In' : 'Create Account';
                }
            }
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userNav = document.getElementById('user-nav');
        const userDisplayName = document.getElementById('user-display-name');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) authButtons.classList.add('hidden');
            if (userNav) userNav.classList.remove('hidden');
            if (userDisplayName) {
                userDisplayName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            }
            this.updateProfileDisplay();
        } else {
            // User is not logged in
            if (authButtons) authButtons.classList.remove('hidden');
            if (userNav) userNav.classList.add('hidden');
        }
    }

    updateProfileDisplay() {
        if (!this.currentUser) return;

        const user = this.currentUser;
        const getUserTypeLabel = (type) => {
            const types = {
                'astronaut': 'Active Astronaut',
                'researcher': 'Researcher/Scientist',
                'medical': 'Medical Professional',
                'engineer': 'Aerospace Engineer',
                'admin': 'Administrator',
                'student': 'Student/Academic'
            };
            return types[type] || type;
        };

        // Update profile display elements
        const profileElements = {
            'profile-name': `${user.firstName} ${user.lastName}`,
            'profile-email': user.email,
            'profile-phone': user.phone || 'Not provided',
            'profile-organization': user.organization,
            'profile-role': getUserTypeLabel(user.userType),
            'profile-experience': user.experience + ' years',
            'profile-specialization': user.specialization || 'Not specified',
            'profile-join-date': new Date(user.joinDate).toLocaleDateString()
        };

        Object.keys(profileElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = profileElements[id];
            }
        });

        // Update edit form
        const editElements = {
            'edit-first-name': user.firstName,
            'edit-last-name': user.lastName,
            'edit-phone': user.phone,
            'edit-specialization': user.specialization
        };

        Object.keys(editElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = editElements[id] || '';
            }
        });
    }

    toggleProfileEdit() {
        const profileView = document.getElementById('profile-view');
        const profileEdit = document.getElementById('profile-edit');
        const editBtn = document.getElementById('edit-profile-btn');

        if (profileView && profileEdit && editBtn) {
            if (profileView.classList.contains('hidden')) {
                // Currently editing, switch to view
                profileView.classList.remove('hidden');
                profileEdit.classList.remove('active');
                profileEdit.classList.add('hidden');
                editBtn.textContent = 'Edit Profile';
            } else {
                // Currently viewing, switch to edit
                profileView.classList.add('hidden');
                profileEdit.classList.add('active');
                profileEdit.classList.remove('hidden');
                editBtn.textContent = 'Cancel Edit';
            }
        }
    }

    cancelProfileEdit() {
        this.toggleProfileEdit();
        this.updateProfileDisplay(); // Reset form values
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.toggle('hidden');
        }
    }

    closeUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.add('hidden');
        }
    }

    logout() {
        this.currentUser = null;
        this.authData.currentSession = null;
        localStorage.removeItem('astrowellness_session');
        
        this.updateAuthUI();
        this.closeUserMenu();
        this.showPage('home');

        // Show logout message (could be implemented with a toast notification)
        console.log('You\'ve been logged out successfully.');
    }

    showPage(pageId) {
        console.log('Attempting to show page:', pageId);
        
        // Check if page requires authentication
        const protectedPages = ['profile'];
        if (protectedPages.includes(pageId) && !this.currentUser) {
            this.showPage('login');
            return;
        }
        
        // Hide all pages first
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            console.log('Successfully switched to page:', pageId);
        } else {
            console.error('Page not found:', pageId);
            // Fallback to home if page not found
            const homePage = document.getElementById('home');
            if (homePage) {
                homePage.classList.add('active');
                this.currentPage = 'home';
            }
            return;
        }

        // Update navigation
        this.updateNavigation(pageId);

        // Initialize page-specific functionality
        setTimeout(() => {
            this.initializePageSpecific(pageId);
        }, 100);

        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Update browser history
        if (history.pushState) {
            const newUrl = pageId === 'home' ? window.location.pathname : `${window.location.pathname}#${pageId}`;
            history.pushState({page: pageId}, '', newUrl);
        }
    }

    updateNavigation(activePageId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${activePageId}`) {
                link.classList.add('active');
            }
        });
    }

    initializePageSpecific(pageId) {
        switch (pageId) {
            case 'dashboard':
                this.initializeDashboardCharts();
                break;
            case 'research':
                this.initializeResearchCharts();
                break;
            case 'home':
                this.animateStats();
                break;
            case 'profile':
                this.updateProfileDisplay();
                break;
        }
    }

    initializeCharts() {
        setTimeout(() => {
            this.setupChartDefaults();
        }, 500);
    }

    setupChartDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#94A3B8';
            Chart.defaults.borderColor = 'rgba(59, 130, 246, 0.2)';
            Chart.defaults.backgroundColor = 'rgba(6, 182, 212, 0.1)';
        }
    }

    initializeDashboardCharts() {
        // Destroy existing charts first to prevent duplicates
        if (this.charts.psychological) {
            this.charts.psychological.destroy();
        }
        if (this.charts.boneDensity) {
            this.charts.boneDensity.destroy();
        }

        // Psychological Health Chart
        const psychCanvas = document.getElementById('psychological-chart');
        if (psychCanvas) {
            const ctx = psychCanvas.getContext('2d');
            this.charts.psychological = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Male Anxiety', 'Female Anxiety', 'Male Depression', 'Female Depression'],
                    datasets: [{
                        label: 'Percentage (%)',
                        data: [
                            this.healthData.psychological.maleAnxiety,
                            this.healthData.psychological.femaleAnxiety,
                            this.healthData.psychological.maleDepression,
                            this.healthData.psychological.femaleDepression
                        ],
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                        borderColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Psychological Health Indicators by Gender',
                            color: '#F1F5F9'
                        }
                    },
                    scales: {
                        x: {
                            ticks: { 
                                color: '#94A3B8',
                                maxRotation: 45
                            },
                            grid: { 
                                color: 'rgba(59, 130, 246, 0.2)' 
                            }
                        },
                        y: {
                            ticks: { 
                                color: '#94A3B8',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { 
                                color: 'rgba(59, 130, 246, 0.2)' 
                            },
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        // Bone Density Loss Chart
        const boneCanvas = document.getElementById('bone-density-chart');
        if (boneCanvas) {
            const ctx = boneCanvas.getContext('2d');
            
            const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 
                          'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
            const boneDensityData = [];
            let currentDensity = 100;
            
            for (let i = 0; i < 12; i++) {
                boneDensityData.push(currentDensity);
                currentDensity -= this.healthData.physical.boneDensityLoss;
            }

            this.charts.boneDensity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Bone Density (%)',
                        data: boneDensityData,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#B4413C',
                        pointBorderColor: '#B4413C',
                        pointHoverBackgroundColor: '#FFC185',
                        pointHoverBorderColor: '#FFC185'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#F1F5F9'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Bone Density Loss in Microgravity (1.5% per month)',
                            color: '#F1F5F9'
                        }
                    },
                    scales: {
                        x: {
                            ticks: { 
                                color: '#94A3B8',
                                maxRotation: 45
                            },
                            grid: { 
                                color: 'rgba(59, 130, 246, 0.2)' 
                            }
                        },
                        y: {
                            ticks: { 
                                color: '#94A3B8',
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                }
                            },
                            grid: { 
                                color: 'rgba(59, 130, 246, 0.2)' 
                            },
                            min: 80,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    initializeResearchCharts() {
        if (this.charts.genderComparison) {
            this.charts.genderComparison.destroy();
        }

        const genderCanvas = document.getElementById('gender-comparison-chart');
        if (genderCanvas) {
            const ctx = genderCanvas.getContext('2d');
            this.charts.genderComparison = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Anxiety Symptoms', 'Depression Symptoms', 'Space Adaptation Issues', 'Communication Stress', 'Sleep Disruption', 'Isolation Effects'],
                    datasets: [{
                        label: 'Male Astronauts (%)',
                        data: [22.8, 34.8, 68, 45, 62, 58],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.2)',
                        pointBackgroundColor: '#1FB8CD',
                        pointBorderColor: '#1FB8CD'
                    }, {
                        label: 'Female Astronauts (%)',
                        data: [85.2, 43.2, 72, 52, 67, 74],
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.2)',
                        pointBackgroundColor: '#FFC185',
                        pointBorderColor: '#FFC185'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#F1F5F9'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Psychological Health Comparison by Gender',
                            color: '#F1F5F9'
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                color: 'rgba(59, 130, 246, 0.2)'
                            },
                            grid: {
                                color: 'rgba(59, 130, 246, 0.2)'
                            },
                            pointLabels: {
                                color: '#94A3B8'
                            },
                            ticks: {
                                color: '#94A3B8',
                                backdropColor: 'transparent'
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach((stat, index) => {
            const finalText = stat.textContent;
            const finalValue = parseFloat(finalText.replace('%', ''));
            
            if (isNaN(finalValue)) return;
            
            const suffix = finalText.includes('%') ? '%' : '';
            let currentValue = 0;
            const increment = finalValue / 60;
            
            const animate = () => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = finalText;
                } else {
                    stat.textContent = currentValue.toFixed(1) + suffix;
                    requestAnimationFrame(animate);
                }
            };
            
            setTimeout(() => {
                animate();
            }, index * 200);
        });
    }

    setupBackToTop() {
        this.updateBackToTopVisibility();
    }

    updateBackToTopVisibility() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.remove('hidden');
            } else {
                backToTopBtn.classList.add('hidden');
            }
        }
    }

    handleScroll() {
        this.animateOnScroll();
    }

    animateOnScroll() {
        const elements = document.querySelectorAll('.card, .stat-card, .challenge-card, .support-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }

    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // Utility functions
    formatNumber(num, decimals = 1) {
        return parseFloat(num).toFixed(decimals);
    }

    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const suffix = element.textContent.includes('%') ? '%' : '';
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutQuart(progress);
            element.textContent = this.formatNumber(current) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    handleError(error, context = 'Unknown') {
        console.error(`AstroWellness Hub Error [${context}]:`, error);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new AstroWellnessHub();
        
        // Make app globally accessible for debugging
        window.AstroWellnessHub = app;
        
        console.log('AstroWellness Hub initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AstroWellness Hub:', error);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Page visible - resuming operations');
    } else {
        console.log('Page hidden - pausing operations');
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page && window.AstroWellnessHub) {
        window.AstroWellnessHub.showPage(event.state.page);
    }
});

// Add smooth scrolling to all internal links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Initialize CSS animations for cards
const style = document.createElement('style');
style.textContent = `
    .card, .stat-card, .challenge-card, .support-item {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease;
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid #06B6D4 !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(style);