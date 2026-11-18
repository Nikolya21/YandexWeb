import { Material, CreateMaterialDto, FeedbackEntry } from '../types/campus';

const MATERIALS_KEY = 'campusnode_materials';
const STARRED_KEY = 'campusnode_starred_ids';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const readMaterials = (): Material[] => {
  const raw = localStorage.getItem(MATERIALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Material[];
  } catch {
    return [];
  }
};

const readStarredIds = (): string[] => {
  const raw = localStorage.getItem(STARRED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
};

export const materialsApi = {
  async getAll(simulateError = false): Promise<{ materials: Material[]; starredIds: string[] }> {
    await delay(300);
    if (simulateError) {
      throw new Error('Ошибка загрузки материалов (503 Service Unavailable)');
    }
    return {
      materials: readMaterials(),
      starredIds: readStarredIds(),
    };
  },

  async create(dto: CreateMaterialDto): Promise<Material> {
    await delay(200);
    const materials = readMaterials();
    const newMaterial: Material = {
      ...dto,
      id: `file-${Date.now()}`,
      starsCount: 0,
      typos: [],
      reports: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newMaterial, ...materials];
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
    return newMaterial;
  },

  async delete(id: string): Promise<string> {
    await delay(200);
    const materials = readMaterials();
    const updated = materials.filter((item) => item.id !== id);
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
    return id;
  },

  async toggleStar(materialId: string): Promise<{ material: Material; starredIds: string[] }> {
    await delay(100);
    const materials = readMaterials();
    const starredIds = readStarredIds();

    const isAlreadyStarred = starredIds.includes(materialId);
    const nextStarredIds = isAlreadyStarred
      ? starredIds.filter((id) => id !== materialId)
      : [...starredIds, materialId];

    let targetMaterial: Material | undefined;

    const updatedMaterials = materials.map((item) => {
      if (item.id === materialId) {
        targetMaterial = {
          ...item,
          starsCount: isAlreadyStarred ? Math.max(0, item.starsCount - 1) : item.starsCount + 1,
        };
        return targetMaterial;
      }
      return item;
    });

    if (!targetMaterial) throw new Error('Файл не найден');

    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updatedMaterials));
    localStorage.setItem(STARRED_KEY, JSON.stringify(nextStarredIds));

    return { material: targetMaterial, starredIds: nextStarredIds };
  },

  async addTypo(materialId: string, text: string, authorName: string): Promise<Material> {
    await delay(150);
    const materials = readMaterials();
    let targetMaterial: Material | undefined;

    const newEntry: FeedbackEntry = {
      id: `typo-${Date.now()}`,
      text,
      authorName,
      createdAt: new Date().toISOString(),
    };

    const updated = materials.map((item) => {
      if (item.id === materialId) {
        targetMaterial = {
          ...item,
          typos: [newEntry, ...(item.typos || [])],
        };
        return targetMaterial;
      }
      return item;
    });

    if (!targetMaterial) throw new Error('Файл не найден');
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
    return targetMaterial;
  },

  async addReport(materialId: string, text: string, authorName: string): Promise<Material> {
    await delay(150);
    const materials = readMaterials();
    let targetMaterial: Material | undefined;

    const newEntry: FeedbackEntry = {
      id: `rep-${Date.now()}`,
      text,
      authorName,
      createdAt: new Date().toISOString(),
    };

    const updated = materials.map((item) => {
      if (item.id === materialId) {
        targetMaterial = {
          ...item,
          reports: [newEntry, ...(item.reports || [])],
        };
        return targetMaterial;
      }
      return item;
    });

    if (!targetMaterial) throw new Error('Файл не найден');
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
    return targetMaterial;
  },
};
