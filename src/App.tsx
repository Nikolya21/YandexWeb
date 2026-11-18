import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { AuthPage } from './pages/authPage';
import { SubjectPage } from './pages/SubjectPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/subject/:subjectId" element={<SubjectPage />} />
    </Routes>
  );
}

export default App;
