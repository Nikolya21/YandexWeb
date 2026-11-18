// src/tests/FileCardItem.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import materialsReducer from '../store/materialsSlice';
import { FileCardItem } from '../components/FileCardItem';
import { Material } from '../types/campus';

const baseFile: Material = {
  id: 'file-77',
  subjectId: 'subj-1',
  authorName: 'Николя',
  authorEmail: 'nikolya@phystech.edu',
  fileName: 'seminar_05.pdf',
  fileSize: '840 КБ',
  fileExtension: 'PDF',
  starsCount: 2,
  typos: [],
  reports: [],
  createdAt: '2026-11-18T15:00:00Z',
};

describe('FileCardItem — квадратик меню, 3 колонки фидбека, защита от дубликатов и удаление', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('campusnode_materials', JSON.stringify([baseFile]));
  });

  it('открывает 3 колонки по клику на квадратик, ставит звезду, записывает опечатку/жалобу и блокирует повторы', async () => {
    const store = configureStore({
      reducer: { materials: materialsReducer },
      preloadedState: {
        materials: {
          items: [baseFile],
          starredIds: [],
          status: 'succeeded' as const,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <FileCardItem
          file={baseFile}
          isStarred={false}
          isOwner={false}
          currentUser={{ username: 'Студент', email: 'student@phystech.edu' }}
        />
      </Provider>
    );

    // 1. Нажимаем на квадратик в левом верхнем углу
    const squareBtn = screen.getByTitle(/Действия с файлом/i);
    fireEvent.click(squareBtn);

    // Проверяем, что открылись все 3 колонки
    expect(screen.getByText(/Жалоба \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Опечатка \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Оценка/i)).toBeInTheDocument();

    // 2. Ставим звездочку (лайк) и ждем завершения асинхронного Thunk
    fireEvent.click(screen.getByRole('button', { name: /Поставить звезду/i }));
    await waitFor(() => {
    expect(store.getState().materials.starredIds).toContain('file-77');
    });


    // 3. Отправляем опечатку и сразу пытаемся отправить такую же повторно
    const typoTextarea = screen.getByPlaceholderText(/Укажите, где опечатка/i);
    const typoSubmit = screen.getByRole('button', { name: /Записать/i });

    fireEvent.change(typoTextarea, { target: { value: 'Неверный знак в интеграле' } });
    fireEvent.click(typoSubmit);

    expect(await screen.findByText(/Сообщение об опечатке сохранено/i)).toBeInTheDocument();

    // Повторная отправка того же текста должна вызвать ошибку дубликата
    fireEvent.change(typoTextarea, { target: { value: 'Неверный знак в интеграле' } });
    fireEvent.click(typoSubmit);

    expect(
      await screen.findByText(/Такое сообщение об опечатке уже было отправлено/i)
    ).toBeInTheDocument();

    // 4. Отправляем жалобу и пытаемся продублировать её
    const reportTextarea = screen.getByPlaceholderText(/Опишите причину жалобы/i);
    const reportSubmit = screen.getByRole('button', { name: /Отправить/i });

    fireEvent.change(reportTextarea, { target: { value: 'Файл не открывается' } });
    fireEvent.click(reportSubmit);

    expect(await screen.findByText(/Жалоба отправлена/i)).toBeInTheDocument();

    fireEvent.change(reportTextarea, { target: { value: 'Файл не открывается' } });
    fireEvent.click(reportSubmit);

    expect(
      await screen.findByText(/Такая жалоба уже была отправлена/i)
    ).toBeInTheDocument();
  });

  it('позволяет автору папки удалить файл по кнопке "Удалить"', async () => {
    const store = configureStore({
      reducer: { materials: materialsReducer },
      preloadedState: {
        materials: {
          items: [baseFile],
          starredIds: [],
          status: 'succeeded' as const,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <FileCardItem
          file={baseFile}
          isStarred={true}
          isOwner={true}
          currentUser={{ username: 'Николя', email: 'nikolya@phystech.edu' }}
        />
      </Provider>
    );

    const deleteBtn = screen.getByRole('button', { name: /Удалить/i });
    fireEvent.click(deleteBtn);

    // Ждем завершения deleteMaterial в Redux
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(store.getState().materials.items).toHaveLength(0);
  });
});
