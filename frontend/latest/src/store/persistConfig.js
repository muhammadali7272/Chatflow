// Custom storage wrapper for redux-persist
const createPersistStorage = () => {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;
  
  return {
    getItem: (key) => {
      return new Promise((resolve) => {
        if (!storage) return resolve(null);
        try {
          const value = storage.getItem(key);
          resolve(value);
        } catch {
          resolve(null);
        }
      });
    },
    setItem: (key, value) => {
      return new Promise((resolve) => {
        if (!storage) return resolve();
        try {
          storage.setItem(key, value);
          resolve();
        } catch {
          resolve();
        }
      });
    },
    removeItem: (key) => {
      return new Promise((resolve) => {
        if (!storage) return resolve();
        try {
          storage.removeItem(key);
          resolve();
        } catch {
          resolve();
        }
      });
    },
  };
};

const storage = createPersistStorage();

export const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};
