import { Monster, MonsterTemplate } from '../types';
import { monsters as predefinedMonsters } from './monsterData';

export const DB_STORAGE_KEY = 'swade_monsters_database_v2';
export const LEGACY_CUSTOM_KEY = 'customMonsters';
export const FAVORITES_KEY = 'favoriteMonsters';
export const DB_METADATA_KEY = 'swade_monsters_db_metadata';

export interface StorageMetadata {
  lastUpdated: string;
  totalMonsters: number;
  customCount: number;
  version: number;
}

export interface StorageMetrics {
  totalCount: number;
  customCount: number;
  predefinedCount: number;
  favoritesCount: number;
  approximateBytes: number;
  formattedSize: string;
  lastUpdated: string;
  isOfflineReady: boolean;
}

// Function to convert a file to a Base64 string for offline storage
export const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

// Format bytes into human-readable string (KB, MB)
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Initializes the full monster database in localStorage if not present.
 * Seeds with predefined monsters and preserves any existing custom monsters.
 */
export const initLocalMonsterDatabase = (): Monster[] => {
  try {
    const storedDb = localStorage.getItem(DB_STORAGE_KEY);
    if (storedDb) {
      const parsed = JSON.parse(storedDb);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Seed for the first time: merge predefined and legacy custom monsters
    const legacyCustom = getCustomMonsters();
    const mergedMap = new Map<string, Monster>();

    // Add predefined monsters first
    predefinedMonsters.forEach(m => {
      mergedMap.set(m.id, { ...m });
    });

    // Add or override with existing custom monsters
    legacyCustom.forEach(m => {
      mergedMap.set(m.id, { ...m });
    });

    const initialList = Array.from(mergedMap.values());
    saveAllLocalMonsters(initialList);
    return initialList;
  } catch (error) {
    console.error('Error initializing local monster database:', error);
    return predefinedMonsters;
  }
};

/**
 * Retrieves the complete list of monsters from localStorage.
 */
export const getAllLocalMonsters = (): Monster[] => {
  try {
    const stored = localStorage.getItem(DB_STORAGE_KEY);
    if (!stored) {
      return initLocalMonsterDatabase();
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initLocalMonsterDatabase();
    }
    return parsed;
  } catch (error) {
    console.error('Error reading all monsters from localStorage:', error);
    return initLocalMonsterDatabase();
  }
};

/**
 * Persists the entire array of monsters to localStorage.
 */
export const saveAllLocalMonsters = (monstersList: Monster[]): void => {
  try {
    const json = JSON.stringify(monstersList);
    localStorage.setItem(DB_STORAGE_KEY, json);

    // Keep custom monsters in legacy key for backward compatibility
    const customList = monstersList.filter(
      m => m.sourcebook === 'Custom Creations' || m.sourcebook === 'Criações Próprias' || m.id.startsWith('custom-') || m.id.startsWith('imported-')
    );
    localStorage.setItem(LEGACY_CUSTOM_KEY, JSON.stringify(customList));

    // Save metadata
    const metadata: StorageMetadata = {
      lastUpdated: new Date().toISOString(),
      totalMonsters: monstersList.length,
      customCount: customList.length,
      version: 2
    };
    localStorage.setItem(DB_METADATA_KEY, JSON.stringify(metadata));

    // Broadcast local storage update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swade_monsters_updated', { detail: { count: monstersList.length } }));
    }
  } catch (error) {
    console.error('Error saving all monsters to localStorage:', error);
  }
};

/**
 * Saves or updates a single monster in the local database.
 */
export const saveOrUpdateMonster = (monster: Monster): Monster[] => {
  const current = getAllLocalMonsters();
  const index = current.findIndex(m => m.id === monster.id);

  if (index > -1) {
    current[index] = { ...monster };
  } else {
    current.push({ ...monster });
  }

  saveAllLocalMonsters(current);
  return current;
};

/**
 * Deletes a monster from the local database by ID.
 */
export const deleteMonsterFromStorage = (monsterId: string): Monster[] => {
  let current = getAllLocalMonsters();
  current = current.filter(m => m.id !== monsterId);
  saveAllLocalMonsters(current);

  // Also remove from favorites if present
  const favorites = getFavoriteMonsterIds();
  if (favorites.includes(monsterId)) {
    const updatedFavs = favorites.filter(id => id !== monsterId);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
    } catch (e) {
      console.error('Error updating favorites on monster delete:', e);
    }
  }

  return current;
};

/**
 * Duplicates a monster creating a customizable clone.
 */
