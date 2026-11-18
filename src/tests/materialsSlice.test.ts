import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import materialsReducer, {
  fetchMaterials,
  createMaterial,
  deleteMaterial,
  toggleStar,
  submitTypo,
  submitReport,
} from '../store/materialsSlice';
import { Material } from '../types/campus';

const mockMaterial: Material = {
  id: 'file-1',
  subjectId: 'subj-1',
  authorName: 'Николя Хачатрян',
  authorEmail: 'nikolya@phystech.edu',
  fileName: 'lecture_1.pdf',
  fileSize: '1.2 МБ',
  fileExtension: 'PDF',
  starsCount: 0,
  typos: [],
  reports: [],
  createdAt: '2026-11-17T10:00:00Z',
};

describe('materialsSlice — редьюсеры и асинхронные Thunk-экшены', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('добавляет новый файл в начало списка при createMaterial.fulfilled', () => {
    const initialState = {
      items: [],
      starredIds: [],
      status: 'succeeded' as const,
      error: null,
    };

    const nextState = materialsReducer(initialState, {
      type: createMaterial.fulfilled.type,
      payload: mockMaterial,
    });

    expect(nextState.items).toHaveLength(1);
    const [firstItem] = nextState.items;
    expect(firstItem?.id).toBe('file-1');
  });

  it('обновляет счетчик звезд и массив starredIds при toggleStar.fulfilled', () => {
    const initialState = {
      items: [mockMaterial],
      starredIds: [],
      status: 'succeeded' as const,
      error: null,
    };

    const nextState = materialsReducer(initialState, {
      type: toggleStar.fulfilled.type,
      payload: {
        material: { ...mockMaterial, starsCount: 1 },
        starredIds: ['file-1'],
      },
    });

    const [firstItem] = nextState.items;
    expect(firstItem?.starsCount).toBe(1);
    expect(nextState.starredIds).toEqual(['file-1']);
  });

  it('обрабатывает ошибку загрузки при fetchMaterials(true)', async () => {
    const store = configureStore({
      reducer: { materials: materialsReducer },
    });

    await store.dispatch(fetchMaterials(true));

    const state = store.getState().materials;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Ошибка загрузки материалов (503 Service Unavailable)');
  });

  it('полный жизненный цикл через dispatch: создание, лайк, опечатка, жалоба и удаление', async () => {
    const store = configureStore({
      reducer: { materials: materialsReducer },
    });

    // 1. Создаем файл через Thunk
    const createdAction = await store.dispatch(
      createMaterial({
        subjectId: 'subj-1',
        authorName: 'Николя',
        authorEmail: 'nikolya@phystech.edu',
        fileName: 'notes.tex',
        fileSize: '500 КБ',
        fileExtension: 'TEX',
      })
    );
    const createdId = (createdAction.payload as Material).id;
    expect(store.getState().materials.items).toHaveLength(1);

    // 2. Ставим звездочку через Thunk
    await store.dispatch(toggleStar(createdId));
    expect(store.getState().materials.starredIds).toContain(createdId);
    const [starredItem] = store.getState().materials.items;
    expect(starredItem?.starsCount).toBe(1);

    // 3. Добавляем опечатку через Thunk
    await store.dispatch(
      submitTypo({ materialId: createdId, text: 'Опечатка в теореме 3', authorName: 'Студент' })
    );
    const [itemWithTypo] = store.getState().materials.items;
    expect(itemWithTypo?.typos).toHaveLength(1);

    // 4. Добавляем жалобу через Thunk
    await store.dispatch(
      submitReport({ materialId: createdId, text: 'Дубликат файла', authorName: 'Студент' })
    );
    const [itemWithReport] = store.getState().materials.items;
    expect(itemWithReport?.reports).toHaveLength(1);

    // 5. Удаляем файл через Thunk
    await store.dispatch(deleteMaterial(createdId));
    expect(store.getState().materials.items).toHaveLength(0);
  });
});
