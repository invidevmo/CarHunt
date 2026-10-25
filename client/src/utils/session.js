const STORAGE_KEY_PLAYER_ID = 'carhunt_player_id';
const STORAGE_KEY_CURRENT_ROOM = 'carhunt_current_room';

export function getOrCreatePlayerId() {
  let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
  }
  return id;
}

export function saveCurrentRoom(roomCode) {
  if (roomCode) {
    localStorage.setItem(STORAGE_KEY_CURRENT_ROOM, roomCode);
  }
}

export function getCurrentRoom() {
  return localStorage.getItem(STORAGE_KEY_CURRENT_ROOM) || null;
}

export function clearCurrentRoom() {
  localStorage.removeItem(STORAGE_KEY_CURRENT_ROOM);
}
