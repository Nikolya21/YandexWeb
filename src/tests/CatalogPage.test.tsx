import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CatalogPage } from '../pages/CatalogPage';

describe('CatalogPage — навигация, валидация и права пользователя', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('не дает неавторизованному гостю открыть форму создания предмета по кнопке "+"', () => {
    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    );

    // Переходим в ВШПИ -> 1 курс
    fireEvent.click(screen.getByText('ВШПИ'));
    fireEvent.click(screen.getByText('1 курс'));

    // Нажимаем "+" без авторизации
    fireEvent.click(screen.getByTitle('Добавить предмет'));

    expect(
      screen.getByText(/Создавать папки предметов могут только зарегистрированные пользователи/i)
    ).toBeInTheDocument();
  });

  it('проверяет валидацию пустых полей при создании предмета и позволяет автору удалить предмет', () => {
    localStorage.setItem(
      'campusnode_current_user',
      JSON.stringify({ username: 'Николя', email: 'nikolya@phystech.edu' })
    );

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('ФПМИ'));
    fireEvent.click(screen.getByText('2 курс'));

    fireEvent.click(screen.getByTitle('Добавить предмет'));

    const submitBtn = screen.getByRole('button', { name: /Создать папку предмета/i });

    fireEvent.click(submitBtn);
    expect(screen.getByText(/Укажите название предмета/i)).toBeInTheDocument();

    // 2. Вводим название, но оставляем пустой цель
    fireEvent.change(screen.getByLabelText(/Какой предмет/i), {
      target: { value: 'Теория вероятностей' },
    });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Укажите цель или предпочтения для этого предмета/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/С какой целью/i), {
      target: { value: 'Решение задач из задания' },
    });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Теория вероятностей')).toBeInTheDocument();

    // 4. Удаляем созданный предмет по крестику
    fireEvent.click(screen.getByTitle('Удалить предмет'));
    expect(screen.queryByText('Теория вероятностей')).not.toBeInTheDocument();
  });

  it('корректно работает с хлебными крошками, очищает битый JSON и выполняет выход из аккаунта', () => {
    localStorage.setItem('campusnode_subjects', 'broken-json');
    localStorage.setItem(
      'campusnode_current_user',
      JSON.stringify({ username: 'Николя', email: 'nikolya@phystech.edu' })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/login" element={<div>Страница входа</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Проваливаемся в ЛФИ -> 3 курс
    fireEvent.click(screen.getByText('ЛФИ'));
    fireEvent.click(screen.getByText('3 курс'));
    expect(screen.getByText('ЛФИ · 3 курс')).toBeInTheDocument();

    // Возвращаемся на уровень курсов через хлебную крошку "ЛФИ"
    fireEvent.click(screen.getByRole('button', { name: 'ЛФИ' }));
    expect(screen.getByText('ЛФИ — Выберите курс')).toBeInTheDocument();

    // Возвращаемся в корень через кнопку в сайдбаре "Все факультеты"
    fireEvent.click(screen.getByRole('button', { name: /Все факультеты/i }));
    expect(screen.getByText('Выберите факультет')).toBeInTheDocument();

    // Нажимаем "Выйти"
    fireEvent.click(screen.getByRole('button', { name: /Выйти/i }));
    expect(localStorage.getItem('campusnode_current_user')).toBeNull();
    expect(screen.getByText('Страница входа')).toBeInTheDocument();
  });
});
