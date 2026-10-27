/**
 * PocketPages - Storage & Sync Layer
 * Manages note CRUD, timestamps, local accounts, and optional cloud sync
 */

const Storage = (function () {
  const STORAGE_KEY_PREFIX = 'pocketpages_notes_';
  const SETTINGS_KEY = 'pocketpages_cloud_settings';

  // Format date nicely (e.g. "Oct 23, 2026, 10:20 PM")
  function formatExactDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  // Format relative time (e.g. "just now", "5m ago", "2h ago", "yesterday")
  function formatRelativeDate(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 45) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;

    return formatExactDate(timestamp).split(',')[0]; // e.g. "Oct 23"
  }

  // Calculate birthday countdown and next age
  function calculateBirthdayInfo(birthdayDateStr) {
    if (!birthdayDateStr) return null;
    const parts = birthdayDateStr.split('-');
    if (parts.length !== 3) return null;

    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nextAge = nextBirthday.getFullYear() - birthYear;

    let countdownText = '';
    let isToday = false;

    if (daysUntil === 0) {
      countdownText = '🎉 Birthday is TODAY!';
      isToday = true;
    } else if (daysUntil === 1) {
      countdownText = '🎂 Tomorrow!';
    } else {
      countdownText = `🎂 In ${daysUntil} days`;
    }

    return {
      daysUntil,
      nextAge,
      countdownText,
      isToday,
      birthDateFormatted: new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric'
      }).format(new Date(birthYear, birthMonth, birthDay))
    };
  }

  // Get current user's storage key
  function getUserStorageKey(userId) {
    return `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  }

  // Load notes for a specific user
  function getNotes(userId) {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(getUserStorageKey(userId));
      if (!data) return []; // Completely fresh & empty for every new account
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
      return [];
    }
  }

  // Save full notes array for user
  function setNotes(userId, notes) {
    try {
      localStorage.setItem(getUserStorageKey(userId), JSON.stringify(notes));
      return true;
    } catch (e) {
      console.error('Failed to write notes to localStorage', e);
      return false;
    }
  }

  // Create a new note
  function createNote(userId, noteData) {
    const notes = getNotes(userId);
    const now = Date.now();

    const newNote = {
      id: 'page_' + now + '_' + Math.random().toString(36).substring(2, 7),
      userId: userId,
      title: noteData.title.trim() || 'Untitled Page',
      content: noteData.content.trim(),
      category: noteData.category || 'moment', // 'moment' | 'memory' | 'birthday' | 'general'
      birthdayDate: noteData.birthdayDate || null,
      colorTag: noteData.colorTag || 'terracotta',
      pinned: !!noteData.pinned,
      createdAt: now,
      updatedAt: now,
      createdFormatted: formatExactDate(now),
      updatedFormatted: formatExactDate(now)
    };

    notes.unshift(newNote); // Prepend new note
    setNotes(userId, notes);
    return newNote;
  }

  // Update existing note
  function updateNote(userId, noteId, updatedFields) {
    const notes = getNotes(userId);
    const index = notes.findIndex(n => n.id === noteId);

    if (index === -1) return null;

    const now = Date.now();
    const existing = notes[index];

    const updatedNote = {
      ...existing,
      ...updatedFields,
      title: (updatedFields.title !== undefined ? updatedFields.title : existing.title).trim() || 'Untitled Page',
      content: (updatedFields.content !== undefined ? updatedFields.content : existing.content).trim(),
      updatedAt: now,
      updatedFormatted: formatExactDate(now)
    };

    notes[index] = updatedNote;
    setNotes(userId, notes);
    return updatedNote;
  }

  // Delete note
  function deleteNote(userId, noteId) {
    const notes = getNotes(userId);
    const filtered = notes.filter(n => n.id !== noteId);
    setNotes(userId, filtered);
    return true;
  }

  // Toggle pin
  function togglePin(userId, noteId) {
    const notes = getNotes(userId);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.pinned = !note.pinned;
      setNotes(userId, notes);
      return note.pinned;
    }
    return false;
  }

  // Export notes to JSON string (for mobile backup/transfer)
  function exportNotesJSON(userId) {
    const notes = getNotes(userId);
    return JSON.stringify({
      app: 'PocketPages',
      version: '1.0',
      userId: userId,
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes: notes
    }, null, 2);
  }

  // Import notes from JSON string
  function importNotesJSON(userId, jsonString, mode = 'merge') {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.notes)) {
        throw new Error('Invalid PocketPages backup file format.');
      }

      let currentNotes = getNotes(userId);

      if (mode === 'replace') {
        currentNotes = data.notes;
      } else {
        // Merge without duplicate IDs
        const existingIds = new Set(currentNotes.map(n => n.id));
        data.notes.forEach(importedNote => {
          if (!existingIds.has(importedNote.id)) {
            currentNotes.unshift(importedNote);
          }
        });
      }

      setNotes(userId, currentNotes);
      return { success: true, count: currentNotes.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    exportNotesJSON,
    importNotesJSON,
    formatExactDate,
    formatRelativeDate,
    calculateBirthdayInfo
  };
})();
