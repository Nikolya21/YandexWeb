import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthPage } from '../pages/authPage';

describe('AuthPage — регистрация, вход, выбор и удаление аккаунтов', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('проверяет валидацию при регистрации и успешно создает новый аккаунт', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/" element={<div>Главная страница каталога</div>} />
        </Routes>
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Зарегистрироваться/i });

    fireEvent.click(submitButton);
    expect(screen.getByText(/Имя должно содержать минимум 2 символа/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Имя и фамилия/i), {
      target: { value: 'Николя Хачатрян' },
    });
    fireEvent.change(screen.getByLabelText(/Учебная или личная почта/i), {
      target: { value: 'wrong-email' },
    });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Введите корректный адрес электронной почты/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Учебная или личная почта/i), {
      target: { value: 'nikolya@phystech.edu' },
    });
    fireEvent.change(screen.getByLabelText(/Пароль/i), {
      target: { value: '123' },
    });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Пароль должен быть не короче 6 символов/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Пароль/i), {
      target: { value: '123456' },
    });
    fireEvent.click(submitButton);

    expect(screen.getByText('Главная страница каталога')).toBeInTheDocument();
    expect(localStorage.getItem('campusnode_current_user')).toContain('nikolya@phystech.edu');
  });

  it('запрещает повторную регистрацию на уже занятый email', () => {
    localStorage.setItem(
      'campusnode_accounts',
      JSON.stringify([
        { username: 'Николя', email: 'nikolya@phystech.edu', password: 'password123' },
      ])
    );

    render(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Имя и фамилия/i), { target: { value: 'Другой' } });
    fireEvent.change(screen.getByLabelText(/Учебная или личная почта/i), {
      target: { value: 'nikolya@phystech.edu' },
    });
    fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));

    expect(
      screen.getByText(/Аккаунт с такой почтой уже зарегистрирован/i)
    ).toBeInTheDocument();
  });

  it('проверяет ошибки входа: некорректный email, пустой пароль, несуществующий и неверный пароль', () => {
    localStorage.setItem(
      'campusnode_accounts',
      JSON.stringify([
        { username: 'Николя', email: 'student@phystech.edu', password: 'secretPassword123' },
      ])
    );

    render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Учебная или личная почта/i);
    const submitButton = screen.getByRole('button', { name: /Войти/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    expect(
      screen.getByText(/Введите адрес электронной почты или выберите аккаунт/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('student@phystech.edu'));
    fireEvent.click(submitButton);
    expect(screen.getByText(/Введите пароль для выбранного аккаунта/i)).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(/Минимум 6 символов/i);
    fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Неверный пароль для этого аккаунта/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'unknown@phystech.edu' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Аккаунт с такой почтой не найден/i)).toBeInTheDocument();
  });

  it('выполняет успешный вход, удаляет сохраненный аккаунт по крестику и очищает битый JSON', () => {
    localStorage.setItem('campusnode_accounts', '{broken-json');
    const { unmount } = render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>
    );
    expect(localStorage.getItem('campusnode_accounts')).toBeNull();
    unmount();

    localStorage.setItem(
      'campusnode_accounts',
      JSON.stringify([
        { username: 'Аккаунт 1', email: 'first@phystech.edu', password: 'password1' },
        { username: 'Аккаунт 2', email: 'second@phystech.edu', password: 'password2' },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/" element={<div>Успешный вход в каталог</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('first@phystech.edu'));
    const deleteButtons = screen.getAllByTitle('Удалить аккаунт из списка');
    const [firstDeleteBtn] = deleteButtons;
    if (firstDeleteBtn) {
      fireEvent.click(firstDeleteBtn);
    }
    expect(screen.queryByText('first@phystech.edu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('second@phystech.edu'));
    fireEvent.change(screen.getByPlaceholderText(/Минимум 6 символов/i), {
      target: { value: 'password2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

    expect(screen.getByText('Успешный вход в каталог')).toBeInTheDocument();
  });
});
