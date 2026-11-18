import { describe, it, expect, beforeEach } from 'vitest';
import { materialsApi } from '../api/materialsApi';

describe('materialsApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('возвращает пустые массивы при пустом или поврежденном localStorage', async () => {
    // 1. Пустой localStorage
    const emptyRes = await materialsApi.getAll(false);
    expect(emptyRes.materials).toEqual([]);
    expect(emptyRes.starredIds).toEqual([]);

    // 2. Поврежденный JSON в localStorage (проверка блоков catch)
    localStorage.setItem('campusnode_materials', '{invalid-json');
    localStorage.setItem('campusnode_starred_ids', 'not-an-array');

    const corruptedRes = await materialsApi.getAll(false);
    expect(corruptedRes.materials).toEqual([]);
    expect(corruptedRes.starredIds).toEqual([]);
  });

  it('выбрасывает ошибку при вызове getAll(true)', async () => {
    await expect(materialsApi.getAll(true)).rejects.toThrow(
      'Ошибка загрузки материалов (503 Service Unavailable)'
    );
  });

  it('создает, лайкает, комментирует и удаляет материал в localStorage', async () => {
    // 1. Создание
    const created = await materialsApi.create({
      subjectId: 'subj-1',
      authorName: 'Николя',
      authorEmail: 'nikolya@phystech.edu',
      fileName: 'analysis.pdf',
      fileSize: '1.5 МБ',
      fileExtension: 'PDF',
    });

    expect(created.fileName).toBe('analysis.pdf');
    expect(created.starsCount).toBe(0);

    // 2. Постановка звездочки
    const starred = await materialsApi.toggleStar(created.id);
    expect(starred.material.starsCount).toBe(1);
    expect(starred.starredIds).toContain(created.id);

    // 3. Повторный клик снимает звездочку
    const unstarred = await materialsApi.toggleStar(created.id);
    expect(unstarred.material.starsCount).toBe(0);
    expect(unstarred.starredIds).not.toContain(created.id);

    // 4. Добавление опечатки и жалобы
    const withTypo = await materialsApi.addTypo(created.id, 'Ошибка в формуле 2', 'Студент');
    expect(withTypo.typos).toHaveLength(1);
     const [firstTypo] = withTypo.typos;
    expect(firstTypo?.text).toBe('Ошибка в формуле 2');

    const withReport = await materialsApi.addReport(created.id, 'Не та тема', 'Студент');
    expect(withReport.reports).toHaveLength(1);
    const [firstReport] = withReport.reports;
    expect(firstReport?.text).toBe('Не та тема');

    // 5. Проверяем чтение через getAll после всех изменений
    const allData = await materialsApi.getAll(false);
    expect(allData.materials).toHaveLength(1);

    // 6. Удаление файла
    const deletedId = await materialsApi.delete(created.id);
    expect(deletedId).toBe(created.id);

    const afterDelete = await materialsApi.getAll(false);
    expect(afterDelete.materials).toHaveLength(0);
  });

  it('выбрасывает ошибку при попытке лайкнуть или пожаловаться на несуществующий файл', async () => {
    await expect(materialsApi.toggleStar('non-existent')).rejects.toThrow('Файл не найден');
    await expect(materialsApi.addTypo('non-existent', 'текст', 'автор')).rejects.toThrow(
      'Файл не найден'
    );
    await expect(materialsApi.addReport('non-existent', 'текст', 'автор')).rejects.toThrow(
      'Файл не найден'
    );
  });
});
