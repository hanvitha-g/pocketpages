/**
 * PocketPages - Main Application Controller
 * Handles UI interactions, rendering, note editing, timestamps, and filters
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentUser: Auth.getCurrentUser(),
    activeFilter: 'all',
    searchQuery: '',
    sortBy: 'recent',
    editingNoteId: null,
    selectedColorTag: 'terracotta',
    selectedCategory: 'moment'
  };

  // DOM Elements Cache
  const elements = {
    authLandingScreen: document.getElementById('authLandingScreen'),
    appHeader: document.getElementById('appHeader'),
    mainContainer: document.getElementById('mainContainer'),
    notesGrid: document.getElementById('notesGrid'),
    searchField: document.getElementById('searchField'),
    sortSelect: document.getElementById('sortSelect'),
    categoryTabs: document.getElementById('categoryTabs'),
    userBadge: document.getElementById('userBadge'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    modalUserAvatar: document.getElementById('modalUserAvatar'),
    welcomeTitle: document.getElementById('welcomeTitle'),
    totalCountStat: document.getElementById('totalCountStat'),
    momentsCountStat: document.getElementById('momentsCountStat'),
    birthdaysCountStat: document.getElementById('birthdaysCountStat'),
    tabCountAll: document.getElementById('tabCountAll'),
    tabCountMoment: document.getElementById('tabCountMoment'),
    tabCountMemory: document.getElementById('tabCountMemory'),
    tabCountBirthday: document.getElementById('tabCountBirthday'),
    btnNewPage: document.getElementById('btnNewPage'),
    fabNewPage: document.getElementById('fabNewPage'),

    // Note Modal
    noteModalBackdrop: document.getElementById('noteModalBackdrop'),
    noteModalCard: document.querySelector('#noteModalBackdrop .modal-card'),
    noteModalTitle: document.getElementById('noteModalTitle'),
    noteCloseBtn: document.getElementById('noteCloseBtn'),
    noteCancelBtn: document.getElementById('noteCancelBtn'),
    noteSaveBtn: document.getElementById('noteSaveBtn'),
    noteTitleInput: document.getElementById('noteTitleInput'),
    noteContentInput: document.getElementById('noteContentInput'),
    noteBirthdayBox: document.getElementById('noteBirthdayBox'),
    noteBirthdayInput: document.getElementById('noteBirthdayInput'),
    notePinCheckbox: document.getElementById('notePinCheckbox'),
    editorTimestampMeta: document.getElementById('editorTimestampMeta'),
    selectedColorLabel: document.getElementById('selectedColorLabel'),
    categoryChips: document.querySelectorAll('.category-chip'),
    colorSwatches: document.querySelectorAll('.color-dot'),

    // Auth Modal
    authModalBackdrop: document.getElementById('authModalBackdrop'),
    authCloseBtn: document.getElementById('authCloseBtn'),
    authTabLogin: document.getElementById('authTabLogin'),
    authTabRegister: document.getElementById('authTabRegister'),
    authFormLogin: document.getElementById('authFormLogin'),
    authFormRegister: document.getElementById('authFormRegister'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerError: document.getElementById('registerError'),
    activeUserSection: document.getElementById('activeUserSection'),
    activeUserDisplay: document.getElementById('activeUserDisplay'),
    btnLogout: document.getElementById('btnLogout'),
    btnSwitchAccount: document.getElementById('btnSwitchAccount'),

    // Google / Gmail Sign-In Elements
    btnGoogleSignIn: document.getElementById('btnGoogleSignIn'),
    googleAccountPicker: document.getElementById('googleAccountPicker'),
    googleAccountsListContainer: document.getElementById('googleAccountsListContainer'),
    btnCloseGooglePicker: document.getElementById('btnCloseGooglePicker'),
    googleCustomEmailInput: document.getElementById('googleCustomEmailInput'),
    btnConfirmGoogleCustom: document.getElementById('btnConfirmGoogleCustom'),
    pillAppendGmailGoogle: document.getElementById('pillAppendGmailGoogle'),
    pillLoginGmail: document.getElementById('pillLoginGmail'),
    pillRegisterGmail: document.getElementById('pillRegisterGmail'),

    // Sync / Mobile Access Modal
    btnSyncModal: document.getElementById('btnSyncModal'),
    syncModalBackdrop: document.getElementById('syncModalBackdrop'),
    syncCloseBtn: document.getElementById('syncCloseBtn'),
    btnExportJSON: document.getElementById('btnExportJSON'),
    btnImportJSON: document.getElementById('btnImportJSON'),
    importFileInput: document.getElementById('importFileInput'),
    localIpDisplay: document.getElementById('localIpDisplay'),

    // Password Toggles, Counters & Birthday Widget
    toggleLoginPass: document.getElementById('toggleLoginPass'),
    toggleRegisterPass: document.getElementById('toggleRegisterPass'),
    wordCounter: document.getElementById('wordCounter'),
    birthdayWidget: document.getElementById('birthdayWidget'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    setupEventListeners();
    updateUserInterface();
    if (state.currentUser) {
      renderNotes();
      updateStatistics();
    }
    detectLocalIpPlaceholder();
  }

  // =========================================================================
  // User & UI Setup
  // =========================================================================
  function updateUserInterface() {
    state.currentUser = Auth.getCurrentUser();
    if (state.currentUser) {
      // User is logged in: show dashboard, hide initial login screen
      if (elements.authLandingScreen) elements.authLandingScreen.style.display = 'none';
      if (elements.appHeader) elements.appHeader.style.display = 'block';
      if (elements.mainContainer) elements.mainContainer.style.display = 'block';
      if (elements.fabNewPage) elements.fabNewPage.style.display = 'flex';

      const displayName = state.currentUser.name || state.currentUser.email.split('@')[0];
      const initials = Auth.getAvatarInitials(displayName);
      elements.userName.textContent = displayName;
      elements.userAvatar.textContent = initials;
      if (elements.modalUserAvatar) elements.modalUserAvatar.textContent = initials;
      elements.welcomeTitle.textContent = `Welcome back, ${displayName} ✨`;
      
      // Update profile modal
      if (elements.activeUserDisplay) {
        elements.activeUserDisplay.innerHTML = `
          <div>${escapeHtml(displayName)}</div>
          <div style="font-size: 0.88rem; font-weight: normal; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(state.currentUser.email)}</div>
        `;
      }
    } else {
      // User is not logged in: show dedicated initial login screen, hide dashboard
      if (elements.authLandingScreen) elements.authLandingScreen.style.display = 'flex';
      if (elements.appHeader) elements.appHeader.style.display = 'none';
      if (elements.mainContainer) elements.mainContainer.style.display = 'none';
      if (elements.fabNewPage) elements.fabNewPage.style.display = 'none';
      if (elements.birthdayWidget) {
        elements.birthdayWidget.innerHTML = '';
        elements.birthdayWidget.style.display = 'none';
      }
      
      elements.userName.textContent = 'Sign In';
      elements.userAvatar.textContent = '?';
    }
  }

  // Detect and show live address or local network IP hints
  function detectLocalIpPlaceholder() {
    if (!elements.localIpDisplay) return;
    if (window.location.protocol.startsWith('http')) {
      elements.localIpDisplay.textContent = window.location.href.split('#')[0].split('?')[0];
    } else {
      const host = window.location.hostname || 'localhost';
      const port = window.location.port ? `:${window.location.port}` : ':8080';
      elements.localIpDisplay.textContent = `http://${host}${port}/`;
    }
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
    `;
    elements.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 20);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // Word & Character Counter
  // =========================================================================
  function updateWordCounter() {
    if (!elements.wordCounter) return;
    const text = (elements.noteContentInput && elements.noteContentInput.value) || '';
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    elements.wordCounter.innerHTML = `${words} ${words === 1 ? 'word' : 'words'} &bull; ${chars} ${chars === 1 ? 'character' : 'characters'}`;
  }

  // =========================================================================
  // Confetti Particle Celebration Engine
  // =========================================================================
  function triggerConfetti(duration = 3500) {
    let canvas = document.getElementById('pocketConfettiCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'pocketConfettiCanvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const colors = ['#d96b43', '#e5933a', '#d67568', '#6b8f71', '#dfa528', '#f27059', '#ffd166', '#ff9f1c', '#ffffff'];
    const particles = [];
    const count = Math.min(130, Math.floor(width / 8));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height * 0.4,
        w: Math.random() * 8 + 6,
        h: Math.random() * 5 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4.5,
        vy: Math.random() * 3 + 2.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        opacity: 1
      });
    }

    const startTime = Date.now();
    let animId;

    function render() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      const fadeProgress = elapsed > duration - 1000 ? (duration - elapsed) / 1000 : 1;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vy += 0.045; // gravity

        if (p.y < height + 25) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity * fadeProgress));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (alive && elapsed < duration) {
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, width, height);
        window.removeEventListener('resize', onResize);
      }
    }

    render();
  }

  // Track session so confetti doesn't fire annoyingly on every minor rerender
  const celebratedBirthdaySessions = new Set();

  // =========================================================================
  // Upcoming Birthdays Widget
  // =========================================================================
  function renderBirthdayWidget() {
    if (!elements.birthdayWidget) return;
    if (!state.currentUser) {
      elements.birthdayWidget.innerHTML = '';
      elements.birthdayWidget.style.display = 'none';
      return;
    }

    const allNotes = Storage.getNotes(state.currentUser.email);
    const birthdayNotes = allNotes
      .filter(n => n.category === 'birthday' && n.birthdayDate)
      .map(n => ({
        note: n,
        info: Storage.calculateBirthdayInfo(n.birthdayDate)
      }))
      .filter(item => item.info !== null);

    if (birthdayNotes.length === 0) {
      elements.birthdayWidget.innerHTML = '';
      elements.birthdayWidget.style.display = 'none';
      return;
    }

    // Sort by nearest days until celebration
    birthdayNotes.sort((a, b) => a.info.daysUntil - b.info.daysUntil);

    const todayBirthdays = birthdayNotes.filter(b => b.info.isToday);
    const upcomingList = birthdayNotes.slice(0, 4);

    // Auto-trigger confetti once per session if a birthday is today!
    const sessionKey = `${state.currentUser.email}_${todayBirthdays.map(b => b.note.id).join('_')}`;
    if (todayBirthdays.length > 0 && !celebratedBirthdaySessions.has(sessionKey)) {
      celebratedBirthdaySessions.add(sessionKey);
      setTimeout(() => triggerConfetti(4500), 500);
    }

    let todayBannerHtml = '';
    if (todayBirthdays.length > 0) {
      const names = todayBirthdays.map(b => escapeHtml(b.note.title)).join(', ');
      todayBannerHtml = `
        <div class="birthday-today-banner">
          <div class="birthday-today-text">
            <span class="birthday-today-icon">🎉</span>
            <div>
              <strong>Today is ${names}'s Birthday! 🎂</strong>
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: normal; margin-top: 0.15rem;">
                A special moment to cherish and celebrate!
              </div>
            </div>
          </div>
          <button type="button" class="btn-confetti" id="btnTodayConfetti">
            <span>🎉 Throw Confetti!</span>
          </button>
        </div>
      `;
    }

    const cardsHtml = upcomingList.map(item => {
      const b = item.info;
      const n = item.note;
      const tagClass = b.isToday ? 'is-today' : (b.daysUntil <= 7 ? 'is-soon' : '');
      return `
        <div class="birthday-widget-card" data-id="${n.id}" title="Click to view or edit this birthday page">
          <div class="birthday-card-info">
            <div class="birthday-card-name">${escapeHtml(n.title)}</div>
            <div class="birthday-card-sub">${b.birthDateFormatted} &bull; Turning ${b.nextAge}</div>
          </div>
          <div class="birthday-countdown-tag ${tagClass}">
            ${b.isToday ? '🎉 Today!' : (b.daysUntil === 1 ? '🎂 Tomorrow!' : `⏳ ${b.daysUntil}d`)}
          </div>
        </div>
      `;
    }).join('');

    elements.birthdayWidget.innerHTML = `
      <div class="birthday-widget-container">
        <div class="birthday-widget-header">
          <div class="birthday-widget-title">
            <span class="widget-icon">🎂</span>
            <span>Upcoming Celebrations</span>
          </div>
          <div class="birthday-widget-actions">
            <button type="button" class="btn-confetti" id="btnWidgetConfetti" title="Throw a joyful confetti shower!">
              <span>✨ Confetti Shower</span>
            </button>
          </div>
        </div>
        ${todayBannerHtml}
        <div class="birthday-widget-cards">
          ${cardsHtml}
        </div>
      </div>
    `;
    elements.birthdayWidget.style.display = 'block';

    // Click cards to open editor
    elements.birthdayWidget.querySelectorAll('.birthday-widget-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        openNoteEditor(id);
      });
    });

    document.getElementById('btnTodayConfetti')?.addEventListener('click', () => triggerConfetti(4000));
    document.getElementById('btnWidgetConfetti')?.addEventListener('click', () => triggerConfetti(3500));
  }

  // =========================================================================
  // Password Visibility Toggle Helper
  // =========================================================================
  function setupPasswordToggle(toggleBtn, passwordInput) {
    if (!toggleBtn || !passwordInput) return;
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      const eyeOpen = toggleBtn.querySelector('.eye-open');
      const eyeClosed = toggleBtn.querySelector('.eye-closed');

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }

      const label = isPassword ? 'Hide password' : 'Show password';
      toggleBtn.setAttribute('aria-label', label);
      toggleBtn.setAttribute('title', label);
      passwordInput.focus();
    });
  }

  // =========================================================================
  // Render Notes
  // =========================================================================
  function renderNotes() {
    if (!state.currentUser) {
      elements.notesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-illustration">🔐</div>
          <h3 class="empty-title">Please Sign In</h3>
          <p class="empty-description">Create an account or sign in to save and access your personal pages.</p>
          <button class="btn btn-primary" onclick="document.getElementById('userBadge').click()">Sign In / Register</button>
        </div>
      `;
      return;
    }

    const allNotes = Storage.getNotes(state.currentUser.email);
    const totalBirthdaysInAccount = allNotes.filter(n => n.category === 'birthday' && n.birthdayDate).length;

    let filtered = allNotes.filter(note => {
      // Category filter
      if (state.activeFilter !== 'all' && note.category !== state.activeFilter) {
        return false;
      }
      // Search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const matchesTitle = note.title && note.title.toLowerCase().includes(query);
        const matchesContent = note.content && note.content.toLowerCase().includes(query);
        return matchesTitle || matchesContent;
      }
      return true;
    });

    // Sort Notes
    filtered.sort((a, b) => {
      // Pinned notes always surface first
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      if (state.sortBy === 'recent') {
        return b.createdAt - a.createdAt;
      } else if (state.sortBy === 'edited') {
        return b.updatedAt - a.updatedAt;
      } else if (state.sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      } else if (state.sortBy === 'birthday') {
        const isBdayA = a.category === 'birthday' && a.birthdayDate;
        const isBdayB = b.category === 'birthday' && b.birthdayDate;
        if (isBdayA && !isBdayB) return -1;
        if (!isBdayA && isBdayB) return 1;
        const bA = isBdayA ? Storage.calculateBirthdayInfo(a.birthdayDate)?.daysUntil ?? 999 : 999;
        const bB = isBdayB ? Storage.calculateBirthdayInfo(b.birthdayDate)?.daysUntil ?? 999 : 999;
        return bA - bB;
      }
      return b.updatedAt - a.updatedAt;
    });

    // Empty State Handling
    if (filtered.length === 0) {
      if (state.activeFilter === 'birthday' || (state.sortBy === 'birthday' && totalBirthdaysInAccount === 0)) {
        elements.notesGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-illustration">🎂</div>
            <h3 class="empty-title">No Birthdays Saved Yet</h3>
            <p class="empty-description">
              You don't have any birthdays in your pocket. Add your friends and family with their birth dates to see automatic day countdowns and age calculations!
            </p>
            <button class="btn btn-primary" id="btnEmptyAddBirthday">
              <span>+ Add a Birthday Page</span>
            </button>
          </div>
        `;
        document.getElementById('btnEmptyAddBirthday')?.addEventListener('click', () => openNoteEditor(null, 'birthday'));
        return;
      }

      const isFiltered = Boolean(state.searchQuery || state.activeFilter !== 'all');
      elements.notesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-illustration">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 class="empty-title">${isFiltered ? 'No matching pages' : 'Your Pocket is Fresh & Clean ✨'}</h3>
          <p class="empty-description">
            ${isFiltered 
              ? `No pages found for "${escapeHtml(state.searchQuery || state.activeFilter)}".` 
              : 'You have not added any notes yet. Start recording your daily moments, cherished memories, and birthdays!'}
          </p>
          <button class="btn btn-primary" id="btnEmptyAdd">
            <span>+ Add Your First Page</span>
          </button>
        </div>
      `;
      document.getElementById('btnEmptyAdd')?.addEventListener('click', () => openNoteEditor());
      return;
    }

    // If user sorted by Birthday, but has NO birthdays saved at all, show notice banner at top:
    let bannerHtml = '';
    if (state.sortBy === 'birthday' && totalBirthdaysInAccount === 0) {
      bannerHtml = `
        <div class="birthday-alert-box">
          <div class="birthday-alert-content">
            <span class="birthday-alert-icon">🎂</span>
            <div>
              <div class="birthday-alert-title">No Birthdays Saved Yet</div>
              <div class="birthday-alert-desc">
                You selected <strong>"Upcoming Birthday"</strong> in the sort list, but there are no birthdays saved in your pocket yet.
              </div>
            </div>
          </div>
          <button class="btn btn-primary" id="btnBannerAddBirthday" style="font-size: 0.84rem; padding: 0.45rem 1rem; flex-shrink: 0;">
            + Add a Birthday
          </button>
        </div>
      `;
    }

    elements.notesGrid.innerHTML = bannerHtml + filtered.map(note => createNoteCardHtml(note)).join('');
    document.getElementById('btnBannerAddBirthday')?.addEventListener('click', () => openNoteEditor(null, 'birthday'));
    attachNoteCardEvents();
  }

  // Create single note card HTML
  function createNoteCardHtml(note) {
    const isBirthday = note.category === 'birthday';
    const birthdayInfo = isBirthday && note.birthdayDate ? Storage.calculateBirthdayInfo(note.birthdayDate) : null;
    
    // Check if the note has been edited after creation (difference > 2 seconds)
    const hasBeenEdited = note.updatedAt && (note.updatedAt - note.createdAt > 2000);

    const categoryLabels = {
      moment: { label: 'Daily Moment 📖', class: 'tag-moment' },
      memory: { label: 'Memory 💭', class: 'tag-memory' },
      birthday: { label: 'Birthday 🎂', class: 'tag-birthday' },
      general: { label: 'Note 📝', class: 'tag-general' }
    };

    const catMeta = categoryLabels[note.category] || categoryLabels.moment;

    return `
      <article class="note-card accent-${note.colorTag || 'terracotta'} ${note.pinned ? 'is-pinned' : ''}" data-id="${note.id}">
        ${note.pinned ? '<div class="pin-indicator" title="Pinned to top">📌</div>' : ''}
        
        <div class="card-top">
          <span class="category-tag ${catMeta.class}">${catMeta.label}</span>
          <div class="card-actions">
            <button class="btn-card-action btn-pin" title="${note.pinned ? 'Unpin page' : 'Pin page'}" data-action="pin">
              ${note.pinned ? '📌' : '📍'}
            </button>
            <button class="btn-card-action btn-edit" title="Edit page" data-action="edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="btn-card-action btn-copy" title="Copy text" data-action="copy">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-card-action btn-delete" title="Delete page" data-action="delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        ${birthdayInfo ? `
          <div class="birthday-ribbon">
            <div class="birthday-ribbon-left">
              <span>🎂</span>
              <span>${birthdayInfo.birthDateFormatted} (Turning ${birthdayInfo.nextAge})</span>
            </div>
            <span class="birthday-ribbon-badge ${birthdayInfo.isToday ? 'is-today' : ''}">
              ${birthdayInfo.countdownText}
            </span>
          </div>
        ` : ''}

        <h3 class="card-title">${escapeHtml(note.title)}</h3>
        <p class="card-text">${escapeHtml(note.content)}</p>

        <!-- Prominent Saved & Edited Timestamps -->
        <div class="card-timestamps">
          <div class="timestamp-row">
            <span class="timestamp-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Saved:
            </span>
            <span class="timestamp-value" title="${Storage.formatExactDate(note.createdAt)}">
              ${Storage.formatExactDate(note.createdAt)}
            </span>
          </div>

          <div class="timestamp-row">
            <span class="timestamp-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edited:
            </span>
            <span class="timestamp-value">
              ${hasBeenEdited ? `
                <span class="edited-badge">${Storage.formatRelativeDate(note.updatedAt)}</span>
                <span title="${Storage.formatExactDate(note.updatedAt)}">${Storage.formatExactDate(note.updatedAt)}</span>
              ` : `
                <span style="opacity: 0.65;">Not edited yet</span>
              `}
            </span>
          </div>
        </div>
      </article>
    `;
  }

  // Attach card event listeners
  function attachNoteCardEvents() {
    elements.notesGrid.querySelectorAll('.note-card').forEach(card => {
      const id = card.dataset.id;
      
      // Pin / Unpin
      card.querySelector('[data-action="pin"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPinned = Storage.togglePin(state.currentUser.email, id);
        showToast(isPinned ? '📌 Note pinned to top' : 'Unpinned');
        renderNotes();
      });

      // Edit Note
      card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteEditor(id);
      });

      // Copy note text
      card.querySelector('[data-action="copy"]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const allNotes = Storage.getNotes(state.currentUser.email);
        const note = allNotes.find(n => n.id === id);
        if (note) {
          const textToCopy = `${note.title}\n\n${note.content}`;
          try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('📋 Page copied to clipboard!');
          } catch {
            showToast('Text copied!');
          }
        }
      });

      // Delete Note
      card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this page from your pocket?')) {
          Storage.deleteNote(state.currentUser.email, id);
          showToast('🗑️ Page removed');
          renderNotes();
          updateStatistics();
        }
      });

      // Clicking card body also opens editor
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-actions')) {
          openNoteEditor(id);
        }
      });
    });
  }

  // Update statistics and tab counts
  function updateStatistics() {
    if (!state.currentUser) return;
    const allNotes = Storage.getNotes(state.currentUser.email);

    const moments = allNotes.filter(n => n.category === 'moment').length;
    const memories = allNotes.filter(n => n.category === 'memory').length;
    const birthdays = allNotes.filter(n => n.category === 'birthday').length;

    elements.totalCountStat.textContent = allNotes.length;
    elements.momentsCountStat.textContent = moments;
    elements.birthdaysCountStat.textContent = birthdays;

    elements.tabCountAll.textContent = allNotes.length;
    elements.tabCountMoment.textContent = moments;
    elements.tabCountMemory.textContent = memories;
    elements.tabCountBirthday.textContent = birthdays;

    renderBirthdayWidget();
  }

  // =========================================================================
  // Note Editor Modal Management
  // =========================================================================
  function openNoteEditor(noteId = null, overrideCategory = null) {
    if (!state.currentUser) {
      openAuthModal();
      return;
    }

    state.editingNoteId = noteId;

    if (noteId) {
      // Editing existing note
      const allNotes = Storage.getNotes(state.currentUser.email);
      const note = allNotes.find(n => n.id === noteId);
      if (!note) return;

      elements.noteModalTitle.textContent = 'Edit Page';
      elements.noteTitleInput.value = note.title || '';
      elements.noteContentInput.value = note.content || '';
      elements.noteBirthdayInput.value = note.birthdayDate || '';
      elements.notePinCheckbox.checked = !!note.pinned;
      setModalCategory(note.category || 'moment');
      setModalColor(note.colorTag || 'terracotta');

      elements.editorTimestampMeta.innerHTML = `
        <span>Saved: <strong>${Storage.formatExactDate(note.createdAt)}</strong></span>
        ${note.updatedAt && (note.updatedAt - note.createdAt > 2000) ? 
          ` &bull; <span>Last edited: <strong>${Storage.formatExactDate(note.updatedAt)}</strong></span>` : ''}
      `;

      // If it's a birthday and today, trigger celebratory confetti!
      if (note.category === 'birthday' && note.birthdayDate) {
        const bInfo = Storage.calculateBirthdayInfo(note.birthdayDate);
        if (bInfo && bInfo.isToday) {
          triggerConfetti(3500);
        }
      }
    } else {
      // Creating new note
      const targetCategory = overrideCategory || (state.activeFilter !== 'all' ? state.activeFilter : 'moment');
      elements.noteModalTitle.textContent = targetCategory === 'birthday' ? 'New Birthday Page 🎂' : 'New Pocket Page';
      elements.noteTitleInput.value = '';
      elements.noteContentInput.value = '';
      elements.noteBirthdayInput.value = '';
      elements.notePinCheckbox.checked = false;
      
      setModalCategory(targetCategory);
      setModalColor(targetCategory === 'birthday' ? 'rose' : 'terracotta');

      elements.editorTimestampMeta.innerHTML = `
        <span>Will be saved on: <strong>${Storage.formatExactDate(Date.now())}</strong></span>
      `;
    }

    updateWordCounter();

    elements.noteModalBackdrop.classList.add('is-open');
    setTimeout(() => {
      if (overrideCategory === 'birthday' && !elements.noteBirthdayInput.value) {
        elements.noteBirthdayInput.focus();
      } else {
        elements.noteTitleInput.focus();
      }
    }, 150);
  }

  function closeNoteEditor() {
    elements.noteModalBackdrop.classList.remove('is-open');
    state.editingNoteId = null;
  }

  function setModalCategory(category) {
    state.selectedCategory = category;
    elements.categoryChips.forEach(chip => {
      if (chip.dataset.category === category) {
        chip.classList.add('is-selected');
        chip.querySelector('input').checked = true;
      } else {
        chip.classList.remove('is-selected');
      }
    });

    if (category === 'birthday') {
      elements.noteBirthdayBox.classList.add('show');
    } else {
      elements.noteBirthdayBox.classList.remove('show');
    }
  }

  function setModalColor(color, customName = null) {
    state.selectedColorTag = color || 'terracotta';
    
    // Update active class on dots
    let activeName = customName;
    elements.colorSwatches.forEach(dot => {
      const isMatch = dot.dataset.color === state.selectedColorTag;
      dot.classList.toggle('is-active', isMatch);
      if (isMatch && !activeName) {
        activeName = dot.dataset.name || dot.getAttribute('title') || color;
      }
    });

    // Update label
    if (elements.selectedColorLabel) {
      elements.selectedColorLabel.textContent = activeName || 'Warm Terracotta';
    }

    // Live preview: tint modal card header & borders
    if (elements.noteModalCard) {
      elements.noteModalCard.className = `modal-card accent-${state.selectedColorTag}`;
    }
  }

  // Save Note Handler
  function handleSaveNote() {
    const title = elements.noteTitleInput.value.trim();
    const content = elements.noteContentInput.value.trim();
    const birthdayDate = elements.noteBirthdayInput.value;
    const pinned = elements.notePinCheckbox.checked;

    if (!title && !content) {
      showToast('Please enter a title or write something on your page.', 'error');
      elements.noteTitleInput.focus();
      return;
    }

    if (state.selectedCategory === 'birthday' && !birthdayDate) {
      showToast('Please select the birth date for the birthday tracker.', 'error');
      elements.noteBirthdayInput.focus();
      return;
    }

    const notePayload = {
      title: title || (state.selectedCategory === 'birthday' ? 'Birthday Page' : 'Untitled Note'),
      content: content,
      category: state.selectedCategory,
      birthdayDate: state.selectedCategory === 'birthday' ? birthdayDate : null,
      colorTag: state.selectedColorTag,
      pinned: pinned
    };

    if (state.editingNoteId) {
      // Update existing
      const updated = Storage.updateNote(state.currentUser.email, state.editingNoteId, notePayload);
      if (updated) {
        showToast('✏️ Page updated successfully!');
      }
    } else {
      // Create new
      Storage.createNote(state.currentUser.email, notePayload);
      showToast('✨ Page saved to your pocket!');
    }

    // If saving a birthday that happens to be today, celebrate!
    if (state.selectedCategory === 'birthday' && birthdayDate) {
      const bInfo = Storage.calculateBirthdayInfo(birthdayDate);
      if (bInfo && bInfo.isToday) {
        setTimeout(() => triggerConfetti(4000), 250);
      }
    }

    closeNoteEditor();
    renderNotes();
    updateStatistics();
  }

  // =========================================================================
  // Authentication Modal Management
  // =========================================================================
  function openAuthModal() {
    elements.authModalBackdrop.classList.add('is-open');
    elements.loginError.textContent = '';
    elements.registerError.textContent = '';
    elements.googleAccountPicker?.classList.remove('show');
  }

  function closeAuthModal() {
    elements.authModalBackdrop.classList.remove('is-open');
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      elements.authTabLogin.classList.add('active');
      elements.authTabRegister.classList.remove('active');
      elements.authFormLogin.style.display = 'flex';
      elements.authFormRegister.style.display = 'none';
    } else {
      elements.authTabRegister.classList.add('active');
      elements.authTabLogin.classList.remove('active');
      elements.authFormRegister.style.display = 'flex';
      elements.authFormLogin.style.display = 'none';
    }
  }

  // =========================================================================
  // Setup Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Reset filters on logo click
    document.getElementById('brandLogo')?.addEventListener('click', () => {
      elements.categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      elements.categoryTabs.querySelector('[data-category="all"]')?.classList.add('active');
      state.activeFilter = 'all';
      state.searchQuery = '';
      elements.searchField.value = '';
      renderNotes();
    });

    // Search input
    elements.searchField.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderNotes();
    });

    // Sort select
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderNotes();
    });

    // Category filter tabs
    elements.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.dataset.category;
        renderNotes();
      });
    });

    // New Note Buttons
    elements.btnNewPage.addEventListener('click', () => openNoteEditor());
    elements.fabNewPage.addEventListener('click', () => openNoteEditor());

    // Note Modal Close / Cancel / Save
    elements.noteCloseBtn.addEventListener('click', closeNoteEditor);
    elements.noteCancelBtn.addEventListener('click', closeNoteEditor);
    elements.noteSaveBtn.addEventListener('click', handleSaveNote);

    // Modal background click to close
    elements.noteModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.noteModalBackdrop) closeNoteEditor();
    });
    elements.authModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.authModalBackdrop) closeAuthModal();
    });
    elements.syncModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.syncModalBackdrop) elements.syncModalBackdrop.classList.remove('is-open');
    });

    // Category chips in editor
    elements.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => setModalCategory(chip.dataset.category));
    });

    // Color swatches in editor
    elements.colorSwatches.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        setModalColor(dot.dataset.color, dot.dataset.name);
      });
    });

    // Keyboard Shortcuts: Ctrl+Enter / Cmd+Enter to save note, Esc to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNoteEditor();
        closeAuthModal();
        elements.syncModalBackdrop.classList.remove('is-open');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (elements.noteModalBackdrop.classList.contains('is-open')) {
          handleSaveNote();
        }
      }
    });

    // Note editor live word & character counter
    elements.noteContentInput?.addEventListener('input', updateWordCounter);
    elements.noteContentInput?.addEventListener('paste', () => setTimeout(updateWordCounter, 10));

    // Password visibility toggles
    setupPasswordToggle(elements.toggleLoginPass, elements.loginPassword);
    setupPasswordToggle(elements.toggleRegisterPass, elements.registerPassword);

    // Auth Modal Triggers
    elements.userBadge.addEventListener('click', openAuthModal);
    elements.authCloseBtn.addEventListener('click', closeAuthModal);
    elements.authTabLogin.addEventListener('click', () => switchAuthTab('login'));
    elements.authTabRegister.addEventListener('click', () => switchAuthTab('register'));

    // -----------------------------------------------------------------------
    // Google / Gmail Account Sign-In Handlers
    // -----------------------------------------------------------------------
    function renderGoogleAccountsList() {
      const accounts = Auth.getSavedGoogleAccounts();
      if (!elements.googleAccountsListContainer) return;

      if (accounts.length === 0) {
        elements.googleAccountsListContainer.innerHTML = `
          <div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.2rem 0;">
            No saved Gmail on this browser yet. Enter your Gmail below:
          </div>
        `;
        setTimeout(() => elements.googleCustomEmailInput?.focus(), 100);
        return;
      }

      elements.googleAccountsListContainer.innerHTML = accounts.map(acc => `
        <div class="google-account-item" data-email="${escapeHtml(acc.email)}" data-name="${escapeHtml(acc.name)}">
          <div class="google-avatar">${escapeHtml(Auth.getAvatarInitials(acc.name || acc.email))}</div>
          <div class="google-account-info">
            <span class="google-account-name">${escapeHtml(acc.name || 'Google Account')}</span>
            <span class="google-account-email">${escapeHtml(acc.email)}</span>
          </div>
        </div>
      `).join('');

      // Click to sign in with saved Google account
      elements.googleAccountsListContainer.querySelectorAll('.google-account-item').forEach(item => {
        item.addEventListener('click', async () => {
          const email = item.dataset.email;
          const name = item.dataset.name;
          const res = await Auth.loginWithGoogle(email, name);
          if (res.success) {
            showToast(`Signed in with Google (${res.user.email}) ✨`);
            closeAuthModal();
            updateUserInterface();
            renderNotes();
            updateStatistics();
          }
        });
      });
    }

    elements.btnGoogleSignIn?.addEventListener('click', () => {
      elements.googleAccountPicker.classList.toggle('show');
      if (elements.googleAccountPicker.classList.contains('show')) {
        renderGoogleAccountsList();
      }
    });

    elements.btnCloseGooglePicker?.addEventListener('click', () => {
      elements.googleAccountPicker.classList.remove('show');
    });

    async function handleGoogleCustomSignIn() {
      let email = elements.googleCustomEmailInput.value.trim();
      if (!email) {
        showToast('Please enter your Gmail address.', 'error');
        elements.googleCustomEmailInput.focus();
        return;
      }
      if (!email.includes('@')) {
        email += '@gmail.com';
      }
      const res = await Auth.loginWithGoogle(email);
      if (res.success) {
        showToast(`Signed in as ${res.user.email} ✨`);
        closeAuthModal();
        updateUserInterface();
        renderNotes();
        updateStatistics();
      } else {
        showToast(res.message, 'error');
      }
    }

    elements.btnConfirmGoogleCustom?.addEventListener('click', handleGoogleCustomSignIn);
    elements.googleCustomEmailInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGoogleCustomSignIn();
      }
    });

    // Helper: Append @gmail.com to input on pill click
    function appendGmailToInput(inputElement) {
      if (!inputElement) return;
      let val = inputElement.value.trim();
      if (!val) {
        inputElement.value = '@gmail.com';
        inputElement.setSelectionRange(0, 0);
      } else if (!val.includes('@')) {
        inputElement.value = val + '@gmail.com';
      } else {
        const prefix = val.split('@')[0];
        inputElement.value = prefix + '@gmail.com';
      }
      inputElement.focus();
    }

    elements.pillAppendGmailGoogle?.addEventListener('click', () => appendGmailToInput(elements.googleCustomEmailInput));
    elements.pillLoginGmail?.addEventListener('click', () => appendGmailToInput(elements.loginEmail));
    elements.pillRegisterGmail?.addEventListener('click', () => appendGmailToInput(elements.registerEmail));

    // Handle Login Submit
    elements.authFormLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      elements.loginError.textContent = '';
      const email = elements.loginEmail.value;
      const pass = elements.loginPassword.value;

      const res = await Auth.login(email, pass);
      if (res.success) {
        showToast(`Welcome back, ${res.user.name || res.user.email}!`);
        closeAuthModal();
        updateUserInterface();
        renderNotes();
        updateStatistics();
      } else {
        elements.loginError.textContent = res.message;
      }
    });

    // Handle Register Submit
    elements.authFormRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      elements.registerError.textContent = '';
      const name = elements.registerName.value;
      const email = elements.registerEmail.value;
      const pass = elements.registerPassword.value;

      const res = await Auth.register(email, pass, name);
      if (res.success) {
        showToast(`Account created! Welcome to PocketPages.`);
        closeAuthModal();
        updateUserInterface();
        renderNotes();
        updateStatistics();
      } else {
        elements.registerError.textContent = res.message;
      }
    });

    // Logout
    elements.btnLogout.addEventListener('click', () => {
      Auth.logout();
      showToast('Logged out of PocketPages.');
      closeAuthModal();
      updateUserInterface();
      renderNotes();
      updateStatistics();
    });

    // Switch Account
    elements.btnSwitchAccount.addEventListener('click', () => {
      Auth.logout();
      closeAuthModal();
      updateUserInterface();
      switchAuthTab('login');
      showToast('Please sign into your other account.');
    });

    // Mobile Sync Modal Triggers
    elements.btnSyncModal.addEventListener('click', () => {
      detectLocalIpPlaceholder();
      elements.syncModalBackdrop.classList.add('is-open');
    });
    elements.syncCloseBtn.addEventListener('click', () => {
      elements.syncModalBackdrop.classList.remove('is-open');
    });

    // Export JSON Backup
    elements.btnExportJSON.addEventListener('click', () => {
      if (!state.currentUser) return;
      const jsonStr = Storage.exportNotesJSON(state.currentUser.email);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocketpages_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Backup file downloaded. You can transfer this to your phone!');
    });

    // Import JSON Backup
    elements.btnImportJSON.addEventListener('click', () => {
      elements.importFileInput.click();
    });

    elements.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = Storage.importNotesJSON(state.currentUser.email, event.target.result);
        if (result.success) {
          showToast(`✨ Successfully imported notes!`);
          renderNotes();
          updateStatistics();
          elements.syncModalBackdrop.classList.remove('is-open');
        } else {
          showToast(`Error importing: ${result.error}`, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Helper to escape HTML tags to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  init();
});
