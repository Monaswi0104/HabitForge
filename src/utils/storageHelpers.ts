// Placeholder for storage helpers
// If you plan to use AsyncStorage, run:
// npm install @react-native-async-storage/async-storage
// And uncomment/implement the methods.

export const saveData = async <T,>(key: string, value: T): Promise<boolean> => {
  console.warn(`[storageHelpers] Placeholder called for saveData(${key})`);
  return true;
};

export const loadData = async <T,>(key: string): Promise<T | null> => {
  console.warn(`[storageHelpers] Placeholder called for loadData(${key})`);
  return null;
};

export const removeData = async (key: string): Promise<boolean> => {
  return true;
};

export const clearAllData = async (): Promise<boolean> => {
  return true;
};
