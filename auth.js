/**
 * PocketPages - Authentication & Account Management
 * Handles user credentials, session state, password hashing, and multi-device access
 */

const Auth = (function () {
  const USERS_REGISTRY_KEY = 'pocketpages_users_registry';
  const ACTIVE_SESSION_KEY = 'pocketpages_active_session';
  const GOOGLE_ACCOUNTS_KEY = 'pocketpages_google_accounts';

  // Get saved Google / Gmail accounts on this device
  function getSavedGoogleAccounts() {
    try {
      const data = localStorage.getItem(GOOGLE_ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // Save a Google/Gmail account to device list
  function saveGoogleAccount(email, name) {
    const list = getSavedGoogleAccounts();
    const existingIndex = list.findIndex(acc => acc.email === email);
    if (existingIndex !== -1) {
      list[existingIndex].name = name;
    } else {
      list.unshift({ email, name });
    }
    try {
      localStorage.setItem(GOOGLE_ACCOUNTS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  // Sign in or register with Google / Gmail
  async function loginWithGoogle(rawEmail, rawName) {
    let email = (rawEmail || '').trim().toLowerCase();
    if (!email) {
      return { success: false, message: 'Please enter your Gmail address.' };
    }
    // If user only typed username (e.g. "alex"), auto-append @gmail.com
    if (!email.includes('@')) {
      email = `${email}@gmail.com`;
    }

    const defaultName = email.split('@')[0];
    const name = (rawName || defaultName).trim();

    const registry = getUsersRegistry();
    if (!registry[email]) {
      // First time this Google account signs in: create fresh record
      registry[email] = {
        email: email,
        name: name,
        authProvider: 'google',
        createdAt: Date.now()
      };
      setUsersRegistry(registry);
      
      // Ensure notes start completely fresh
      try {
        if (!localStorage.getItem(`pocketpages_notes_${email}`)) {
          localStorage.setItem(`pocketpages_notes_${email}`, JSON.stringify([]));
        }
      } catch (e) {}
    }

    saveGoogleAccount(email, registry[email].name || name);

    const userSession = {
      email: email,
      name: registry[email].name || name,
      authProvider: 'google'
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(userSession));

    return { success: true, user: userSession };
  }

  // Simple secure SHA-256 hashing using browser Web Crypto API
  async function hashPassword(plainPassword) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword + '_pocketpages_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Load registered users database
  function getUsersRegistry() {
    try {
      const data = localStorage.getItem(USERS_REGISTRY_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed reading user registry', e);
      return {};
    }
  }

  // Save registered users database
  function setUsersRegistry(registry) {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error('Failed saving user registry', e);
    }
  }

  // Get active logged-in user
  function getCurrentUser() {
    try {
      const sessionData = localStorage.getItem(ACTIVE_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (e) {
      return null;
    }
  }

  // Register a new user
  async function register(email, password, name) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0] || 'Friend').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 5) {
      return { success: false, message: 'Password must be at least 5 characters long.' };
    }

    const registry = getUsersRegistry();
    if (registry[cleanEmail]) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    const passwordHash = await hashPassword(password);
    registry[cleanEmail] = {
      email: cleanEmail,
      name: cleanName,
      passwordHash: passwordHash,
      createdAt: Date.now()
    };
    setUsersRegistry(registry);

    // Initialize completely empty notes for this new account
    try {
      localStorage.setItem(`pocketpages_notes_${cleanEmail}`, JSON.stringify([]));
    } catch (e) {}

    // Automatically set as active session
    const userSession = { email: cleanEmail, name: cleanName };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(userSession));

    return { success: true, user: userSession };
  }

  // Sign in existing user
  async function login(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, message: 'Please provide both email and password.' };
    }

    const registry = getUsersRegistry();
    const userRecord = registry[cleanEmail];

    if (!userRecord) {
      return { success: false, message: 'No account found with this email. Please register first.' };
    }

    const passwordHash = await hashPassword(password);
    if (userRecord.passwordHash !== passwordHash) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const userSession = {
      email: userRecord.email,
      name: userRecord.name || userRecord.email.split('@')[0]
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(userSession));

    return { success: true, user: userSession };
  }

  // Log out current user
  function logout() {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return true;
  }

  // Get initial letters for avatar
  function getAvatarInitials(name) {
    if (!name) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return {
    getCurrentUser,
    register,
    login,
    loginWithGoogle,
    getSavedGoogleAccounts,
    logout,
    getAvatarInitials
  };
})();
