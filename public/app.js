const state = {
  links: [],
  activeLinkId: null,
  chart: null,
  user: null,
};

const elements = {
  linksList: document.getElementById('linksList'),
  linkCountBadge: document.getElementById('linkCountBadge'),
  sidebarTotalLinks: document.getElementById('sidebarTotalLinks'),
  totalClicks: document.getElementById('totalClicks'),
  clickRate: document.getElementById('clickRate'),
  referrerList: document.getElementById('referrerList'),
  deviceList: document.getElementById('deviceList'),
  form: document.getElementById('createLinkForm'),
  errorBox: document.getElementById('formError'),
  modal: document.getElementById('createModal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  openCreateModal: document.getElementById('openCreateModal'),
  closeModal: document.getElementById('closeModal'),
  cancelCreate: document.getElementById('cancelCreate'),
  logoutBtn: document.getElementById('logoutBtn'),
  userBadge: document.getElementById('userBadge'),
  userName: document.getElementById('userName'),
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response.json();
}

async function checkAuth() {
  try {
    const data = await requestJson('/api/auth/me');
    state.user = data.user || 'admin';
    elements.userName.textContent = state.user;
    elements.userBadge.classList.remove('hidden');
    elements.userBadge.classList.add('inline-flex');
  } catch (error) {
    window.location.href = '/login';
  }
}

async function fetchLinks() {
  const data = await requestJson('/api/links');
  state.links = data.links || [];

  if (!state.activeLinkId && state.links.length > 0) {
    state.activeLinkId = state.links[0].id;
  }

  renderLinkList();

  if (state.activeLinkId) {
    const activeLink = state.links.find((link) => link.id === state.activeLinkId);
    if (activeLink) {
      await loadLinkDetails(activeLink.id);
    }
  } else {
    renderEmptyAnalytics();
  }

  elements.linkCountBadge.textContent = `${state.links.length} item${state.links.length === 1 ? '' : 's'}`;
  elements.sidebarTotalLinks.textContent = String(state.links.length);
}

function renderLinkList() {
  if (!state.links.length) {
    elements.linksList.innerHTML = `
      <div class="empty-state rounded-2xl p-8 text-center text-sm text-slate-500">
        <p class="text-base font-semibold text-slate-700">No shortened links yet</p>
        <p class="mt-2">Create your first link to start tracking performance.</p>
      </div>
    `;
    return;
  }

  elements.linksList.innerHTML = state.links.map((link) => {
    const isActive = link.id === state.activeLinkId;
    const shortUrl = `${window.location.origin}/short/${link.code}`;
    return `
      <div class="link-card ${isActive ? 'active' : ''} cursor-pointer rounded-2xl bg-white p-4" data-id="${link.id}">
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-base font-semibold text-slate-900">${escapeHtml(link.title || 'Untitled link')}</p>
              <p class="mt-1 text-xs text-slate-500">${new Date(link.created_at).toLocaleDateString()}</p>
            </div>
            <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">${Number(link.total_clicks || 0)} clicks</span>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <a href="/short/${link.code}" target="_blank" class="text-sm font-medium text-brand-700 break-all">${shortUrl}</a>
              <button class="copy-btn rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700" data-copy="${shortUrl}">Copy</button>
            </div>
          </div>

          <p class="text-sm text-slate-500 line-clamp-2">${escapeHtml(link.destination)}</p>
        </div>
      </div>
    `;
  }).join('');

  elements.linksList.querySelectorAll('.link-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.copy-btn')) return;
      const id = Number(card.dataset.id);
      state.activeLinkId = id;
      renderLinkList();
      loadLinkDetails(id);
    });
  });

  elements.linksList.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const url = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Copied';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 1200);
      } catch (error) {
        button.textContent = 'Failed';
      }
    });
  });
}

