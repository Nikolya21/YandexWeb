import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/authPage.css';

interface StoredAccount {
  username: string;
  email: string;
  password: string;
}

interface AuthPageProps {
  mode: 'login' | 'register';
}

const ACCOUNTS_LIST_KEY = 'campusnode_accounts';
const CURRENT_USER_KEY = 'campusnode_current_user';

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);

  useEffect(() => {
    setError(null);
    setPassword('');
    const raw = localStorage.getItem(ACCOUNTS_LIST_KEY);
    if (raw) {
      try {
        setAccounts(JSON.parse(raw) as StoredAccount[]);
      } catch {
        localStorage.removeItem(ACCOUNTS_LIST_KEY);
      }
    }
  }, [mode]);

  const handleSelectAccount = (account: StoredAccount) => {
    setError(null);
    setEmail(account.email);
    setPassword('');
    passwordInputRef.current?.focus();
  };

  const handleRemoveAccount = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = accounts.filter(
      (acc) => acc.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setAccounts(updated);
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(updated));
    if (email.toLowerCase() === emailToRemove.toLowerCase()) {
      setEmail('');
      setPassword('');
    }
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (mode === 'register') {
      if (username.trim().length < 2) {
        setError('Имя должно содержать минимум 2 символа');
        return;
      }
      if (!trimmedEmail.includes('@')) {
        setError('Введите корректный адрес электронной почты');
        return;
      }
      if (password.length < 6) {
        setError('Пароль должен быть не короче 6 символов');
        return;
      }

      const alreadyExists = accounts.some(
        (acc) => acc.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      if (alreadyExists) {
        setError('Аккаунт с такой почтой уже зарегистрирован. Перейдите на страницу входа.');
        return;
      }

      const newAccount: StoredAccount = {
        username: username.trim(),
        email: trimmedEmail,
        password,
      };

      const updatedAccounts = [newAccount, ...accounts];
      localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(updatedAccounts));
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({ username: newAccount.username, email: newAccount.email })
      );

      navigate('/');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Введите адрес электронной почты или выберите аккаунт из списка выше');
      return;
    }
    if (!password) {
      setError('Введите пароль для выбранного аккаунта');
      return;
    }

    const foundAccount = accounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (!foundAccount) {
      setError('Аккаунт с такой почтой не найден. Сначала зарегистрируйтесь.');
      return;
    }

    if (foundAccount.password !== password) {
      setError('Неверный пароль для этого аккаунта');
      return;
    }

    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({ username: foundAccount.username, email: foundAccount.email })
    );
    navigate('/');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">CampusNode</div>
        <h1 className="auth-title">
          {mode === 'login' ? 'Вход в систему' : 'Создание аккаунта'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Выберите сохранённый аккаунт или введите данные вручную'
            : 'Присоединяйтесь к базе знаний вашего курса'}
        </p>

        {/* СПИСОК ВСЕХ ЗАРЕГИСТРИРОВАННЫХ АККАУНТОВ (показываем на странице входа) */}
        {mode === 'login' && accounts.length > 0 && (
          <div className="saved-accounts-section">
            <span className="saved-accounts-title">Сохранённые аккаунты ({accounts.length})</span>
            <div className="saved-accounts-list">
              {accounts.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <div
                    key={acc.email}
                    className={`account-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectAccount(acc)}
                  >
                    <div className="account-avatar">
                      {acc.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="account-details">
                      <strong>{acc.username}</strong>
                      <span>{acc.email}</span>
                    </div>
                    <span className="account-select-hint">
                      {isSelected ? 'Выбран' : 'Выбрать'}
                    </span>
                    <button
                      type="button"
                      className="btn-quick-forget"
                      onClick={(e) => handleRemoveAccount(e, acc.email)}
                      title="Удалить аккаунт из списка"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">Имя и фамилия</label>
              <input
                id="username"
                type="text"
                placeholder="Например, Николя Хачатрян"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Учебная или личная почта</label>
            <input
              id="email"
              type="email"
              placeholder="student@phystech.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {mode === 'login' && email
                ? `Пароль для ${email}`
                : 'Пароль'}
            </label>
            <input
              ref={passwordInputRef}
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-submit">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <span>
              Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </span>
          ) : (
            <span>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
