// profile.js - Gestion du profil utilisateur (lecture, édition, avatar)

// --- Configuration Supabase ---
const SUPABASE_URL = 'https://ecserqowrwehijyopjyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjc2VycW93cndlaGlqeW9wanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTY0NDQsImV4cCI6MjA3ODYzMjQ0NH0.Yd6DCPhQlQnZwIEfvF6JLymph9MAwVmWT6mSKUl_6Kg';
const STORAGE_BUCKET = 'gexpress_media';
const CURRENT_USER_KEY = 'green_express_current_user_v1';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Éléments DOM ---
const avatarDisplay = document.getElementById('avatarDisplay');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarInput = document.getElementById('avatarInput');
const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');
const addressInput = document.getElementById('addressInput');
const statusEl = document.getElementById('status');
const logoutBtn = document.getElementById('logoutBtn');
const profileForm = document.getElementById('profileForm');
const backBtn = document.getElementById('backBtn');

let currentUser = null;

function setStatus(msg, ok = true) {
  if (!statusEl) return;
  statusEl.textContent = msg || '';
  statusEl.className = 'text-sm ' + (ok ? 'text-emerald-600' : 'text-red-600');
}

function getSessionUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function fetchUserFromSupabase(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, name, phone, address, avatar_path, role, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

function getPublicImageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

function renderProfile(user) {
  if (!user) return;
  const displayName = user.name || user.username || 'Utilisateur';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'G';

  const avatarUrl = user.avatar_path ? getPublicImageUrl(user.avatar_path) : null;
  if (avatarDisplay) {
    if (avatarUrl) {
      avatarDisplay.style.backgroundImage = `url('${avatarUrl}')`;
      avatarDisplay.textContent = '';
    } else {
      avatarDisplay.style.backgroundImage = '';
      avatarDisplay.textContent = initial;
    }
  }

  if (nameInput) nameInput.value = user.name || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (addressInput) addressInput.value = user.address || '';
}

async function saveProfile(e) {
  e.preventDefault();
  if (!currentUser) return;

  const name = (nameInput?.value || '').trim();
  const phone = (phoneInput?.value || '').trim();
  const address = (addressInput?.value || '').trim();

  if (!name) {
    setStatus('Le nom est obligatoire.', false);
    return;
  }

  setStatus('Enregistrement...');
  const { error } = await supabase
    .from('users')
    .update({ name, phone, address })
    .eq('id', currentUser.id);
  if (error) {
    setStatus('Erreur lors de la mise à jour.', false);
    console.error(error);
    return;
  }

  currentUser = { ...currentUser, name, phone, address };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
    id: currentUser.id,
    username: currentUser.username,
    email: currentUser.email,
    name: currentUser.name,
    phone: currentUser.phone,
    address: currentUser.address,
    role: currentUser.role,
    avatarPath: currentUser.avatar_path || null,
    createdAt: currentUser.created_at
  }));

  renderProfile(currentUser);
  setStatus('Profil mis à jour.');
}

async function handleAvatarChange(file) {
  if (!file || !currentUser) return;
  setStatus('Upload en cours...');

  const extension = file.name.split('.').pop() || 'webp';
  const path = `avatars/${currentUser.id}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });
  if (uploadError) {
    setStatus('Upload échoué.', false);
    console.error(uploadError);
    return;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_path: path })
    .eq('id', currentUser.id);
  if (updateError) {
    setStatus('Profil mis à jour partiellement.', false);
    console.error(updateError);
    return;
  }

  currentUser = { ...currentUser, avatar_path: path };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
    id: currentUser.id,
    username: currentUser.username,
    email: currentUser.email,
    name: currentUser.name,
    phone: currentUser.phone,
    address: currentUser.address,
    role: currentUser.role,
    avatarPath: path,
    createdAt: currentUser.created_at
  }));

  renderProfile(currentUser);
  setStatus('Photo mise à jour.');
}

function bindEvents() {
  if (profileForm) profileForm.addEventListener('submit', saveProfile);
  if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', () => avatarInput?.click());
  if (avatarInput) {
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files?.[0];
      if (file) handleAvatarChange(file);
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = 'index.html';
    });
  }
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Retour vers index : app.js redirigera automatiquement vers le bon dashboard selon la session
      window.location.href = 'index.html';
    });
  }
}

async function init() {
  bindEvents();
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const fresh = await fetchUserFromSupabase(sessionUser.id);
    currentUser = fresh;
    renderProfile(currentUser);
    setStatus('Profil chargé.');
  } catch (e) {
    console.error(e);
    setStatus('Impossible de charger le profil.', false);
  }
}

init();

