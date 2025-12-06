// notifications.js - liste et filtrage des notifications

const SUPABASE_URL = 'https://ecserqowrwehijyopjyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjc2VycW93cndlaGlqeW9wanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTY0NDQsImV4cCI6MjA3ODYzMjQ0NH0.Yd6DCPhQlQnZwIEfvF6JLymph9MAwVmWT6mSKUl_6Kg';
const CURRENT_USER_KEY = 'green_express_current_user_v1';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const notifList = document.getElementById('notifList');
const emptyState = document.getElementById('emptyState');
const subtitleInfo = document.getElementById('subtitleInfo');
const markAllBtn = document.getElementById('markAllBtn');
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let notifications = [];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function getSessionUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, to_role, target_user_id, related_id, read, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function filterForUser(all) {
  if (!currentUser) return [];
  if (currentUser.role === 'admin') return all;
  return all.filter(n => {
    if (n.to_role !== 'user') return false;
    if (n.target_user_id && n.target_user_id !== currentUser.id) return false;
    return true;
  });
}

async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
  const item = notifications.find(n => n.id === id);
  if (item) item.read = true;
  renderList();
}

async function markAllRead() {
  if (!notifications.length) return;
  const ids = notifications.filter(n => !n.read).map(n => n.id);
  if (!ids.length) return;
  await supabase.from('notifications').update({ read: true }).in('id', ids);
  notifications = notifications.map(n => ({ ...n, read: true }));
  renderList();
}

function renderList() {
  if (!notifications.length) {
    notifList.innerHTML = '';
    emptyState.classList.remove('hidden');
    subtitleInfo.textContent = 'Aucune notification';
    return;
  }
  emptyState.classList.add('hidden');
  subtitleInfo.textContent = `${notifications.length} notification(s)`;

  notifList.innerHTML = notifications.map(n => {
    const badge = n.read
      ? '<span class="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-500">Lue</span>'
      : '<span class="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Non lue</span>';
    return `
      <div class="flex items-start gap-3 px-6 py-4 ${n.read ? 'bg-white' : 'bg-emerald-50'}">
        <div class="mt-1 text-slate-500">🔔</div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div class="font-semibold text-slate-800">${n.title || '(Sans titre)'}</div>
            ${badge}
          </div>
          <div class="text-sm text-slate-600 mt-1 whitespace-pre-line">${n.message || ''}</div>
          <div class="text-xs text-slate-400 mt-1">${formatDate(n.created_at)}</div>
        </div>
        <div class="flex flex-col gap-2">
          ${n.read ? '' : `<button class="text-sm text-emerald-700 hover:text-emerald-800" data-mark="${n.id}">Marquer lu</button>`}
          <button class="text-sm text-red-600 hover:text-red-700" data-del="${n.id}">Supprimer</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind mark-read buttons
  notifList.querySelectorAll('[data-mark]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-mark');
      markNotificationRead(id);
    });
  });
  // Bind delete buttons
  notifList.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      deleteNotification(id);
    });
  });
}

function bindCommon() {
  if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);
  if (backBtn) backBtn.addEventListener('click', () => window.location.href = 'index.html');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = 'index.html';
    });
  }
}

async function init() {
  bindCommon();
  currentUser = getSessionUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const all = await fetchNotifications();
    notifications = filterForUser(all);
    renderList();
  } catch (e) {
    console.error(e);
    subtitleInfo.textContent = 'Erreur de chargement';
    notifList.innerHTML = '<div class="px-6 py-4 text-sm text-red-600">Erreur lors du chargement des notifications.</div>';
  }
}

init();

async function deleteNotification(id) {
  try {
    await supabase.from('notifications').delete().eq('id', id);
    notifications = notifications.filter(n => n.id !== id);
    renderList();
  } catch (e) {
    console.error('Erreur suppression notif', e);
  }
}

