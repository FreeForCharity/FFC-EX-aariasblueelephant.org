import re

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'r') as f:
    code = f.read()

idb_logic = """
const DB_NAME = 'ABE_FriendsDB';
const STORE_NAME = 'entries';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveEntriesToDB = async (entries: FriendEntry[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Clear and re-insert
    store.clear();
    entries.forEach(e => store.put(e));
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.error("IndexedDB save failed", err);
  }
};

const getEntriesFromDB = async (): Promise<FriendEntry[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB load failed", err);
    return [];
  }
};
"""

code = code.replace("const STORAGE_KEY = 'circleOfFriendsEntries';", "const STORAGE_KEY = 'circleOfFriendsEntries';\n" + idb_logic)

# Replace the saveEntries function
old_save = """  const saveEntries = (newEntries: FriendEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  };"""

new_save = """  const saveEntries = async (newEntries: FriendEntry[]) => {
    setEntries(newEntries);
    
    // Save to IndexedDB
    await saveEntriesToDB(newEntries);

    // Attempt to save to LocalStorage for fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (e) {
      console.warn("LocalStorage quota exceeded, relying purely on IndexedDB");
    }
  };"""

code = code.replace(old_save, new_save)

# Replace the useEffect
old_use_effect = """  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local entries", e);
      }
    }
  }, []);"""

new_use_effect = """  useEffect(() => {
    const loadData = async () => {
      try {
        const dbEntries = await getEntriesFromDB();
        if (dbEntries && dbEntries.length > 0) {
          setEntries(dbEntries);
        } else {
          // Fallback to localStorage for migration
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setEntries(parsed);
            await saveEntriesToDB(parsed); // Migrate
          }
        }
      } catch (e) {
        console.error("Failed to load entries", e);
      }
    };
    loadData();
  }, []);"""

code = code.replace(old_use_effect, new_use_effect)

# Drop image dimensions to save space
code = code.replace("const MAX_WIDTH = 800;", "const MAX_WIDTH = 600;")
code = code.replace("const MAX_HEIGHT = 800;", "const MAX_HEIGHT = 600;")
code = code.replace("canvas.toDataURL('image/jpeg', 0.6)", "canvas.toDataURL('image/jpeg', 0.5)")

with open('/Users/aj/Desktop/ABE_Website/pages/CircleOfFriends.tsx', 'w') as f:
    f.write(code)

