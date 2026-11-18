import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import materialsReducer from '../store/materialsSlice';
import { CatalogPage } from '../pages/CatalogPage';
import { SubjectPage } from '../pages/SubjectPage';

describe('Защита от дубликатов предметов и разграничение прав доступа', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('не позволяет пользователю создать два одинаковых предмета на одном курсе', () => {
    localStorage.setItem(
      'campusnode_current_user',
      JSON.stringify({ username: 'Николя', email: 'author@phystech.edu' })
    );

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    );

    // Переходим: ВШПИ -> 1 курс
    fireEvent.click(screen.getByText('ВШПИ'));
    fireEvent.click(screen.getByText('1 курс'));

    // Создаем первый предмет
    fireEvent.click(screen.getByTitle('Добавить предмет'));
    fireEvent.change(screen.getByLabelText(/Какой предмет/i), {
      target: { value: 'Математический анализ' },
    });
    fireEvent.change(screen.getByLabelText(/С какой целью/i), {
      target: { value: 'Подготовка к экзамену' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать папку предмета/i }));

    expect(screen.getByText('Математический анализ')).toBeInTheDocument();

    // Пытаемся создать дубликат в другом регистре
    fireEvent.click(screen.getByTitle('Добавить предмет'));
    fireEvent.change(screen.getByLabelText(/Какой предмет/i), {
      target: { value: 'математический анализ' },
    });
    fireEvent.change(screen.getByLabelText(/С какой целью/i), {
      target: { value: 'Другая цель' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать папку предмета/i }));

    expect(
      screen.getByText(/Папка «математический анализ» уже существует на этом курсе/i)
    ).toBeInTheDocument();
  });

  it('запрещает другому пользователю добавлять и удалять файлы внутри папки автора', async () => {
    // 1. В localStorage лежит папка, созданная Автором А
    localStorage.setItem(
      'campusnode_subjects',
      JSON.stringify([
        {
          id: 'subj-100',
          faculty: 'ВШПИ',
          course: '1 курс',
          name: 'Алгоритмы',
          goal: 'Конспекты семинаров',
          authorName: 'Автор А',
          authorEmail: 'authorA@phystech.edu',
        },
      ])
    );

    // 2. В папке уже лежит один файл Автора А
    localStorage.setItem(
      'campusnode_materials',
      JSON.stringify([
        {
          id: 'file-100',
          subjectId: 'subj-100',
          authorName: 'Автор А',
          authorEmail: 'authorA@phystech.edu',
          fileName: 'graphs_notes.pdf',
          fileSize: '2.5 МБ',
          fileExtension: 'PDF',
          starsCount: 5,
          typos: [],
          reports: [],
          createdAt: '2026-11-17T12:00:00Z',
        },
      ])
    );

    // 3. В систему вошел другой студент — Пользователь Б
    localStorage.setItem(
      'campusnode_current_user',
      JSON.stringify({ username: 'Пользователь Б', email: 'studentB@phystech.edu' })
    );

    const testStore = configureStore({
      reducer: { materials: materialsReducer },
    });

    render(
      <Provider store={testStore}>
        <MemoryRouter initialEntries={['/subject/subj-100']}>
          <Routes>
            <Route path="/subject/:subjectId" element={<SubjectPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Ждем загрузки файла из хранилища
    const fileTitle = await screen.findByText('graphs_notes.pdf');
    expect(fileTitle).toBeInTheDocument();

    // Кнопка добавления файла отсутствует, вместо нее плашка ограничения прав
    expect(screen.queryByText(/Добавить файл с компьютера/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Добавлять файлы может только автор папки \(Автор А\)/i)
    ).toBeInTheDocument();

    // Кнопка удаления файла также скрыта для чужого аккаунта
    expect(screen.queryByRole('button', { name: /Удалить/i })).not.toBeInTheDocument();
  });
});
