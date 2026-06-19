// Sidebar toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// Show message helper
function showMsg(id, data) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  el.className = 'msg-box ' + (data?.success ? 'alert-success' : 'alert-error');
  el.textContent = data?.message || (data?.success ? '✅ تم الحفظ' : '❌ حدث خطأ');
  if (data?.success) setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// API helpers
async function apiPost(url, data) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await r.json();
  } catch (e) { return { success: false, message: 'خطأ في الاتصال: ' + e.message }; }
}

async function saveSettings(guildId, formData) {
  try {
    const body = {};
    for (const [k, v] of formData.entries()) {
      if (body[k] !== undefined) {
        if (!Array.isArray(body[k])) body[k] = [body[k]];
        body[k].push(v);
      } else { body[k] = v; }
    }
    // Handle checkboxes that are unchecked (not in formData)
    document.querySelectorAll('input[type=checkbox]').forEach(cb => {
      if (!formData.has(cb.name) && cb.name) body[cb.name] = 'false';
    });
    const r = await fetch(`/api/guild/${guildId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) { return { success: false, message: 'خطأ: ' + e.message }; }
}

// Active link
document.querySelectorAll('.nav-item').forEach(a => {
  if (a.href && a.href === window.location.href) a.classList.add('active');
});
