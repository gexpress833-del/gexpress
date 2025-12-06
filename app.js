if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });

        // ============================================
        // Supabase Client (auth + données)
        // ============================================
        const SUPABASE_URL = 'https://ecserqowrwehijyopjyw.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjc2VycW93cndlaGlqeW9wanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTY0NDQsImV4cCI6MjA3ODYzMjQ0NH0.Yd6DCPhQlQnZwIEfvF6JLymph9MAwVmWT6mSKUl_6Kg';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Bucket de stockage Supabase (images landing / offres / avatars, etc.)
        const STORAGE_BUCKET = 'gexpress_media';

        // ============================================
        // Fonctions de modal personnalisées
        // ============================================
        function showAlert(title, message) {
            const modal = document.getElementById('alertModal');
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertMessage').textContent = message;
            modal.classList.remove('hidden');

            document.getElementById('alertOkBtn').onclick = () => {
                modal.classList.add('hidden');
            };
        }

        function showConfirm(title, message, onConfirm) {
            const modal = document.getElementById('confirmModal');
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            modal.classList.remove('hidden');

            document.getElementById('confirmOkBtn').onclick = () => {
                modal.classList.add('hidden');
                if (onConfirm) onConfirm();
            };

            document.getElementById('confirmCancelBtn').onclick = () => {
                modal.classList.add('hidden');
            };
        }

        // ============================================
        // Données et État de l'Application
        // ============================================

        // Plans d'abonnement
        const subscriptionPlans = {
            weekly: [
                {
                    id: 'classique-weekly',
                    name: 'Forfait Classique',
                    price: 50000,
                    duration: 'hebdomadaire',
                    days: 5,
                    features: [
                        '1 repas/jour',
                        'Menu varié du jour',
                        'Livraison quotidienne',
                        '5 repas/semaine'
                    ],
                    icon: '✨'
                },
                {
                    id: 'professionnel-weekly',
                    name: 'Forfait Professionnel',
                    price: 87000,
                    duration: 'hebdomadaire',
                    days: 5,
                    features: [
                        '1 repas/jour',
                        'Menu varié du jour',
                        'Priorité préparation',
                        'Livraison prioritaire',
                        '5 repas/semaine'
                    ],
                    icon: '💼',
                    popular: true
                },
                {
                    id: 'premium-weekly',
                    name: 'Forfait Premium',
                    price: 125000,
                    duration: 'hebdomadaire',
                    days: 5,
                    features: [
                        '1 repas/jour',
                        'Choix libre du plat',
                        'Service personnalisé',
                        'Livraison VIP prioritaire',
                        '5 repas/semaine'
                    ],
                    icon: '👑'
                }
            ],
            monthly: [
                {
                    id: 'classique-monthly',
                    name: 'Forfait Classique',
                    price: 200000,
                    duration: 'mensuel',
                    days: 20,
                    features: [
                        '1 repas/jour',
                        'Menu varié',
                        'Livraison quotidienne',
                        '20 repas/mois',
                        'Économie importante'
                    ],
                    icon: '✨'
                },
                {
                    id: 'professionnel-monthly',
                    name: 'Forfait Professionnel',
                    price: 348000,
                    duration: 'mensuel',
                    days: 20,
                    features: [
                        '1 repas/jour',
                        'Menu varié',
                        'Priorité préparation',
                        'Livraison prioritaire',
                        '20 repas/mois',
                        'Idéal entreprises'
                    ],
                    icon: '💼',
                    popular: true
                },
                {
                    id: 'premium-monthly',
                    name: 'Forfait Premium',
                    price: 500000,
                    duration: 'mensuel',
                    days: 20,
                    features: [
                        '1 repas/jour',
                        'Liberté totale de choix',
                        'Service personnalisé',
                        'Livraison VIP',
                        '20 repas/mois',
                        'Expérience Premium'
                    ],
                    icon: '👑'
                }
            ]
        };

        // Stockage en mémoire (remplace localStorage qui n'est pas supporté dans iframe)
        const appData = {
            users: [
                {
                    id: 'admin-1',
                    username: 'admin',
                    // Mot de passe de démonstration: admin123
                    passwordHash: '$2a$12$WNYDseJNtuZQAtjfkn69yuvMlGfN8m6YDuJbOUJwajKloCLXXZcIm',
                    name: 'Administrateur',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-1',
                    username: 'client',
                    // Mot de passe de démonstration: client123
                    passwordHash: '$2a$12$uwl7TJ/a30OOakeIHP73zOgYhyYNKMx3lp2mQi93MG5a7S4PeUuC.',
                    name: 'Client Démo',
                    phone: '097 254 5000',
                    address: 'Kolwezi, RDC',
                    role: 'user',
                    preferences: { allergies: '', dietary: '', tags: [] },
                    createdAt: new Date().toISOString()
                }
            ],
            subscriptions: [],
            paymentRequests: [],
            contactMessages: [],
            paymentHistory: [],
            notifications: []
        };

        // Clé de session pour persister l'utilisateur connecté
        const CURRENT_USER_KEY = 'green_express_current_user_v1';

        // --- Persistence (localStorage) -------------------------------------------------
        // v3 : nouvelle version du schéma (passwordHash bcrypt au lieu de password en clair)
        // On nettoie l'ancienne clé pour éviter de garder des anciens hash incompatibles
        try { localStorage.removeItem('green_express_data_v2'); } catch (e) {}
        const STORAGE_KEY = 'green_express_data_v3';

        function persistAll() {
            try {
                // Les données critiques (utilisateurs, abonnements, paiements, notifications, messages) viennent de Supabase.
                // On peut à terme supprimer complètement cette persistance ou y laisser uniquement des préférences.
                const payload = {
                    subscriptions: appData.subscriptions,
                    paymentRequests: appData.paymentRequests,
                    contactMessages: appData.contactMessages,
                    paymentHistory: appData.paymentHistory,
                    notifications: appData.notifications
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            } catch (e) {
                console.warn('Impossible de sauvegarder les données dans localStorage', e);
            }
        }

        // Initialiser les données : si localStorage contient des données, les charger.
        function initializeData() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Fusionner en conservant les valeurs par défaut si manquantes
                    // ⚠️ Les données critiques viennent de Supabase, ce cache est purement optionnel.
                    appData.subscriptions = parsed.subscriptions && parsed.subscriptions.length ? parsed.subscriptions : appData.subscriptions;
                    appData.paymentRequests = parsed.paymentRequests && parsed.paymentRequests.length ? parsed.paymentRequests : appData.paymentRequests;
                    appData.contactMessages = parsed.contactMessages && parsed.contactMessages.length ? parsed.contactMessages : appData.contactMessages;
                    appData.paymentHistory = parsed.paymentHistory && parsed.paymentHistory.length ? parsed.paymentHistory : appData.paymentHistory;
                    appData.notifications = parsed.notifications && parsed.notifications.length ? parsed.notifications : appData.notifications;
                } else {
                    // sauvegarder l'état initial
                    persistAll();
                }
            } catch (e) {
                console.warn('Erreur lors de l\'initialisation des données', e);
            }
        }

        // Gestion de l'état actuel
        let currentUser = null;
        let currentPeriod = 'weekly';

        // ============================================
        // Fonctions Utilitaires
        // ============================================

        function formatCurrency(amount) {
            return new Intl.NumberFormat('fr-FR').format(amount) + ' FC';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Ajoute des jours ouvrés (lundi-vendredi), en excluant samedis/dimanches
        // businessDays = 0 retourne la date de départ (utile pour un intervalle inclusif)
        function addBusinessDays(startDate, businessDays) {
            const date = new Date(startDate);
            let added = 0;
            while (added < businessDays) {
                date.setDate(date.getDate() + 1);
                const day = date.getDay(); // 0: dimanche, 6: samedi
                if (day !== 0 && day !== 6) {
                    added++;
                }
            }
            return date;
        }

        function getUsers() {
            return appData.users;
        }

        // Charger tous les utilisateurs depuis Supabase et les mettre dans appData.users
        async function loadUsersFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, username, name, phone, address, role, preferences, created_at')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.warn('Erreur lors du chargement des utilisateurs depuis Supabase', error);
                    return;
                }

                appData.users = (data || []).map(u => ({
                    id: u.id,
                    username: u.username,
                    name: u.name,
                    phone: u.phone,
                    address: u.address,
                    role: u.role || 'user',
                    preferences: u.preferences || { allergies: '', dietary: '', tags: [] },
                    createdAt: u.created_at || new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement des utilisateurs Supabase', e);
            }
        }

        function saveUsers(users) {
            appData.users = users;
            persistAll();
        }

        function getSubscriptions() {
            return appData.subscriptions || [];
        }

        // Charger les abonnements depuis Supabase et les mapper dans appData.subscriptions
        async function loadSubscriptionsFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('id, user_id, plan_id, plan_name, amount, start_date, end_date, status, created_at, users (name, phone, address, username)')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.warn('Erreur lors du chargement des abonnements depuis Supabase', error);
                    return;
                }

                appData.subscriptions = (data || []).map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    userName: row.users?.name || row.users?.username || '',
                    planId: row.plan_id,
                    planName: row.plan_name || row.plan_id,
                    amount: row.amount,
                    startDate: row.start_date,
                    endDate: row.end_date,
                    status: row.status,
                    createdAt: row.created_at || new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement des abonnements Supabase', e);
            }
        }

        function saveSubscriptions(subscriptions) {
            // Conservé pour compatibilité éventuelle, mais la persistance réelle se fait via Supabase.
            appData.subscriptions = subscriptions;
            persistAll();
        }

        function getPaymentRequests() {
            return appData.paymentRequests || [];
        }

        // Charger les demandes de paiement depuis Supabase
        async function loadPaymentRequestsFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('payment_requests')
                    .select('id, user_id, plan_id, plan_name, amount, user_name, user_email, status, created_at, users (phone, address)')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.warn('Erreur lors du chargement des demandes de paiement depuis Supabase', error);
                    return;
                }

                appData.paymentRequests = (data || []).map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    userName: row.user_name || row.users?.name || '',
                    userPhone: row.users?.phone || '',
                    userAddress: row.users?.address || '',
                    planId: row.plan_id,
                    planName: row.plan_name,
                    amount: row.amount,
                    status: row.status,
                    createdAt: row.created_at || new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement des demandes de paiement Supabase', e);
            }
        }

        function savePaymentRequests(requests) {
            // Conservé pour compatibilité d’interface, mais la persistance se fait via Supabase.
            appData.paymentRequests = requests;
            persistAll();
        }

        function generateId(prefix) {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // ============================================
        // Notification System (role-based, Supabase)
        // ============================================
        async function loadNotificationsFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('id, type, title, message, to_role, target_user_id, related_id, read, created_at')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.warn('Erreur lors du chargement des notifications depuis Supabase', error);
                    return;
                }

                appData.notifications = (data || []).map(n => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    toRole: n.to_role,
                    targetUserId: n.target_user_id,
                    relatedId: n.related_id,
                    read: n.read,
                    createdAt: n.created_at || new Date().toISOString()
                }));
                updateNotificationBadge();
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement des notifications Supabase', e);
            }
        }

        function getNotifications() {
            return appData.notifications || [];
        }

        async function addNotification(type, title, message, toRole = 'admin', relatedId = null, targetUserId = null) {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .insert({
                type,
                title,
                message,
                        to_role: toRole,
                        target_user_id: targetUserId,
                        related_id: relatedId,
                read: false
                    })
                    .select('id, type, title, message, to_role, target_user_id, related_id, read, created_at')
                    .single();

                if (error || !data) {
                    console.warn('Erreur lors de la création de la notification Supabase', error);
                    return null;
                }

                if (!Array.isArray(appData.notifications)) appData.notifications = [];
                appData.notifications.push({
                    id: data.id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    toRole: data.to_role,
                    targetUserId: data.target_user_id,
                    relatedId: data.related_id,
                    read: data.read,
                    createdAt: data.created_at || new Date().toISOString()
                });
            updateNotificationBadge();
                return data;
            } catch (e) {
                console.warn('Erreur inattendue lors de la création de la notification Supabase', e);
                return null;
            }
        }

        async function markNotificationRead(notifId) {
            try {
                const { error } = await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('id', notifId);

                if (error) {
                    console.warn('Erreur lors du marquage de notification comme lue dans Supabase', error);
                }

                if (Array.isArray(appData.notifications)) {
            const notif = appData.notifications.find(n => n.id === notifId);
                    if (notif) notif.read = true;
                }
                updateNotificationBadge();

                const modal = document.getElementById('notificationCenter');
                if (modal && !modal.classList.contains('hidden')) renderNotificationList();
            } catch (e) {
                console.warn('Erreur inattendue lors du marquage de notification comme lue', e);
            }
        }

        function getUnreadNotifications() {
            if (!currentUser) return [];

            return (appData.notifications || []).filter(n => {
                if (n.read) return false;

                if (currentUser.role === 'admin') {
                    // L'admin voit toutes les notifications non lues
                    return true;
                }

                // Client : ne voit que ses notifications (toRole 'user' + targetUserId vide ou = son id)
                if (n.toRole !== 'user') return false;
                if (n.targetUserId && n.targetUserId !== currentUser.id) return false;
                return true;
            });
        }

        function updateNotificationBadge() {
            const badges = document.querySelectorAll('#notificationBadgeUser, #notificationBadgeAdmin');
            const count = getUnreadNotifications().length;
            badges.forEach(badge => {
                badge.textContent = count;
                if (count > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
            }
            });
        }

        // ============================================
        // Payment History (Supabase)
        // ============================================
        async function addPaymentHistory(subscriptionId, userId, amount, status = 'completed') {
            try {
                const invoiceNumber = `INV-${Date.now()}`;
                const { data, error } = await supabase
                    .from('payment_history')
                    .insert({
                        subscription_id: subscriptionId,
                        user_id: userId,
                amount,
                status,
                        invoice_number: invoiceNumber
                    })
                    .select('id, subscription_id, user_id, amount, status, invoice_number, created_at')
                    .single();

                if (error || !data) {
                    console.error('Erreur lors de l\'ajout à l\'historique des paiements Supabase', error);
                    return null;
                }

                if (!Array.isArray(appData.paymentHistory)) appData.paymentHistory = [];
                appData.paymentHistory.push({
                    id: data.id,
                    subscriptionId: data.subscription_id,
                    userId: data.user_id,
                    amount: data.amount,
                    status: data.status,
                    invoiceNumber: data.invoice_number,
                    createdAt: data.created_at || new Date().toISOString()
                });

                return data;
            } catch (e) {
                console.error('Erreur inattendue lors de l\'ajout à l\'historique des paiements Supabase', e);
                return null;
            }
        }

        async function loadPaymentHistoryFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('payment_history')
                    .select('id, subscription_id, user_id, amount, status, invoice_number, created_at')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.warn('Erreur lors du chargement de l\'historique des paiements depuis Supabase', error);
                    return;
                }

                appData.paymentHistory = (data || []).map(row => ({
                    id: row.id,
                    subscriptionId: row.subscription_id,
                    userId: row.user_id,
                    amount: row.amount,
                    status: row.status,
                    invoiceNumber: row.invoice_number,
                    createdAt: row.created_at || new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement de l\'historique des paiements Supabase', e);
            }
        }

        function getPaymentHistory() {
            return appData.paymentHistory || [];
        }

        function getPaymentsBySubscription(subId) {
            return getPaymentHistory().filter(p => p.subscriptionId === subId);
        }

        // Helper pour obtenir l'URL publique d'une image stockée dans le bucket Supabase
        function getPublicImageUrl(path) {
            if (!path) return null;
            try {
                const { data } = supabase
                    .storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(path);
                return data && data.publicUrl ? data.publicUrl : null;
            } catch (e) {
                console.warn('Erreur lors de la génération de l’URL publique pour le fichier', path, e);
                return null;
            }
        }

        // Récupérer les fichiers d'un dossier du bucket (landing, offers/...)
        async function fetchFolderImages(folderPath) {
            try {
                const { data, error } = await supabase
                    .storage
                    .from(STORAGE_BUCKET)
                    .list(folderPath, { limit: 100 });

                if (error) {
                    console.warn(`Erreur lors du listing du dossier ${folderPath} dans le bucket`, error);
                    return [];
                }

                // Ne garder que les fichiers (pas de sous-dossiers)
                return (data || [])
                    .filter(item => item && item.name)
                    .map(item => `${folderPath}/${item.name}`);
            } catch (e) {
                console.warn(`Erreur inattendue lors du listing du dossier ${folderPath}`, e);
                return [];
            }
        }

        // ============================================
        // Navigation entre les pages
        // ============================================

        function showPage(pageId) {
            const pages = ['landingPage','loginPage', 'registerPage', 'userDashboard', 'adminDashboard', 'flyerPage'];
            pages.forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            document.getElementById(pageId).classList.remove('hidden');
        }

        // Show a specific landing section (ensure landingPage is visible then scroll to it)
        function showLandingSection(sectionId) {
            showPage('landingPage');
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        }

        // Mettre à jour dynamiquement les boutons d'authentification sur la landing
        function updateLandingAuthButtons() {
            try {
                const registerLink = document.getElementById('landingRegisterLink');
                const mySpaceBtn = document.getElementById('landingMySpaceBtn');
                const loginBtn = document.getElementById('landingLoginBtn');

                if (!registerLink || !mySpaceBtn || !loginBtn) return;

                if (currentUser) {
                    // Utilisateur connecté : afficher "Mon espace", masquer "Se connecter" et "S'inscrire"
                    mySpaceBtn.classList.remove('hidden');
                    loginBtn.classList.add('hidden');
                    registerLink.classList.add('hidden');
                } else {
                    // Utilisateur déconnecté : afficher "Se connecter" et "S'inscrire", masquer "Mon espace"
                    mySpaceBtn.classList.add('hidden');
                    loginBtn.classList.remove('hidden');
                    registerLink.classList.remove('hidden');
                }
            } catch (e) {
                console.warn('Erreur lors de la mise à jour des boutons d\'authentification de la landing', e);
            }
        }

        // Bouton "Mon espace" dans la landing : redirige vers le bon tableau de bord ou la connexion
        window.goToMySpace = function() {
            try {
                if (currentUser) {
                    if (currentUser.role === 'admin') {
                        loadAdminDashboard();
                        showPage('adminDashboard');
                    } else {
                        loadUserDashboard();
                        showPage('userDashboard');
                    }
                } else {
                    showPage('loginPage');
                    setTimeout(() => {
                        const el = document.getElementById('loginUsername');
                        if (el) el.focus();
                    }, 200);
                }
            } catch (e) {
                console.warn('Erreur lors de la navigation vers Mon espace', e);
                showPage('loginPage');
            }
        };

        // Ouvrir le flyer depuis les pages publiques
        document.getElementById('openFlyerFromLogin')?.addEventListener('click', () => showPage('flyerPage'));
        document.getElementById('openFlyerFromRegister')?.addEventListener('click', () => showPage('flyerPage'));

        // Fermer et imprimer le flyer
        document.getElementById('closeFlyerBtn')?.addEventListener('click', () => showPage('loginPage'));

        // ============================================
        // Authentification
        // ============================================

        // Debug helpers removed for production

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');

            errorEl.classList.add('hidden');
            errorEl.textContent = '';

            if (!username || !password) {
                errorEl.textContent = 'Veuillez entrer un nom d\'utilisateur et un mot de passe.';
                errorEl.classList.remove('hidden');
                    return;
                }

            try {
                if (!window.dcodeIO || !window.dcodeIO.bcrypt) {
                    errorEl.textContent = 'Erreur interne: bcrypt non disponible.';
                    errorEl.classList.remove('hidden');
                    return;
                }

                // Récupérer l'utilisateur depuis Supabase
                const { data: user, error } = await supabase
                    .from('users')
                    .select('id, username, email, name, phone, address, role, password_hash, created_at')
                    .eq('username', username)
                    .single();

                if (error || !user) {
                    errorEl.textContent = 'Identifiants invalides. Vérifiez le nom d\'utilisateur et le mot de passe.';
                    errorEl.classList.remove('hidden');
                return;
            }

                // Vérifier le mot de passe avec bcrypt côté client
                const ok = window.dcodeIO.bcrypt.compareSync(password, user.password_hash);
                if (!ok) {
                    errorEl.textContent = 'Identifiants invalides. Vérifiez le nom d\'utilisateur et le mot de passe.';
                    errorEl.classList.remove('hidden');
                    return;
                }

                // Mapper l'utilisateur Supabase vers currentUser utilisé par le reste de l'app
                currentUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    address: user.address,
                    role: user.role || 'user',
                    createdAt: user.created_at || new Date().toISOString()
                };
                // Sauvegarder la session utilisateur côté client pour éviter de devoir se reconnecter
                try {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
                        id: currentUser.id,
                        username: currentUser.username,
                        email: currentUser.email,
                        name: currentUser.name,
                        phone: currentUser.phone,
                        address: currentUser.address,
                        role: currentUser.role,
                        createdAt: currentUser.createdAt
                    }));
                } catch (e) {
                    console.warn('Impossible de sauvegarder la session utilisateur', e);
                }
                // Adapter les boutons de la landing (cacher "S'inscrire" si connecté)
                updateLandingAuthButtons();
            } catch (err) {
                console.error('Login error:', err);
                errorEl.textContent = 'Erreur de connexion. Veuillez réessayer.';
                errorEl.classList.remove('hidden');
                return;
            }

                if (currentUser.role === 'admin') {
                    loadAdminDashboard();
                    showPage('adminDashboard');
                } else {
                    loadUserDashboard();
                    showPage('userDashboard');
                }

                document.getElementById('loginForm').reset();
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('registerName').value.trim();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const phone = document.getElementById('registerPhone').value.trim();
            const address = document.getElementById('registerAddress').value.trim();

            const errorEl = document.getElementById('registerError');
            const successEl = document.getElementById('registerSuccess');

            errorEl.classList.add('hidden');
            successEl.classList.add('hidden');
            errorEl.textContent = '';
            successEl.textContent = '';

            if (!name || !username || !password) {
                errorEl.textContent = 'Veuillez renseigner au minimum le nom complet, le nom d\'utilisateur et le mot de passe.';
                errorEl.classList.remove('hidden');
                return;
            }

            if (!window.dcodeIO || !window.dcodeIO.bcrypt) {
                errorEl.textContent = 'Erreur interne: bcrypt non disponible.';
                errorEl.classList.remove('hidden');
                return;
            }

            // Pour garder le schéma Supabase, on génère un email simple à partir du username
            const email = `${username}@example.com`;

            try {
                // Vérifier si le username ou l'email existe déjà
                const { data: existing, error: checkError } = await supabase
                    .from('users')
                    .select('id')
                    .or(`username.eq.${username},email.eq.${email}`)
                    .limit(1);

                if (checkError) {
                    console.error('Erreur de vérification utilisateur Supabase', checkError);
                    errorEl.textContent = 'Erreur lors de la vérification du compte. Veuillez réessayer.';
                    errorEl.classList.remove('hidden');
                    return;
                }

                if (existing && existing.length > 0) {
                    errorEl.textContent = 'Ce nom d\'utilisateur est déjà utilisé.';
                    errorEl.classList.remove('hidden');
                    return;
                }

                // Hachage du mot de passe pour stockage dans Supabase
                const passwordHash = window.dcodeIO.bcrypt.hashSync(password, 12);

                const { data: inserted, error: insertError } = await supabase
                    .from('users')
                    .insert({
                username,
                        email,
                        password_hash: passwordHash,
                name,
                phone,
                address,
                role: 'user',
                        preferences: { allergies: '', dietary: '', tags: [] }
                    })
                    .select('id, username, name, phone, address, role, preferences, created_at')
                    .single();

                if (insertError || !inserted) {
                    console.error('Erreur lors de la création de l’utilisateur Supabase', insertError);
                    errorEl.textContent = 'Erreur lors de la création du compte. Veuillez réessayer.';
                    errorEl.classList.remove('hidden');
                    return;
                }

                // Mettre à jour le cache local des utilisateurs
                await loadUsersFromSupabase();

                successEl.textContent = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
                successEl.classList.remove('hidden');
                errorEl.classList.add('hidden');
            document.getElementById('registerForm').reset();

            setTimeout(() => {
                showPage('loginPage');
                    successEl.classList.add('hidden');
            }, 2000);
            } catch (err) {
                console.error('Erreur lors de l’inscription', err);
                errorEl.textContent = 'Erreur lors de l’inscription. Veuillez réessayer.';
                errorEl.classList.remove('hidden');
            }
        });

        document.getElementById('showRegisterBtn').addEventListener('click', () => {
            showPage('registerPage');
        });

        document.getElementById('showLoginBtn').addEventListener('click', () => {
            showPage('loginPage');
        });

        document.getElementById('userLogoutBtn').addEventListener('click', () => {
            // stop any polling before logout
            stopPendingPoll();
            currentUser = null;
            updateNotificationBadge();  // Hide badge when logging out
            try { localStorage.removeItem(CURRENT_USER_KEY); } catch (e) { /* ignore */ }
            updateLandingAuthButtons();
            showPage('loginPage');
        });

        document.getElementById('adminLogoutBtn').addEventListener('click', () => {
            // stop polling if admin logs out
            stopPendingPoll();
            currentUser = null;
            updateNotificationBadge();  // Hide badge when logging out
            try { localStorage.removeItem(CURRENT_USER_KEY); } catch (e) { /* ignore */ }
            updateLandingAuthButtons();
            showPage('loginPage');
        });

        // ============================================
        // Dashboard Utilisateur
        // ============================================

        function loadUserDashboard() {
            document.getElementById('userWelcome').textContent = `Bienvenue, ${currentUser.name}`;

            // Render user's subscription history always
            try {
                renderUserSubscriptions();
                document.getElementById('userHistorySection')?.classList.remove('hidden');
                renderUserRequestsHistory();
            } catch (e) { /* ignore if not ready */ }

            const subscriptions = getSubscriptions();
            const paymentRequests = getPaymentRequests();

            const userSubscription = subscriptions.find(s => s.userId === currentUser.id && s.status === 'active');
            const userPendingRequest = paymentRequests.find(r => r.userId === currentUser.id && r.status === 'pending');

            // Afficher l'abonnement actif
            if (userSubscription) {
                // If there was a polling process waiting for admin approval, stop it
                stopPendingPoll();
                document.getElementById('activeSubscriptionSection').classList.remove('hidden');
                document.getElementById('chooseSubscriptionSection').classList.add('hidden');

                const plan = findPlanById(userSubscription.planId);
                const endDate = new Date(userSubscription.endDate);
                const today = new Date();
                const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                document.getElementById('activeSubscriptionCard').innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <div class="text-3xl mb-2">${plan.icon}</div>
                            <h3 class="text-2xl font-bold">${plan.name}</h3>
                            <p class="text-white/90">${plan.duration === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}</p>
                        </div>
                        <div class="bg-white/20 px-4 py-2 rounded-lg">
                            <div class="text-sm">Actif</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-white/10 rounded-lg p-3">
                            <div class="text-sm text-white/80">Date de début</div>
                            <div class="font-semibold">${formatDate(userSubscription.startDate)}</div>
                        </div>
                        <div class="bg-white/10 rounded-lg p-3">
                            <div class="text-sm text-white/80">Date de fin</div>
                            <div class="font-semibold">${formatDate(userSubscription.endDate)}</div>
                        </div>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Jours restants</span>
                            <span class="text-2xl font-bold">${daysLeft > 0 ? daysLeft : 0} jours</span>
                        </div>
                    </div>
                `;
            } else if (userPendingRequest) {
                document.getElementById('pendingRequestSection').classList.remove('hidden');
                document.getElementById('chooseSubscriptionSection').classList.add('hidden');

                const plan = findPlanById(userPendingRequest.planId);

                document.getElementById('pendingRequestCard').innerHTML = `
                    <div class="flex items-start space-x-4">
                        <div class="text-4xl">${plan.icon}</div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${plan.name}</h3>
                            <p class="text-gray-600 dark:text-gray-400 mb-4">
                                Votre demande d'abonnement est en attente de validation.
                                L'administrateur vérifiera votre paiement et activera votre abonnement sous peu.
                            </p>
                            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">Montant</span>
                                    <span class="font-bold text-gray-900 dark:text-white">${formatCurrency(plan.price)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">Durée</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">${plan.duration === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">Date de demande</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">${formatDate(userPendingRequest.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Start polling to detect when admin activates the subscription
                startPendingPoll(currentUser.id);
            } else {
                // No pending request: ensure polling is stopped
                stopPendingPoll();
                document.getElementById('activeSubscriptionSection').classList.add('hidden');
                document.getElementById('pendingRequestSection').classList.add('hidden');
                document.getElementById('chooseSubscriptionSection').classList.remove('hidden');
                renderSubscriptionPlans();
            }
        }

        // Render history of all payment requests for the current user
        function renderUserRequestsHistory() {
            const container = document.getElementById('userRequestsHistoryList');
            const section = document.getElementById('userRequestsHistorySection');
            if (!container || !section || !currentUser) return;

            const requests = getPaymentRequests().filter(r => r.userId === currentUser.id);

            if (!requests.length) {
                section.classList.add('hidden');
                container.innerHTML = `<div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">Aucune demande d'abonnement.</div>`;
                return;
            }

            section.classList.remove('hidden');

            const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            container.innerHTML = sorted.map(req => {
                let statusLabel = req.status || '';
                let statusClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';

                if (req.status === 'pending') {
                    statusLabel = 'En attente';
                    statusClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                } else if (req.status === 'approved') {
                    statusLabel = 'Approuvée';
                    statusClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                } else if (req.status === 'rejected') {
                    statusLabel = 'Rejetée';
                    statusClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                }

                return `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <div class="text-sm text-gray-500">${req.planName}</div>
                            <div class="font-semibold">${formatDate(req.createdAt)}</div>
                            <div class="text-sm text-gray-500">Montant : ${formatCurrency(req.amount)}</div>
                        </div>
                        <div class="text-right space-y-2">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}">
                                ${statusLabel || 'Inconnu'}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ================= Polling for admin approval ======================
        // Polls localStorage every 10 seconds to check if admin has activated the
        // subscription for the current user. This is a simple client-side strategy
        // to notify the user without a backend.
        window.pendingPollIntervalId = null;

        function startPendingPoll(userId) {
            // avoid duplicate intervals
            stopPendingPoll();
            window.pendingPollIntervalId = setInterval(() => {
                // reload appData from localStorage to detect changes made in another tab/window
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (!raw) return;
                    const parsed = JSON.parse(raw);
                    const subs = parsed.subscriptions || [];
                    const userActive = subs.find(s => s.userId === userId && s.status === 'active');
                    if (userActive) {
                        stopPendingPoll();
                        // Hide the pending request message immediately so the user sees the updated state
                        try { document.getElementById('pendingRequestSection')?.classList.add('hidden'); } catch(e){}
                        showAlert('Abonnement activé', 'Votre abonnement a été activé par l\'administrateur. Vous pouvez maintenant en profiter.');
                        // reload dashboard to reflect changes
                        setTimeout(() => {
                            // reload in-memory data and refresh dashboard
                            initializeData();
                            if (currentUser && currentUser.id === userId) loadUserDashboard();
                        }, 600);
                    }
                } catch (e) {
                    console.warn('Erreur lors du polling des abonnements', e);
                }
            }, 10000); // 10s
        }

        function stopPendingPoll() {
            if (window.pendingPollIntervalId) {
                clearInterval(window.pendingPollIntervalId);
                window.pendingPollIntervalId = null;
            }
        }

        function findPlanById(planId) {
            const allPlans = [...subscriptionPlans.weekly, ...subscriptionPlans.monthly];
            return allPlans.find(p => p.id === planId);
        }

        function renderSubscriptionPlans() {
            const container = document.getElementById('subscriptionPlans');
            const plans = subscriptionPlans[currentPeriod];

            container.innerHTML = plans.map(plan => `
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105 ${plan.popular ? 'ring-2 ring-green-express' : ''}">
                    ${plan.popular ? '<div class="bg-green-express text-white text-center py-2 text-sm font-semibold">Le plus populaire</div>' : ''}
                    <div class="p-6">
                        <div class="text-center mb-4">
                            <div class="text-4xl mb-3">${plan.icon}</div>
                            <h3 class="text-xl font-bold mb-2">${plan.name}</h3>
                            <div class="text-3xl font-bold text-green-express mb-1">${formatCurrency(plan.price)}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${((plan.duration||'').toString().toLowerCase().includes('heb') || (plan.duration||'').toString().toLowerCase().includes('week') || (plan.days && plan.days <= 7)) ? 'par semaine' : 'par mois'}</div>
                        </div>
                        <ul class="space-y-3 mb-6">
                            ${plan.features.map(feature => `
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-express mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                    <span class="text-sm text-gray-600 dark:text-gray-300">${feature}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <button onclick="selectPlan('${plan.id}')"
                            class="w-full bg-green-express hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition transform hover:scale-105">
                            Choisir ce forfait
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render user-specific subscription history (shows all subscriptions for current user)
        function renderUserSubscriptions() {
            const container = document.getElementById('userHistoryList');
            if (!container) return;
            const subscriptions = getSubscriptions().filter(s => s.userId === currentUser.id).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

            if (subscriptions.length === 0) {
                container.innerHTML = `<div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">Aucun abonnement historique.</div>`;
                return;
            }

            container.innerHTML = subscriptions.map(sub => {
                const plan = findPlanById(sub.planId);
                const endDate = new Date(sub.endDate);
                const today = new Date();
                const isExpired = endDate < today;
                const status = isExpired ? 'Expiré' : (sub.status === 'active' ? 'Actif' : sub.status);

                return `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <div class="text-sm text-gray-500">${plan ? plan.name : sub.planId} — ${sub.duration || ''}</div>
                            <div class="font-semibold">${formatDate(sub.startDate)} → ${formatDate(sub.endDate)}</div>
                            <div class="text-sm text-gray-500">Montant : ${formatCurrency(sub.amount)}</div>
                        </div>
                        <div class="text-right space-y-2">
                            <div class="text-sm font-semibold">${status}</div>
                            <div class="flex justify-end gap-2">
                                ${currentUser && currentUser.role === 'admin' ? `<button onclick="printInvoice('${sub.id}')" class="px-3 py-1 bg-blue-500 text-white rounded">Voir / Imprimer</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        window.selectPlan = function(planId) {
            const plan = findPlanById(planId);

            showConfirm(
                'Confirmer l\'abonnement',
                `Vous avez choisi le ${plan.name} pour ${formatCurrency(plan.price)}. Cliquez sur "Confirmer" pour procéder au paiement.`,
                () => {
                    (async () => {
                        try {
                            const { data: inserted, error } = await supabase
                                .from('payment_requests')
                                .insert({
                                    user_id: currentUser.id,
                                    plan_id: plan.id,
                                    plan_name: plan.name,
                        amount: plan.price,
                                    user_name: currentUser.name,
                                    user_email: currentUser.email || `${currentUser.username}@example.com`,
                                    status: 'pending'
                                })
                                .select('id')
                                .single();

                            if (error || !inserted) {
                                console.error('Erreur lors de la création de la demande de paiement Supabase', error);
                                showAlert('Erreur', 'Impossible d\'envoyer la demande. Veuillez réessayer.');
                                return;
                            }

                            await loadPaymentRequestsFromSupabase();

                    // Ajouter une notification pour l'admin (toRole: 'admin')
                            addNotification('payment', 'Nouvelle demande de paiement', `${currentUser.name} a soumis une demande pour ${plan.name}`, 'admin', inserted.id);

                    showAlert(
                        'Demande envoyée',
                        'Votre demande d\'abonnement a été envoyée. Un administrateur vérifiera votre paiement et activera votre abonnement.'
                    );

                    loadUserDashboard();
                        } catch (e) {
                            console.error('Erreur inattendue lors de la création de la demande de paiement', e);
                            showAlert('Erreur', 'Une erreur est survenue lors de l\'envoi de la demande.');
                        }
                    })();
                }
            );
        };

        // Gestion des boutons de période
        document.getElementById('weeklyBtn').addEventListener('click', () => {
            currentPeriod = 'weekly';
            document.getElementById('weeklyBtn').classList.add('bg-green-express', 'text-white');
            document.getElementById('weeklyBtn').classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
            document.getElementById('monthlyBtn').classList.remove('bg-green-express', 'text-white');
            document.getElementById('monthlyBtn').classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
            renderSubscriptionPlans();
        });

        document.getElementById('monthlyBtn').addEventListener('click', () => {
            currentPeriod = 'monthly';
            document.getElementById('monthlyBtn').classList.add('bg-green-express', 'text-white');
            document.getElementById('monthlyBtn').classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
            document.getElementById('weeklyBtn').classList.remove('bg-green-express', 'text-white');
            document.getElementById('weeklyBtn').classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
            renderSubscriptionPlans();
        });

        // ============================================
        // Dashboard Admin
        // ============================================

        function loadAdminDashboard() {
            document.getElementById('adminWelcome').textContent = `Admin: ${currentUser.name}`;

            updateAdminStats();
            renderPendingRequestsTable();
            renderPaymentRequestsHistoryTable();
            renderAllSubscriptionsTable();
            renderContactMessagesTable();
            renderPaymentHistoryTable();
            renderClientsTable();
            loadAnalyticsDashboard();
            updateNotificationBadge();
        }

        function updateAdminStats() {
            const users = getUsers();
            const subscriptions = getSubscriptions();
            const paymentRequests = getPaymentRequests();

            const totalClients = users.filter(u => u.role === 'user').length;
            const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
            const pendingRequests = paymentRequests.filter(r => r.status === 'pending').length;

            // Calculer les revenus mensuels (abonnements actifs)
            const revenue = subscriptions
                .filter(s => s.status === 'active')
                .reduce((sum, sub) => {
                    const plan = findPlanById(sub.planId);
                    return sum + (plan ? plan.price : 0);
                }, 0);

            document.getElementById('statTotalClients').textContent = totalClients;
            document.getElementById('statActiveSubscriptions').textContent = activeSubscriptions;
            document.getElementById('statPendingRequests').textContent = pendingRequests;
            document.getElementById('statRevenue').textContent = formatCurrency(revenue);
        }

        function renderPendingRequestsTable() {
            const paymentRequests = getPaymentRequests();
            const pendingRequests = paymentRequests.filter(r => r.status === 'pending');

            const container = document.getElementById('pendingRequestsTable');

            if (pendingRequests.length === 0) {
                container.innerHTML = `
                    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune demande en attente
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forfait</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${pendingRequests.map(request => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">${request.userName}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${request.userPhone}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900 dark:text-white">${request.planName}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${request.duration === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                    ${formatCurrency(request.amount)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    ${formatDate(request.createdAt)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onclick="approvePayment('${request.id}')"
                                        class="bg-green-express hover:bg-green-600 text-white px-3 py-1 rounded transition">
                                        Approuver
                                    </button>
                                    <button onclick="rejectPayment('${request.id}')"
                                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                                        Rejeter
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderAllSubscriptionsTable() {
            const subscriptions = getSubscriptions();
            const container = document.getElementById('allSubscriptionsTable');

            if (subscriptions.length === 0) {
                container.innerHTML = `
                    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun abonnement
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forfait</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Période</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${subscriptions.map(sub => {
                            const plan = findPlanById(sub.planId);
                            const endDate = new Date(sub.endDate);
                            const today = new Date();
                            const isExpired = endDate < today;
                            const status = isExpired ? 'expired' : sub.status;

                            return `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">${sub.userName}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900 dark:text-white">${plan ? plan.name : 'N/A'}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${formatCurrency(sub.amount)}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div>${formatDate(sub.startDate)}</div>
                                    <div>${formatDate(sub.endDate)}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                                        ${status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}">
                                        ${status === 'active' ? 'Actif' : 'Expiré'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onclick="printInvoice('${sub.id}')" 
                                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                                        Imprimer facture
                                    </button>
                                    <button onclick="exportInvoiceToPDF('${sub.id}')" 
                                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition">
                                        Télécharger PDF
                                    </button>
                                    <button onclick="deleteSubscription('${sub.id}')" 
                                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            `;

            // Hide the export button if not admin
            try {
                const exportBtn = document.getElementById('exportAllSubscriptionsBtn');
                if (exportBtn) exportBtn.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
            } catch (e) {}
        }

        async function loadContactMessagesFromSupabase() {
            try {
                const { data, error } = await supabase
                    .from('contact_messages')
                    .select('id, name, email, phone, message, created_at')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.warn('Erreur lors du chargement des messages de contact depuis Supabase', error);
                    return;
                }

                appData.contactMessages = (data || []).map(m => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    phone: m.phone,
                    message: m.message,
                    createdAt: m.created_at || new Date().toISOString(),
                    status: 'new'
                }));
            } catch (e) {
                console.warn('Erreur inattendue lors du chargement des messages de contact Supabase', e);
            }
        }

        function renderContactMessagesTable() {
            const messages = appData.contactMessages || [];
            const container = document.getElementById('contactMessagesTable');

            if (messages.length === 0) {
                container.innerHTML = `
                    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun message de contact
                    </div>
                `;
                return;
            }

            // Sort by newest first
            const sortedMessages = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Téléphone</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${sortedMessages.map(msg => {
                            const preview = msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message;
                            return `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">${msg.name}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900 dark:text-white">${msg.email || '-'}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900 dark:text-white">${msg.phone || '-'}</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate" title="${msg.message}">${preview}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    ${formatDate(msg.createdAt)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onclick="viewContactMessage('${msg.id}')" 
                                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                                        Voir
                                    </button>
                                    <button onclick="deleteContactMessage('${msg.id}')" 
                                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            `;

            // Hide the export button if not admin
            try {
                const exportBtn = document.getElementById('exportContactMessagesBtn');
                if (exportBtn) exportBtn.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
            } catch (e) {}
        }

        window.approvePayment = function(requestId) {
            showConfirm(
                'Approuver le paiement',
                'Êtes-vous sûr de vouloir approuver cette demande et activer l\'abonnement ?',
                () => {
                    const paymentRequests = getPaymentRequests();
                    const request = paymentRequests.find(r => r.id === requestId);

                    if (!request) return;

                    // Créer l'abonnement
                    const plan = findPlanById(request.planId);

                    const startDate = new Date();
                    const serviceDays = plan && plan.days ? plan.days : (plan.duration === 'weekly' ? 5 : 20);
                    // Calcul en jours ouvrés (lundi-vendredi), inclusif : startDate compte pour le jour 1
                    const endDate = addBusinessDays(startDate, Math.max(serviceDays - 1, 0));

                    (async () => {
                        try {
                            // 1) Vérifier dans Supabase que la demande est toujours en attente
                            const { data: freshReq, error: reqError } = await supabase
                                .from('payment_requests')
                                .select('id, status')
                                .eq('id', requestId)
                                .single();

                            if (reqError || !freshReq) {
                                console.error('Erreur lors de la vérification de la demande de paiement Supabase', reqError);
                                showAlert('Erreur', 'Impossible de vérifier la demande de paiement. Veuillez réessayer.');
                                return;
                            }

                            if (freshReq.status !== 'pending') {
                                showAlert('Information', 'Cette demande de paiement a déjà été traitée. Rafraîchissez le tableau de bord si nécessaire.');
                                await loadPaymentRequestsFromSupabase();
                                loadAdminDashboard();
                                return;
                            }

                            // 2) Créer l'abonnement dans Supabase
                            const { data: inserted, error: subError } = await supabase
                                .from('subscriptions')
                                .insert({
                                    user_id: request.userId,
                                    plan_id: request.planId,
                                    plan_name: plan.name || request.planName || request.planId,
                                    amount: plan.price || request.amount,
                                    start_date: startDate.toISOString(),
                                    end_date: endDate.toISOString(),
                                    status: 'active'
                                })
                                .select('id, user_id, plan_id, plan_name, amount, start_date, end_date, status, created_at')
                                .single();

                            if (subError || !inserted) {
                                console.error('Erreur lors de la création de l’abonnement Supabase', subError);
                                showAlert('Erreur', 'Impossible de créer l\'abonnement. Veuillez réessayer.');
                                return;
                            }

                            // 3) Mettre à jour le statut de la demande dans Supabase pour éviter toute double validation
                            const { error: updateReqError } = await supabase
                                .from('payment_requests')
                                .update({ status: 'approved' })
                                .eq('id', requestId);

                            if (updateReqError) {
                                console.error('Erreur lors de la mise à jour de la demande de paiement Supabase', updateReqError);
                                // On continue malgré tout, mais on recharge les demandes pour éviter un affichage incohérent
                            }

                            // 4) Recharger les abonnements depuis Supabase et persister dans localStorage
                            await loadSubscriptionsFromSupabase();
                            saveSubscriptions(getSubscriptions());

                            // 5) Ajouter à l'historique des paiements
                            await addPaymentHistory(inserted.id, request.userId, request.amount, 'completed');

                            // 6) Recharger les demandes de paiement depuis Supabase (statut mis à jour)
                            await loadPaymentRequestsFromSupabase();

                            // 7) Ajouter une notification au client (toRole: 'user') avec ciblage du user
                            addNotification('subscription', 'Abonnement activé', `Abonnement ${plan.name} approuvé pour ${request.userName}`, 'user', inserted.id, request.userId);

                            showAlert('Succès', 'L\'abonnement a été activé avec succès !');
                            loadAdminDashboard();

                            // Si l'action est réalisée par un admin, proposer l'impression de la facture
                            if (currentUser && currentUser.role === 'admin') {
                                setTimeout(() => printInvoice(inserted.id), 400);
                            }
                        } catch (e) {
                            console.error('Erreur inattendue lors de l’activation d’un abonnement', e);
                            showAlert('Erreur', 'Une erreur est survenue lors de l’activation de l’abonnement.');
                        }
                    })();
                }
            );
        };

        // Imprimer une facture d'abonnement (admin uniquement)
        // helper: detect available logo file in ./assets (png, jpg, jpeg, svg)
        async function findLogoUrl() {
            // On met en premier le fichier réellement présent dans le projet (logo.jpg)
            const candidates = ['./assets/logo.jpg','./assets/logo.png','./assets/logo.jpeg','./assets/logo.svg'];
            for (const url of candidates) {
                // eslint-disable-next-line no-await-in-loop
                const ok = await new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url + '?_=' + Date.now();
                });
                if (ok) return url;
            }
            return '';
        }

        window.printInvoice = async function(subscriptionId) {
            // Only admins can print or download invoices
            if (!currentUser || currentUser.role !== 'admin') {
                showAlert('Accès refusé', 'L\'impression et le téléchargement des factures sont réservés aux administrateurs.');
                return;
            }
            const subscriptions = getSubscriptions();
            const sub = subscriptions.find(s => s.id === subscriptionId);
            if (!sub) {
                showAlert('Erreur', 'Abonnement introuvable');
                return;
            }

            const plan = findPlanById(sub.planId);
            const detectedLogo = await findLogoUrl();

            const invoiceHtml = `
                <html>
                <head>
                    <title>Facture - ${sub.userName}</title>
                    <style>
                        @page { size: A4; margin: 8mm }
                        html,body{height:100%;}
                        body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:8mm;color:#111;font-size:12px;background:#fff}
                        .sheet{max-width:800px;margin:0 auto}
                        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
                        .brand{display:flex;gap:12px;align-items:center}
                        .brand img{width:88px;height:auto;border-radius:6px}
                        .brand .title{font-weight:800;color:#0b6b2d;font-size:18px}
                        .meta{font-size:11px;text-align:right;color:#444}
                        .box{border:1px solid #e6f0ea;padding:10px;margin-top:8px;background:#fbfffb}
                        table{width:100%;border-collapse:collapse;margin-top:6px}
                        td,th{padding:8px;border:1px solid #eef6ef;text-align:left;font-size:13px}
                        th{background:#f0fbf3;color:#0b6b2d}
                        .footer{margin-top:12px;font-size:11px;color:#666}
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div class="brand">
                                ${detectedLogo ? `<img src="${detectedLogo}" alt="Green Express logo">` : `<div style="width:88px;height:56px;background:#e6f4ea;border-radius:6px;display:inline-block"></div>`}
                                <div>
                                    <div class="title">Green Express</div>
                                    <div style="font-size:12px;color:#666">Rapide, sain et délicieux</div>
                                    <div style="font-size:12px;color:#444">WhatsApp: 097 254 5000</div>
                                </div>
                            </div>
                            <div class="meta">
                                <div><strong>Facture:</strong> ${sub.id}</div>
                                <div><strong>Date:</strong> ${formatDate(sub.createdAt)}</div>
                            </div>
                        </div>

                        <div>
                            <div style="margin-bottom:8px;font-size:13px;color:#333">
                                <strong>Green Express</strong><br>
                                Adresse: Kolwezi, République Démocratique du Congo<br>
                                Email: gexpress833@gmail.com • WhatsApp: 097 254 5000
                            </div>
                        </div>

                        <div class="box">
                            <table>
                                <tr>
                                    <th style="width:30%">Client</th>
                                    <td>${sub.userName}</td>
                                </tr>
                                <tr>
                                    <th>Forfait</th>
                                    <td>${plan ? plan.name : sub.planId}</td>
                                </tr>
                                <tr>
                                    <th>Période</th>
                                    <td>${formatDate(sub.startDate)} → ${formatDate(sub.endDate)}</td>
                                </tr>
                                <tr>
                                    <th>Montant</th>
                                    <td style="font-weight:700;color:#0b6b2d">${formatCurrency(sub.amount)}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="footer">Green Express — Livraison du lundi au vendredi. Merci pour votre confiance.</div>
                    </div>
                </body>
                </html>
            `;

            // Ouvrir dans une nouvelle fenêtre pour imprimer (contrôle admin côté client)
            const w = window.open('', '_blank');
            if (!w) {
                showAlert('Erreur', 'Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez votre bloqueur de fenêtres.' );
                return;
            }
            w.document.write(invoiceHtml);
            w.document.close();
            w.focus();
            // attendre le rendu puis imprimer
            setTimeout(()=>{ w.print(); /* w.close(); */ }, 500);
        };

        // ================= Excel Export Helpers ====================
        function exportUserHistoryToExcel() {
            if (!currentUser) { showAlert('Erreur','Connectez-vous pour exporter votre historique.'); return; }
            const subs = getSubscriptions().filter(s => s.userId === currentUser.id);
            if (!subs.length) { showAlert('Aucun abonnement','Vous n\'avez aucun abonnement à exporter.'); return; }

            const data = subs.map(s => {
                const plan = findPlanById(s.planId);
                return {
                    'ID': s.id,
                    'Client': s.userName,
                    'Forfait': plan ? plan.name : s.planId,
                    'Montant': s.amount,
                    'Date début': formatDate(s.startDate),
                    'Date fin': formatDate(s.endDate),
                    'Statut': s.status,
                    'Date création': formatDate(s.createdAt)
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Historique');
            const filename = `historique_abonnements_${currentUser.username || currentUser.id}_${new Date().toISOString().slice(0,10)}.xlsx`;
            XLSX.writeFile(wb, filename);
        }

        // Generate and download invoice PDF (admin only) using jsPDF + autotable
        window.exportInvoiceToPDF = async function(subscriptionId) {
            if (!currentUser || currentUser.role !== 'admin') {
                showAlert('Accès refusé', 'Seul l\'administrateur peut télécharger les factures.');
                return;
            }
            if (typeof jsPDF === 'undefined' || typeof doc !== 'function') {
                // doc is not a reliable test for autoTable; but we'll check jsPDF first
            }

            const subs = getSubscriptions();
            const sub = subs.find(s => s.id === subscriptionId);
            if (!sub) { showAlert('Erreur','Abonnement introuvable'); return; }

            const plan = findPlanById(sub.planId) || { name: sub.planId };

            // Prepare doc
            try {
                const { jsPDF } = window;
                if (!jsPDF) { showAlert('Erreur','Librairie jsPDF non trouvée.'); return; }

                const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                const margin = 40;
                let y = 40;

                // Try to load a logo from common filenames in ./assets
                const logoCandidates = ['./assets/logo.png','./assets/logo.jpg','./assets/logo.jpeg','./assets/logo.svg'];
                let addedLogo = false;

                for (const url of logoCandidates) {
                    try {
                        // Attempt to draw image onto a canvas to get dataURL (may fail on cross-origin)
                        await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = function() {
                                try {
                                    const canvas = document.createElement('canvas');
                                    const maxW = 120;
                                    const scale = Math.min(1, maxW / img.width);
                                    canvas.width = img.width * scale;
                                    canvas.height = img.height * scale;
                                    const ctx = canvas.getContext('2d');
                                    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    const dataUrl = canvas.toDataURL('image/png');
                                    doc.addImage(dataUrl, 'PNG', margin, y, canvas.width, canvas.height);
                                    y += canvas.height + 10;
                                    addedLogo = true;
                                    resolve();
                                } catch (e) {
                                    // continue without logo
                                    resolve();
                                }
                            };
                            img.onerror = function() { resolve(); };
                            img.src = url + '?_=' + Date.now();
                        });
                        if (addedLogo) break;
                    } catch (e) {
                        // ignore and continue
                    }
                }

                // Company block
                doc.setFontSize(14);
                doc.setTextColor('#0B6B2D');
                doc.text('Green Express', margin, y + 16);
                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.text('Rapide, sain et délicieux', margin, y + 34);
                doc.text('WhatsApp: 097 254 5000', margin, y + 50);

                // Invoice meta on right
                doc.setFontSize(10);
                const rightX = doc.internal.pageSize.getWidth() - margin;
                doc.text(`Facture: ${sub.id}`, rightX - 0, y + 16, { align: 'right' });
                doc.text(`Date: ${formatDate(sub.createdAt)}`, rightX - 0, y + 34, { align: 'right' });

                y += 70;

                // Client & details
                doc.setFontSize(11);
                doc.text('Client:', margin, y);
                doc.setFont('helvetica', 'normal');
                doc.text(sub.userName || '-', margin + 60, y);

                doc.text('Forfait:', margin, y + 18);
                doc.text(plan.name || '-', margin + 60, y + 18);

                doc.text('Période:', margin, y + 36);
                doc.text(`${formatDate(sub.startDate)} → ${formatDate(sub.endDate)}`, margin + 60, y + 36);

                y += 60;

                // Table of items using autotable if available
                if (typeof doc.autoTable === 'function') {
                    doc.autoTable({
                        startY: y,
                        head: [['Description', 'Quantité', 'Prix']],
                        body: [[plan.name || 'Abonnement', '1', formatCurrency(sub.amount)]],
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: [11,107,45], textColor: 255 }
                    });
                    y = doc.lastAutoTable.finalY + 10;
                } else {
                    // simple fallback table
                    doc.setFontSize(10);
                    doc.text('Description', margin, y);
                    doc.text('Quantité', margin + 300, y);
                    doc.text('Prix', rightX - 60, y, { align: 'right' });
                    y += 18;
                    doc.text(plan.name || 'Abonnement', margin, y);
                    doc.text('1', margin + 300, y);
                    doc.text(formatCurrency(sub.amount), rightX - 60, y, { align: 'right' });
                    y += 26;
                }

                // Total
                doc.setFontSize(12);
                doc.setTextColor('#0B6B2D');
                doc.text(`Total: ${formatCurrency(sub.amount)}`, rightX - 0, y + 20, { align: 'right' });

                // Footer
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text('Green Express — Livraison du lundi au vendredi. Merci pour votre confiance.', margin, doc.internal.pageSize.getHeight() - 40);

                // Save PDF
                doc.save(`facture_${sub.id}.pdf`);
            } catch (e) {
                console.error('PDF generation failed', e);
                showAlert('Erreur', 'La génération du PDF a échoué.');
            }
        }

        function exportAllSubscriptionsToExcel() {
            if (!currentUser || currentUser.role !== 'admin') { showAlert('Accès refusé','Seul l\'administrateur peut exporter toutes les données.'); return; }
            const subs = getSubscriptions();
            if (!subs.length) { showAlert('Aucune donnée','Aucun abonnement à exporter.'); return; }

            const data = subs.map(s => ({
                'ID': s.id,
                'Client': s.userName,
                'Téléphone': s.userPhone || '',
                'Forfait': findPlanById(s.planId)?.name || s.planId,
                'Montant': s.amount,
                'Date début': formatDate(s.startDate),
                'Date fin': formatDate(s.endDate),
                'Statut': s.status,
                'Date création': formatDate(s.createdAt)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Abonnements');
            const filename = `all_subscriptions_${new Date().toISOString().slice(0,10)}.xlsx`;
            XLSX.writeFile(wb, filename);
        }

        window.rejectPayment = function(requestId) {
            showConfirm(
                'Rejeter le paiement',
                'Êtes-vous sûr de vouloir rejeter cette demande ?',
                () => {
                    (async () => {
                        try {
                    const paymentRequests = getPaymentRequests();
                    const request = paymentRequests.find(r => r.id === requestId);

                            const { error } = await supabase
                                .from('payment_requests')
                                .update({ status: 'rejected' })
                                .eq('id', requestId);

                            if (error) {
                                console.error('Erreur lors du rejet de la demande de paiement Supabase', error);
                                showAlert('Erreur', 'Impossible de rejeter la demande. Veuillez réessayer.');
                                return;
                            }

                            await loadPaymentRequestsFromSupabase();

                            if (request) {
                                addNotification('rejection', 'Demande de paiement rejetée', `Votre demande de paiement pour ${request.planName} a été rejetée.`, 'user', requestId, request.userId);
                            }

                    showAlert('Demande rejetée', 'La demande de paiement a été rejetée.');
                    loadAdminDashboard();
                        } catch (e) {
                            console.error('Erreur inattendue lors du rejet de la demande de paiement', e);
                            showAlert('Erreur', 'Une erreur est survenue lors du rejet de la demande.');
                        }
                    })();
                }
            );
        };

        window.deleteSubscription = function(subscriptionId) {
            showConfirm(
                'Supprimer l\'abonnement',
                'Êtes-vous sûr de vouloir supprimer cet abonnement ? Cette action est irréversible.',
                () => {
                    (async () => {
                        try {
                            const { error } = await supabase
                                .from('subscriptions')
                                .delete()
                                .eq('id', subscriptionId);

                            if (error) {
                                console.error('Erreur lors de la suppression de l’abonnement Supabase', error);
                                showAlert('Erreur', 'Impossible de supprimer l\'abonnement. Veuillez réessayer.');
                                return;
                            }

                            await loadSubscriptionsFromSupabase();

                    showAlert('Supprimé', 'L\'abonnement a été supprimé avec succès.');
                    loadAdminDashboard();
                        } catch (e) {
                            console.error('Erreur inattendue lors de la suppression de l’abonnement', e);
                            showAlert('Erreur', 'Une erreur est survenue lors de la suppression de l\'abonnement.');
                        }
                    })();
                }
            );
        };

        // ============================================
        // Gestion des Messages de Contact
        // ============================================

        window.viewContactMessage = function(messageId) {
            const messages = appData.contactMessages || [];
            const msg = messages.find(m => m.id === messageId);
            
            if (!msg) {
                showAlert('Erreur', 'Message non trouvé');
                return;
            }

            const dateStr = formatDate(msg.createdAt);
            showAlert(
                `Message de ${msg.name}`,
                `Email: ${msg.email || '-'}\nTéléphone: ${msg.phone || '-'}\nDate: ${dateStr}\n\nMessage:\n${msg.message}`
            );
        };

        window.deleteContactMessage = function(messageId) {
            showConfirm(
                'Supprimer le message',
                'Êtes-vous sûr de vouloir supprimer ce message de contact ?',
                () => {
                    (async () => {
                        try {
                            const { error } = await supabase
                                .from('contact_messages')
                                .delete()
                                .eq('id', messageId);

                            if (error) {
                                console.error('Erreur lors de la suppression du message de contact Supabase', error);
                                showAlert('Erreur', 'Impossible de supprimer le message. Veuillez réessayer.');
                                return;
                            }

                            // Recharger les messages depuis Supabase
                            await loadContactMessagesFromSupabase();

                    showAlert('Supprimé', 'Le message a été supprimé avec succès.');
                    renderContactMessagesTable();
                        } catch (e) {
                            console.error('Erreur inattendue lors de la suppression du message de contact', e);
                            showAlert('Erreur', 'Une erreur est survenue lors de la suppression du message.');
                        }
                    })();
                }
            );
        };

        window.exportContactMessagesToExcel = function() {
            const messages = appData.contactMessages || [];
            
            if (messages.length === 0) {
                showAlert('Attention', 'Aucun message à exporter');
                return;
            }

            const ws_data = [
                ['Nom', 'Email', 'Téléphone', 'Message', 'Date']
            ];

            messages.forEach(msg => {
                ws_data.push([
                    msg.name,
                    msg.email || '',
                    msg.phone || '',
                    msg.message,
                    formatDate(msg.createdAt)
                ]);
            });

            try {
                const ws = XLSX.utils.aoa_to_sheet(ws_data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Messages');
                XLSX.writeFile(wb, `messages_contact_${new Date().getTime()}.xlsx`);
            } catch (err) {
                console.error('Export failed:', err);
                showAlert('Erreur', 'Impossible d\'exporter les messages');
            }
        };

        // ============================================
        // Payment Requests History, Payment History & Notifications UI
        // ============================================
        function renderPaymentRequestsHistoryTable() {
            const requests = getPaymentRequests();
            const container = document.getElementById('paymentRequestsHistoryTable');

            if (!container) return;

            if (!requests.length) {
                container.innerHTML = `<div class="p-8 text-center text-gray-500 dark:text-gray-400">Aucune demande de paiement</div>`;
                return;
            }

            const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forfait</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${sorted.map(req => {
                            let statusLabel = req.status || '';
                            let statusClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';

                            if (req.status === 'pending') {
                                statusLabel = 'En attente';
                                statusClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            } else if (req.status === 'approved') {
                                statusLabel = 'Approuvée';
                                statusClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                            } else if (req.status === 'rejected') {
                                statusLabel = 'Rejetée';
                                statusClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                            }

                            return `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">${req.userName || ''}</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">${req.userPhone || ''}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900 dark:text-white">${req.planName || req.planId || ''}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                        ${formatCurrency(req.amount)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}">
                                            ${statusLabel || 'Inconnu'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        ${formatDate(req.createdAt)}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderPaymentHistoryTable() {
            const history = getPaymentHistory();
            const container = document.getElementById('paymentHistoryTable');

            if (history.length === 0) {
                container.innerHTML = `<div class="p-8 text-center text-gray-500 dark:text-gray-400">Aucun historique de paiement</div>`;
                return;
            }

            const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Numéro de Facture</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${sortedHistory.map(pay => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${pay.invoiceNumber}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">${formatCurrency(pay.amount)}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${pay.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}">
                                        ${pay.status === 'completed' ? 'Complété' : 'En attente'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatDate(pay.createdAt)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onclick="downloadInvoicePDF('${pay.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">Télécharger PDF</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        window.exportPaymentHistoryToExcel = function() {
            const history = getPaymentHistory();
            if (history.length === 0) {
                showAlert('Attention', 'Aucun paiement à exporter');
                return;
            }

            const ws_data = [['Numéro Facture', 'Montant (FC)', 'Statut', 'Date']];
            history.forEach(pay => {
                ws_data.push([pay.invoiceNumber, pay.amount, pay.status, formatDate(pay.createdAt)]);
            });

            try {
                const ws = XLSX.utils.aoa_to_sheet(ws_data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Paiements');
                XLSX.writeFile(wb, `historique_paiements_${new Date().getTime()}.xlsx`);
            } catch (err) {
                console.error('Export failed:', err);
                showAlert('Erreur', 'Impossible d\'exporter l\'historique');
            }
        };

        window.exportPaymentRequestsHistoryToExcel = function() {
            const requests = getPaymentRequests();
            if (!requests.length) {
                showAlert('Attention', 'Aucune demande de paiement à exporter');
                return;
            }

            const ws_data = [['Client', 'Téléphone', 'Forfait', 'Montant (FC)', 'Statut', 'Date']];
            requests.forEach(req => {
                ws_data.push([
                    req.userName || '',
                    req.userPhone || '',
                    req.planName || req.planId || '',
                    req.amount,
                    req.status || '',
                    formatDate(req.createdAt)
                ]);
            });

            try {
                const ws = XLSX.utils.aoa_to_sheet(ws_data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Demandes');
                XLSX.writeFile(wb, `historique_demandes_paiement_${new Date().getTime()}.xlsx`);
            } catch (err) {
                console.error('Export failed:', err);
                showAlert('Erreur', 'Impossible d\'exporter l\'historique des demandes');
            }
        };

        function toggleNotificationCenter() {
            const modal = document.getElementById('notificationCenter');
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                renderNotificationList();
            } else {
                // When closing, update badge in case notifications were marked as read
                updateNotificationBadge();
            }
        }

        function renderNotificationList() {
            const container = document.getElementById('notificationList');
            if (!currentUser) return;

            let userNotifs;
            if (currentUser.role === 'admin') {
                // Admin : voit toutes les notifications
                userNotifs = appData.notifications || [];
            } else {
                // Client : uniquement ses notifications
                userNotifs = (appData.notifications || []).filter(n => {
                    if (n.toRole !== 'user') return false;
                    if (n.targetUserId && n.targetUserId !== currentUser.id) return false;
                    return true;
                });
            }

            if (userNotifs.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 py-4">Aucune notification</div>';
                return;
            }

            const sorted = [...userNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            container.innerHTML = sorted.map(n => `
                <div class="p-3 rounded-lg ${n.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'} cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition" onclick="markNotificationRead('${n.id}')">
                    <div class="font-semibold text-sm text-gray-900 dark:text-white">${n.title}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">${n.message}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-500 mt-2">${formatDate(n.createdAt)}</div>
                </div>
            `).join('');
        }

        window.downloadInvoicePDF = function(paymentId) {
            const pay = getPaymentHistory().find(p => p.id === paymentId);
            if (!pay) {
                showAlert('Erreur', 'Paiement non trouvé');
                return;
            }

            const sub = getSubscriptions().find(s => s.id === pay.subscriptionId);
            const user = getUsers().find(u => u.id === pay.userId);
            const plan = findPlanById(sub ? sub.planId : null);

            const invoiceHtml = `
                <html><head><meta charset="UTF-8"><style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #1f7a3a; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #1f7a3a; }
                    .invoice-title { text-align: right; font-size: 14px; color: #666; }
                    .invoice-number { text-align: right; font-size: 20px; font-weight: bold; color: #1f7a3a; }
                    .section { margin-bottom: 25px; }
                    .section-title { font-weight: bold; color: #1f7a3a; margin-bottom: 10px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #1f7a3a; font-weight: bold; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .total { text-align: right; font-size: 18px; font-weight: bold; color: #1f7a3a; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
                </style></head><body>
                    <div class="invoice">
                        <div class="header">
                            <div class="logo">Green Express</div>
                            <div>
                                <div class="invoice-title">FACTURE</div>
                                <div class="invoice-number">${pay.invoiceNumber}</div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">CLIENT</div>
                            <div>${user ? user.name : 'Client'}</div>
                            <div>${user && user.phone ? user.phone : 'N/A'}</div>
                            <div>${user && user.address ? user.address : 'Kolwezi, RDC'}</div>
                        </div>
                        <div class="section">
                            <div class="section-title">DÉTAILS DE LA FACTURE</div>
                            <table>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: right;">Montant</th>
                                </tr>
                                <tr>
                                    <td>${plan ? plan.name : 'Abonnement'}</td>
                                    <td style="text-align: right;">${formatCurrency(pay.amount)}</td>
                                </tr>
                            </table>
                            <div class="total">TOTAL: ${formatCurrency(pay.amount)}</div>
                        </div>
                        <div class="footer">
                            Merci pour votre confiance. Green Express - Livraison du lundi au vendredi
                        </div>
                    </div>
                </body></html>
            `;

            const w = window.open('', '_blank');
            if (w) {
                w.document.write(invoiceHtml);
                w.document.close();
                setTimeout(() => w.print(), 500);
            }
        };

        // ============================================
        // Client Profile Management
        // ============================================
        function renderClientsTable() {
            const users = getUsers().filter(u => u.role === 'user');
            const container = document.getElementById('clientsTable');

            if (users.length === 0) {
                container.innerHTML = '<div class="p-8 text-center text-gray-500 dark:text-gray-400">Aucun client</div>';
                return;
            }

            container.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nom</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Téléphone</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Adresse</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Allergies</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tags</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${users.map(user => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${user.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${user.phone || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${user.address || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">${user.preferences?.allergies || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    ${(user.preferences?.tags || []).map(tag => `<span class="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs mr-1">${tag}</span>`).join('')}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onclick="editClientProfile('${user.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">Éditer</button>
                                    <button onclick="viewClientHistory('${user.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition">Historique</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        window.editClientProfile = function(userId) {
            const user = getUsers().find(u => u.id === userId);
            if (!user) return;

            const allergies = (user.preferences?.allergies || '').trim();
            const dietary = (user.preferences?.dietary || '').trim();
            const tags = (user.preferences?.tags || []).join(', ');

            const newAllergies = prompt('Allergies (séparées par des virgules):', allergies);
            if (newAllergies === null) return;

            const newDietary = prompt('Régime alimentaire:', dietary);
            if (newDietary === null) return;

            const newTags = prompt('Tags (VIP, nouveau, inactif - séparés par virgules):', tags);
            if (newTags === null) return;

            user.preferences = {
                allergies: newAllergies,
                dietary: newDietary,
                tags: newTags.split(',').map(t => t.trim()).filter(t => t)
            };

            saveUsers(getUsers());
            showAlert('Succès', 'Profil client mis à jour');
            renderClientsTable();
        };

        window.viewClientHistory = function(userId) {
            const user = getUsers().find(u => u.id === userId);
            const subs = getSubscriptions().filter(s => s.userId === userId);

            let history = `Client: ${user?.name}\n\nHistorique d'abonnements:\n\n`;
            if (subs.length === 0) {
                history += 'Aucun abonnement';
            } else {
                subs.forEach(sub => {
                    const plan = findPlanById(sub.planId);
                    history += `- ${plan?.name} (${formatCurrency(sub.amount)}): ${formatDate(sub.startDate)} → ${formatDate(sub.endDate)} [${sub.status}]\n`;
                });
            }

            showAlert('Historique Client', history);
        };

        window.exportClientsToExcel = function() {
            const users = getUsers().filter(u => u.role === 'user');
            if (users.length === 0) {
                showAlert('Attention', 'Aucun client à exporter');
                return;
            }

            const ws_data = [['Nom', 'Téléphone', 'Adresse', 'Allergies', 'Régime', 'Tags', 'Date d\'inscription']];
            users.forEach(u => {
                ws_data.push([
                    u.name,
                    u.phone || '',
                    u.address || '',
                    u.preferences?.allergies || '',
                    u.preferences?.dietary || '',
                    (u.preferences?.tags || []).join('; '),
                    formatDate(u.createdAt)
                ]);
            });

            try {
                const ws = XLSX.utils.aoa_to_sheet(ws_data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Clients');
                XLSX.writeFile(wb, `liste_clients_${new Date().getTime()}.xlsx`);
            } catch (err) {
                console.error('Export failed:', err);
                showAlert('Erreur', 'Impossible d\'exporter la liste des clients');
            }
        };

        // ============================================
        // Analytics Dashboard
        // ============================================
        function loadAnalyticsDashboard() {
            renderRevenueChart();
            renderClientGrowthChart();
            renderPlanDistributionChart();
            renderAnalyticsMetrics();
        }

        function renderRevenueChart() {
            const canvas = document.getElementById('revenueChart');
            if (!canvas) return;

            // destroy previous instance if exists to avoid "Canvas is already in use" errors
            try {
                if (window.revenueChartInstance) {
                    window.revenueChartInstance.destroy();
                    window.revenueChartInstance = null;
                }
            } catch (e) { console.warn('Error destroying previous revenue chart', e); }

            const subscriptions = getSubscriptions().filter(s => s.status === 'active');
            const last7Days = [];
            const revenues = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                last7Days.push(dateStr);

                const dayRevenue = subscriptions
                    .filter(s => new Date(s.createdAt).toDateString() === date.toDateString())
                    .reduce((sum, s) => {
                        const plan = findPlanById(s.planId);
                        return sum + (plan ? plan.price : 0);
                    }, 0);
                revenues.push(dayRevenue);
            }

            window.revenueChartInstance = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Revenus (FC)',
                        data: revenues,
                        borderColor: '#1f7a3a',
                        backgroundColor: 'rgba(31, 122, 58, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } }
                }
            });
        }

        function renderClientGrowthChart() {
            const canvas = document.getElementById('clientGrowthChart');
            if (!canvas) return;

            // destroy previous instance if exists
            try {
                if (window.clientGrowthChartInstance) {
                    window.clientGrowthChartInstance.destroy();
                    window.clientGrowthChartInstance = null;
                }
            } catch (e) { console.warn('Error destroying previous client growth chart', e); }

            const users = getUsers().filter(u => u.role === 'user');
            const last7Days = [];
            const counts = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                last7Days.push(dateStr);

                const count = users.filter(u => new Date(u.createdAt) <= date).length;
                counts.push(count);
            }

            window.clientGrowthChartInstance = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Nombre de Clients',
                        data: counts,
                        backgroundColor: '#3fb57a'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } }
                }
            });
        }

        function renderPlanDistributionChart() {
            const canvas = document.getElementById('planDistributionChart');
            if (!canvas) return;
            const subscriptions = getSubscriptions();
            // subscriptionPlans is an object (weekly/monthly). Combine into a single array for analytics.
            const plans = [ ...(subscriptionPlans.weekly || []), ...(subscriptionPlans.monthly || []) ];
            const planCounts = {};

            plans.forEach(p => planCounts[p.id] = 0);
            subscriptions.forEach(s => {
                if (planCounts.hasOwnProperty(s.planId)) planCounts[s.planId]++;
            });

            // destroy previous instance if exists
            try {
                if (window.planDistributionChartInstance) {
                    window.planDistributionChartInstance.destroy();
                    window.planDistributionChartInstance = null;
                }
            } catch (e) { console.warn('Error destroying previous plan distribution chart', e); }

            window.planDistributionChartInstance = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: plans.map(p => p.name),
                    datasets: [{
                        data: plans.map(p => planCounts[p.id] || 0),
                        backgroundColor: ['#1f7a3a', '#3fb57a', '#a8d5ba']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } }
                }
            });
        }

        function renderAnalyticsMetrics() {
            const container = document.getElementById('analyticsMetrics');
            const users = getUsers().filter(u => u.role === 'user');
            const subscriptions = getSubscriptions();
            const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

            const renewalRate = users.length > 0 ? ((activeSubscriptions.length / users.length) * 100).toFixed(1) : '0';
            const avgSubscriptionsPerClient = users.length > 0 ? (subscriptions.length / users.length).toFixed(2) : '0';
            // subscriptionPlans is an object (weekly/monthly) — use combined array for metrics
            const allPlans = [ ...(subscriptionPlans.weekly || []), ...(subscriptionPlans.monthly || []) ];
            const mostPopularPlan = allPlans.reduce((max, plan) => {
                const count = subscriptions.filter(s => s.planId === plan.id).length;
                const maxCount = max ? subscriptions.filter(s => s.planId === max.id).length : 0;
                return (count > maxCount) ? plan : max;
            }, allPlans[0] || { name: '—' });

            container.innerHTML = `
                <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span class="font-medium">Taux de Renouvellement:</span>
                    <span class="text-xl font-bold text-blue-600 dark:text-blue-300">${renewalRate}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span class="font-medium">Abonnements Actifs:</span>
                    <span class="text-xl font-bold text-green-600 dark:text-green-300">${activeSubscriptions.length}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span class="font-medium">Plan Populaire:</span>
                    <span class="text-xl font-bold text-purple-600 dark:text-purple-300">${mostPopularPlan.name}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span class="font-medium">Moy. Abos/Client:</span>
                    <span class="text-xl font-bold text-yellow-600 dark:text-yellow-300">${avgSubscriptionsPerClient}</span>
                </div>
            `;
        }

        // DEBUG helper removed in production - debugShowAppData was previously used for quick checks

        // ============================================
        // Initialisation
        // ============================================

        // Liste des images du carrousel (fallback local)
        const fallbackCarouselImages = [
            'images/banane_cuit.jpg',
            'images/banane_découpé.jpg',
            'images/boulettes.jpg',
            'images/Brochettes de Bœuf.jpg',
            'images/Chikwangue.jpg',
            'images/Chikwangue_aché.jpg',
            'images/chou pommer.jpg',
            'images/choue de chine.jpg',
            'images/Cuisse de Poulet.jpeg',
            'images/foufou.jpg',
            'images/foufou_recettes.jpg',
            'images/Foutou_et_Allocos.webp',
            'images/frites_cuisse_poulet.jpeg',
            'images/fufu avec legume.jpg',
            'images/fufu.jpeg',
            'images/hamburger classique.jpeg',
            'images/Haricots.jpg',
            'images/Lenga Lenga.jpg',
            'images/poisson_salé.jpg',
            'images/pondu.jpg',
            'images/poulet-roti-frites.jpeg',
            'images/Riz Sauté.jpeg',
            'images/sac de farine.jpeg',
            'images/Salade César.jpg',
            'images/Sandwich Végétarien.jpeg',
            'images/Shawarma.jpeg',
            'images/Tshikanda.jpeg'
        ];

        // Images utilisées par la landing / offres (mutables pour passer en Supabase si dispo)
        let carouselImages = [...fallbackCarouselImages];

        // Répartition fallback des offres (classique / pro / premium)
        const imagesPerPlanFallback = Math.floor(fallbackCarouselImages.length / 3);
        const fallbackOfferImages = {
            classique: fallbackCarouselImages.slice(0, imagesPerPlanFallback),
            pro: fallbackCarouselImages.slice(imagesPerPlanFallback, imagesPerPlanFallback * 2),
            premium: fallbackCarouselImages.slice(imagesPerPlanFallback * 2)
        };
        let offerImages = { ...fallbackOfferImages };

        // Fonction pour charger les slides du carrousel
        function loadCarouselSlides() {
            const wrapper = document.getElementById('heroCarouselWrapper');
            if (!wrapper) return;

            wrapper.innerHTML = '';
            carouselImages.forEach((imagePath, index) => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                const imageName = imagePath.split('/').pop().replace(/\.(jpg|jpeg|webp)$/i, '');
                slide.innerHTML = `<img class="w-full h-full object-cover" src="${imagePath}" alt="${imageName}"/>`;
                wrapper.appendChild(slide);
            });
        }

        // Fonction pour initialiser les carrousels des offres avec Swiper
        function initializeOfferCarousels() {
            const carousels = [
                { wrapperId: 'wrapper-classique', images: offerImages.classique || [], name: 'Classique' },
                { wrapperId: 'wrapper-pro', images: offerImages.pro || [], name: 'Professionnel' },
                { wrapperId: 'wrapper-premium', images: offerImages.premium || [], name: 'Premium' }
            ];

            carousels.forEach(carousel => {
                const wrapper = document.getElementById(carousel.wrapperId);
                if (!wrapper) return;

                // Charger les images dans le wrapper
                wrapper.innerHTML = '';
                carousel.images.forEach(imagePath => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    const imageName = imagePath.split('/').pop().replace(/\.(jpg|jpeg|webp)$/i, '');
                    slide.innerHTML = `<img class="w-full h-full object-cover" src="${imagePath}" alt="${imageName}"/>`;
                    wrapper.appendChild(slide);
                });
            });
        }

        // Charger les images depuis Supabase Storage avec fallback local
        async function loadImagesFromSupabase() {
            // Landing
            try {
                const landingList = await fetchFolderImages('landing');
                if (Array.isArray(landingList) && landingList.length) {
                    const urls = landingList.map(getPublicImageUrl).filter(Boolean);
                    if (urls.length) {
                        carouselImages = urls;
                    }
                }
            } catch (e) {
                console.warn('Erreur lors du chargement des images de landing depuis Supabase', e);
            }

            // Offres
            const folders = {
                classique: 'offers/classique',
                pro: 'offers/pro',
                premium: 'offers/premium'
            };

            for (const key of Object.keys(folders)) {
                try {
                    const list = await fetchFolderImages(folders[key]);
                    if (Array.isArray(list) && list.length) {
                        const urls = list.map(getPublicImageUrl).filter(Boolean);
                        if (urls.length) {
                            offerImages[key] = urls;
                        }
                    }
                } catch (e) {
                    console.warn(`Erreur lors du chargement des images d'offre ${key} depuis Supabase`, e);
                }
            }
        }

        function initSwipers() {
            try {
                if (typeof Swiper === 'undefined') return;

                // Carrousel principal
                new Swiper('.mySwiper', {
                    loop: true,
                    autoplay: { delay: 3000, disableOnInteraction: false }
                });

                // Carrousels offres
                new Swiper('.swiperClassique', {
                    loop: true,
                    autoplay: { delay: 5000, disableOnInteraction: false }
                });

                new Swiper('.swiperPro', {
                    loop: true,
                    autoplay: { delay: 5000, disableOnInteraction: false }
                });

                new Swiper('.swiperPremium', {
                    loop: true,
                    autoplay: { delay: 5000, disableOnInteraction: false }
                });

                // Galerie
                new Swiper('.gallerySwiper', {
                    slidesPerView: 1,
                    loop: true,
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                    breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
                });
            } catch (e) {
                console.warn('Swiper init failed', e);
            }
        }

        // Handle landing 'S'abonner' CTA: if not logged in -> show register, else open user dashboard
        window.handleLandingSubscribe = function() {
            if (!currentUser) {
                showPage('registerPage');
                // focus first field
                setTimeout(()=>{ const el = document.getElementById('registerName'); if(el) el.focus(); }, 200);
            } else {
                loadUserDashboard();
                showPage('userDashboard');
                // scroll to choose subscription
                setTimeout(()=>{
                    const el = document.getElementById('chooseSubscriptionSection');
                    if (el) el.scrollIntoView({behavior: 'smooth'});
                }, 200);
            }
        };

        // mobile menu
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', ()=>{
                const nav = document.querySelector('header nav');
                if (!nav) return;
                if (nav.style.display === 'flex') nav.style.display = 'none'; else nav.style.display = 'flex';
            });
        }

        // Contact form handling (Formspree integration)
    // EmailJS removed: client-side email sending via EmailJS is no longer used.
    // If you need server-side or alternative email integration, implement it separately.

    // To use Formspree: create a form at https://formspree.io/ and copy the endpoint URL
    // then set FORM_ENDPOINT to that URL (e.g. 'https://formspree.io/f/xxxxxx')
    const FORM_ENDPOINT = ''; // <-- set your Formspree endpoint here

        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const statusEl = document.getElementById('contactFormStatus');
                if (statusEl) {
                    statusEl.className = 'mt-3 text-sm text-gray-700';
                    statusEl.textContent = 'Envoi en cours...';
                    statusEl.style.display = 'block';
                }

                try {
                    const formData = new FormData(contactForm);
                    // Normalize field names
                    const name = formData.get('name') || formData.get('contactName') || formData.get('contact_name') || '';
                    const email = formData.get('email') || formData.get('contactEmail') || formData.get('contact_email') || '';
                    const message = formData.get('message') || formData.get('contactMessage') || formData.get('contact_message') || '';
                    const phone = (formData.get('phone') || formData.get('contactPhone') || formData.get('contact_phone') || '').trim();

                    // Basic Validation: name + message + (email or phone)
                    if (!name || !message || (!email && !phone)) {
                        if (statusEl) {
                            statusEl.className = 'mt-3 text-sm text-red-700';
                            statusEl.textContent = "Veuillez renseigner votre nom, un message et au moins un contact (email ou téléphone).";
                        }
                        return;
                    }

                    // Phone format validation (if provided)
                    if (phone) {
                        // Normalize by removing spaces, dashes and parentheses
                        const norm = phone.replace(/[\s\-()]/g, '');
                        // Allow local 9-digit numbers or international +243 followed by 9 digits
                        if (norm.startsWith('+243')) {
                            const rest = norm.slice(4);
                            if (!/^\d{9}$/.test(rest)) {
                                if (statusEl) {
                                    statusEl.className = 'mt-3 text-sm text-red-700';
                                    statusEl.textContent = 'Format du téléphone invalide. Exemple attendu : +243 97x xxx xxx ou 097xxxxxxx';
                                }
                                return;
                            }
                        } else {
                            const digitsOnly = norm.replace(/[^\d]/g, '');
                            if (!/^\d{9}$/.test(digitsOnly)) {
                                if (statusEl) {
                                    statusEl.className = 'mt-3 text-sm text-red-700';
                                    statusEl.textContent = 'Format du téléphone invalide. Exemple attendu : +243 97x xxx xxx ou 097xxxxxxx';
                                }
                                return;
                            }
                        }
                    }

                    // Enregistrer le message dans Supabase
                    const { data, error } = await supabase
                        .from('contact_messages')
                        .insert({
                            name,
                            email,
                            phone,
                            message
                        })
                        .select('id, name, email, phone, message, created_at')
                        .single();

                    if (error || !data) {
                        console.error('Erreur Supabase lors de l\'enregistrement du message de contact', error);
                        if (statusEl) {
                            statusEl.className = 'mt-3 text-sm text-red-700';
                            statusEl.textContent = 'Une erreur s\'est produite lors de l\'envoi. Veuillez réessayer plus tard.';
                        }
                        showAlert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
                        return;
                    }

                    if (!Array.isArray(appData.contactMessages)) appData.contactMessages = [];
                    appData.contactMessages.push({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        message: data.message,
                        createdAt: data.created_at || new Date().toISOString(),
                        status: 'new'
                    });

                    // Reset form
                    contactForm.reset();
                    if (statusEl) {
                        statusEl.className = 'mt-3 text-sm text-green-700';
                        statusEl.textContent = "Votre message a été envoyé avec succès. L'administrateur vous contactera rapidement.";
                    }

                    // Show confirmation alert
                    showAlert('Message envoyé', `Merci ${name}. Votre message a bien été reçu. Pour une réponse immédiate, vous pouvez aussi nous contacter sur WhatsApp : 097 254 5000`);

                } catch (error) {
                    console.error('Erreur lors de l\'envoi:', error);
                    if (statusEl) {
                        statusEl.className = 'mt-3 text-sm text-red-700';
                        statusEl.textContent = 'Une erreur s\'est produite lors de l\'envoi. Veuillez réessayer plus tard.';
                    }
                    showAlert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
                }
            });
        }

        // === Dark mode toggle handling ======================================
        const DARK_KEY = 'green_express_theme'; // 'dark' or 'light'

        function isSystemDark() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        function applyTheme(theme) {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            updateToggleIcons(theme === 'dark');
        }

        function updateToggleIcons(isDark) {
            try {
                const sun = document.getElementById('sunIcon');
                const moon = document.getElementById('moonIcon');
                if (!sun || !moon) return;
                if (isDark) {
                    sun.classList.remove('hidden');
                    moon.classList.add('hidden');
                } else {
                    sun.classList.add('hidden');
                    moon.classList.remove('hidden');
                }
            } catch (e) { /* ignore */ }
        }

        function loadThemePreference() {
            const stored = localStorage.getItem(DARK_KEY);
            if (stored === 'dark' || stored === 'light') return stored;
            return isSystemDark() ? 'dark' : 'light';
        }

        function toggleTheme() {
            const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem(DARK_KEY, next); } catch (e) {}
        }

        // Wire the toggle button
        try {
            const toggleBtn = document.getElementById('darkModeToggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
            }
        } catch (e) {}

        // Apply initial theme (from stored preference or system)
        try {
            const initial = loadThemePreference();
            applyTheme(initial);
        } catch (e) {}

    // Initialisation: charger les données locales puis les utilisateurs & données depuis Supabase
    (async () => {
        initializeData();
        await loadUsersFromSupabase();
        await loadSubscriptionsFromSupabase();
        await loadPaymentRequestsFromSupabase();
        await loadPaymentHistoryFromSupabase();
        await loadNotificationsFromSupabase();
        await loadContactMessagesFromSupabase();

        // Charger les images (Supabase avec fallback local), puis construire les carrousels
        await loadImagesFromSupabase();
        loadCarouselSlides();
        initializeOfferCarousels();
        initSwipers();

        // Tenter de restaurer une session utilisateur depuis le localStorage
        try {
            const rawSession = localStorage.getItem(CURRENT_USER_KEY);
            if (rawSession) {
                const stored = JSON.parse(rawSession);
                const users = appData.users || [];
                const fresh = users.find(u => u.id === stored.id);

                if (fresh) {
                    currentUser = {
                        id: fresh.id,
                        username: fresh.username,
                        email: stored.email || `${fresh.username}@example.com`,
                        name: fresh.name,
                        phone: fresh.phone,
                        address: fresh.address,
                        role: fresh.role || stored.role || 'user',
                        createdAt: fresh.createdAt || stored.createdAt || new Date().toISOString()
                    };
                } else {
                    // L'utilisateur n'existe plus en base, on nettoie la session locale
                    localStorage.removeItem(CURRENT_USER_KEY);
                }
            }
        } catch (e) {
            console.warn('Erreur lors de la restauration de la session utilisateur', e);
        }

        // Rediriger automatiquement l'utilisateur vers son tableau de bord si une session est présente
        if (currentUser) {
            if (currentUser.role === 'admin') {
                loadAdminDashboard();
                showPage('adminDashboard');
            } else {
                loadUserDashboard();
                showPage('userDashboard');
            }
        } else {
            showPage('landingPage');
        }

        // Adapter les boutons de la landing
        updateLandingAuthButtons();
    })();