async function loadLinkDetails(linkId) {
  const data = await requestJson(`/api/links/${linkId}`);

  if (!data.analytics) {
    renderEmptyAnalytics();
    return;
  }

  const analytics = data.analytics;
  const totalClicks = Number(analytics.total_clicks || 0);
  const totalLinks = state.links.length || 1;
  const rate = totalClicks === 0 ? 0 : Math.min(100, Math.round((totalClicks / totalLinks) * 100));

  elements.totalClicks.textContent = String(totalClicks);
  elements.clickRate.textContent = `${rate}%`;

  renderReferrers(analytics.referrers || []);
  renderDevices(analytics.devices || []);
  renderChart(analytics.click_trend || []);
}

function renderReferrers(referrers) {
  if (!referrers.length) {
    elements.referrerList.innerHTML = '<div class="text-sm text-slate-500">No traffic yet.</div>';
    return;
  }

  const total = referrers.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  elements.referrerList.innerHTML = referrers.map((item) => {
    const percent = Math.round((Number(item.value || 0) / total) * 100);
    return `
      <div class="rounded-xl bg-slate-50 p-2">
        <div class="referrer-row text-sm text-slate-600">
          <span>${escapeHtml(item.name)}</span>
          <span class="font-semibold text-slate-900">${item.value}</span>
        </div>
        <div class="progress-bar mt-2">
          <span class="progress-fill" style="width: ${percent}%"></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderDevices(devices) {
  if (!devices.length) {
    elements.deviceList.innerHTML = '<div class="text-sm text-slate-500">No device data yet.</div>';
    return;
  }

  const total = devices.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  elements.deviceList.innerHTML = devices.map((item) => {
    const percent = Math.round((Number(item.value || 0) / total) * 100);
    return `
      <div class="rounded-xl bg-slate-50 p-2">
        <div class="device-row text-sm text-slate-600">
          <span>${escapeHtml(item.name)}</span>
          <span class="font-semibold text-slate-900">${item.value}</span>
        </div>
        <div class="progress-bar mt-2">
          <span class="progress-fill" style="width: ${percent}%"></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderChart(clickTrend) {
  const labels = clickTrend.map((day) => day.date.slice(5));
  const values = clickTrend.map((day) => day.count);

  if (!window.Chart) {
    return;
  }

  const ctx = document.getElementById('clickChart');
  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Clicks',
        data: values,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { display: false },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function renderEmptyAnalytics() {
  elements.totalClicks.textContent = '0';
  elements.clickRate.textContent = '0%';
  elements.referrerList.innerHTML = '<div class="text-sm text-slate-500">Select a link to view analytics.</div>';
  elements.deviceList.innerHTML = '<div class="text-sm text-slate-500">Select a link to view device metrics.</div>';

  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const ctx = document.getElementById('clickChart');
  const blank = ctx.getContext('2d');
  blank.clearRect(0, 0, ctx.width, ctx.height);
}

function openModal() {
  elements.modal.classList.remove('hidden');
  elements.modal.classList.add('flex');
  elements.modalBackdrop.classList.remove('hidden');
}

function closeModal() {
  elements.modal.classList.add('hidden');
  elements.modal.classList.remove('flex');
  elements.modalBackdrop.classList.add('hidden');
  elements.form.reset();
  elements.errorBox.classList.add('hidden');
  elements.errorBox.textContent = '';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

elements.openCreateModal.addEventListener('click', openModal);
elements.closeModal.addEventListener('click', closeModal);
elements.cancelCreate.addEventListener('click', closeModal);
elements.modalBackdrop.addEventListener('click', closeModal);
elements.logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const payload = {
    title: formData.get('title')?.toString().trim(),
    url: formData.get('url')?.toString().trim(),
    customCode: formData.get('customCode')?.toString().trim(),
  };

  try {
    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to create short link.');
    }

    closeModal();
    await fetchLinks();
    const newLink = state.links.find((link) => link.code === data.link.code) || state.links[0];
    if (newLink) {
      state.activeLinkId = newLink.id;
      renderLinkList();
      await loadLinkDetails(newLink.id);
    }
  } catch (error) {
    elements.errorBox.textContent = error.message;
    elements.errorBox.classList.remove('hidden');
  }
});

async function initDashboard() {
  await checkAuth();
  await fetchLinks();
}

initDashboard();