export const duplicateMonster = (monsterId: string): Monster | null => {
  const current = getAllLocalMonsters();
  const original = current.find(m => m.id === monsterId);
  if (!original) return null;

  const clone: Monster = {
    ...original,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${original.name} (Cópia)`,
    sourcebook: 'Criações Próprias'
  };

  current.push(clone);
  saveAllLocalMonsters(current);
  return clone;
};

/**
 * Resets the database to baseline monsters, optionally retaining user creations.
 */
export const resetDatabaseToDefaults = (keepCustomCreations: boolean = true): Monster[] => {
  try {
    const mergedMap = new Map<string, Monster>();

    // Baseline official monsters
    predefinedMonsters.forEach(m => {
      mergedMap.set(m.id, { ...m });
    });

    if (keepCustomCreations) {
      const current = getAllLocalMonsters();
      const customOnes = current.filter(
        m => m.sourcebook === 'Custom Creations' || m.sourcebook === 'Criações Próprias' || m.id.startsWith('custom-') || m.id.startsWith('imported-')
      );
      customOnes.forEach(m => {
        mergedMap.set(m.id, { ...m });
      });
    }

    const resetList = Array.from(mergedMap.values());
    saveAllLocalMonsters(resetList);
    return resetList;
  } catch (error) {
    console.error('Error resetting database to defaults:', error);
    return predefinedMonsters;
  }
};

/**
 * Gets storage usage metrics and status.
 */
export const getStorageMetrics = (): StorageMetrics => {
  const all = getAllLocalMonsters();
  const custom = all.filter(
    m => m.sourcebook === 'Custom Creations' || m.sourcebook === 'Criações Próprias' || m.id.startsWith('custom-') || m.id.startsWith('imported-')
  );
  const favorites = getFavoriteMonsterIds();

  let bytes = 0;
  try {
    const dbStr = localStorage.getItem(DB_STORAGE_KEY) || '';
    const favStr = localStorage.getItem(FAVORITES_KEY) || '';
    const metaStr = localStorage.getItem(DB_METADATA_KEY) || '';
    bytes = (dbStr.length + favStr.length + metaStr.length) * 2; // Approximate UTF-16 size in bytes
  } catch {
    bytes = 0;
  }

  let lastUpdated = 'Hoje';
  try {
    const metaJson = localStorage.getItem(DB_METADATA_KEY);
    if (metaJson) {
      const meta = JSON.parse(metaJson);
      if (meta.lastUpdated) {
        lastUpdated = new Date(meta.lastUpdated).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  } catch {
    // ignore
  }

  return {
    totalCount: all.length,
    customCount: custom.length,
    predefinedCount: all.length - custom.length,
    favoritesCount: favorites.length,
    approximateBytes: bytes,
    formattedSize: formatBytes(bytes),
    lastUpdated,
    isOfflineReady: true
  };
};

/**
 * Exports the complete database (predefined + custom) as formatted JSON.
 */
export const exportFullDatabaseAsJson = (): string => {
  const all = getAllLocalMonsters();
  const favorites = getFavoriteMonsterIds();
  return JSON.stringify({
    source: "Grimório Bestiário Savage Worlds",
    version: "2.5",
    exportDate: new Date().toISOString(),
    totalMonsters: all.length,
    favorites,
    monsters: all
  }, null, 2);
};

/**
 * Imports and merges or replaces the entire local database from a JSON file.
 */
export const importFullDatabaseFromJson = (
  jsonString: string,
  mode: 'merge' | 'replace' = 'merge'
): { success: boolean; count: number; message: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    const importedList: Monster[] = Array.isArray(parsed) ? parsed : (parsed.monsters || []);

    if (!Array.isArray(importedList) || importedList.length === 0) {
      return { success: false, count: 0, message: "Nenhum monstro válido encontrado no arquivo JSON." };
    }

    // Validate structure
    const validMonsters = importedList.filter(item => item && item.name && item.attributes);
    if (validMonsters.length === 0) {
      return { success: false, count: 0, message: "Os registros no arquivo JSON não possuem os atributos obrigatórios de Savage Worlds." };
    }

    let finalList: Monster[];

    if (mode === 'replace') {
      finalList = validMonsters;
    } else {
      // Merge mode
      const map = new Map<string, Monster>();
      const current = getAllLocalMonsters();

      current.forEach(m => map.set(m.id, m));
      validMonsters.forEach(m => {
        const id = m.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        map.set(id, { ...m, id });
      });

      finalList = Array.from(map.values());
    }

    // If favorites are included in backup, optionally restore them
    if (parsed.favorites && Array.isArray(parsed.favorites)) {
      try {
        const currentFavs = getFavoriteMonsterIds();
        const mergedFavs = Array.from(new Set([...currentFavs, ...parsed.favorites]));
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavs));
      } catch (e) {
        console.error('Error restoring favorites from import:', e);
      }
    }

    saveAllLocalMonsters(finalList);
    return {
      success: true,
      count: validMonsters.length,
      message: `${validMonsters.length} monstros processados com sucesso no banco de dados local!`
    };
  } catch (err: any) {
    return { success: false, count: 0, message: `Erro ao importar JSON: ${err.message}` };
  }
};

// ==========================================
// Backward-compatible functions for existing codebase
// ==========================================

export const getCustomMonsters = (): Monster[] => {
  try {
    const monstersJson = localStorage.getItem(LEGACY_CUSTOM_KEY);
    return monstersJson ? JSON.parse(monstersJson) : [];
  } catch (error) {
    console.error("Error reading custom monsters from localStorage:", error);
    return [];
  }
};

export const saveCustomMonsters = (monstersList: Monster[]): void => {
  try {
    localStorage.setItem(LEGACY_CUSTOM_KEY, JSON.stringify(monstersList));
    // Also sync with all local monsters
    const all = getAllLocalMonsters();
    const nonCustom = all.filter(
      m => m.sourcebook !== 'Custom Creations' && m.sourcebook !== 'Criações Próprias' && !m.id.startsWith('custom-') && !m.id.startsWith('imported-')
    );
    saveAllLocalMonsters([...nonCustom, ...monstersList]);
  } catch (error) {
    console.error("Error saving custom monsters to localStorage:", error);
  }
};

export const getFavoriteMonsterIds = (): string[] => {
  try {
    const favs = localStorage.getItem(FAVORITES_KEY);
    return favs ? JSON.parse(favs) : [];
  } catch {
    return [];
  }
};

export const toggleFavoriteMonster = (monsterId: string): string[] => {
  const favorites = getFavoriteMonsterIds();
  const index = favorites.indexOf(monsterId);
  let updated: string[];
  if (index > -1) {
    updated = favorites.filter(id => id !== monsterId);
  } else {
    updated = [...favorites, monsterId];
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving favorites", e);
  }
  return updated;
};

export const exportCustomMonstersAsJson = (): string => {
  return exportFullDatabaseAsJson();
};

export const importCustomMonstersFromJson = (jsonString: string): { success: boolean; count: number; message: string } => {
  return importFullDatabaseFromJson(jsonString, 'merge');
};

export const addCustomMonster = async (monsterTemplate: MonsterTemplate, imageFile?: File): Promise<void> => {
  let imageUrl = monsterTemplate.imageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80";

  if (imageFile) {
    imageUrl = await toBase64(imageFile);
  }
  
  const newMonster: Monster = {
    id: monsterTemplate.id || `custom-${new Date().getTime()}`,
    name: monsterTemplate.name,
    race: monsterTemplate.race,
    archetype: monsterTemplate.archetype,
    isWildCard: monsterTemplate.isWildCard ?? false,
    imageUrl: imageUrl,
    attributes: monsterTemplate.attributes,
    skills: typeof monsterTemplate.skills === 'string' 
      ? monsterTemplate.skills.split(',').map(s => s.trim()).filter(s => s)
      : monsterTemplate.skills,
    movement: monsterTemplate.movement,
    parry: monsterTemplate.parry,
    toughness: monsterTemplate.toughness,
    size: monsterTemplate.size,
    abilities: monsterTemplate.abilities || [],
    advantages: monsterTemplate.advantages ? (typeof monsterTemplate.advantages === 'string' ? monsterTemplate.advantages.split(',').map(s => s.trim()).filter(s => s) : monsterTemplate.advantages) : [],
    complications: monsterTemplate.complications ? (typeof monsterTemplate.complications === 'string' ? monsterTemplate.complications.split(',').map(s => s.trim()).filter(s => s) : monsterTemplate.complications) : [],
    weapons: monsterTemplate.weapons,
    history: monsterTemplate.history,
    sourcebook: monsterTemplate.sourcebook || "Criações Próprias",
  };

  saveOrUpdateMonster(newMonster);
};

export const deleteCustomMonster = (monsterId: string): void => {
  deleteMonsterFromStorage(monsterId);
};
