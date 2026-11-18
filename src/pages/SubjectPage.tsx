import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchMaterials, createMaterial } from '../store/materialsSlice';
import { Sidebar, CurrentUser } from '../components/Sidebar';
import { FileCardItem } from '../components/FileCardItem';
import '../../css/catalogPage.css';
import '../../css/subjectPage.css';

const SUBJECTS_KEY = 'campusnode_subjects';
const CURRENT_USER_KEY = 'campusnode_current_user';

interface SubjectFolder {
  id: string;
  faculty: string;
  course: string;
  name: string;
  goal: string;
  authorName: string;
  authorEmail: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

export const SubjectPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, starredIds, status, error } = useSelector((state: RootState) => state.materials);

  const [subject, setSubject] = useState<SubjectFolder | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    dispatch(fetchMaterials(false));

    const rawSubjects = localStorage.getItem(SUBJECTS_KEY);
    if (rawSubjects && subjectId) {
      const list = JSON.parse(rawSubjects) as SubjectFolder[];
      const found = list.find((item) => item.id === subjectId) || null;
      setSubject(found);
    }

    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (rawUser) {
      setCurrentUser(JSON.parse(rawUser) as CurrentUser);
    }
  }, [dispatch, subjectId]);

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    navigate('/login');
  };

  const isOwner = Boolean(
    currentUser?.email &&
      subject?.authorEmail &&
      currentUser.email.toLowerCase() === subject.authorEmail.toLowerCase()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !subject || !currentUser || !isOwner) return;

    const [selectedFile] = Array.from(files);
    if (!selectedFile) return;

    const parts = selectedFile.name.split('.');
    const ext = parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';

    dispatch(
      createMaterial({
        subjectId: subject.id,
        authorName: currentUser.username,
        authorEmail: currentUser.email,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        fileExtension: ext,
      })
    );

    e.target.value = '';
  };

  const subjectFiles = items.filter((item) => item.subjectId === subjectId);

  return (
    <div className="app-layout">
      <Sidebar currentUser={currentUser} onLogout={handleLogout} activeMenu="subject" />

      <main className="main-content">
        {!subject ? (
          <div>
            <Link to="/" className="back-link">← Вернуться в каталог</Link>
            <div className="empty-state">Папка предмета не найдена.</div>
          </div>
        ) : (
          <>
            <header className="subject-header">
              <Link to="/" className="back-link">
                ← Назад к курсам ({subject.faculty} · {subject.course})
              </Link>

              <div className="subject-title-row">
                <div>
                  <h1>{subject.name}</h1>
                  <p className="subject-subtitle">
                    Цель: {subject.goal} · Автор папки: <strong>{subject.authorName}</strong>
                  </p>
                </div>

                {isOwner ? (
                  <label className="upload-file-btn">
                    + Добавить файл с компьютера
                    <input type="file" onChange={handleFileChange} hidden />
                  </label>
                ) : (
                  <span className="readonly-badge">
                    Добавлять файлы может только автор папки ({subject.authorName})
                  </span>
                )}
              </div>
            </header>

            {status === 'loading' && <div className="state-box">Загрузка файлов...</div>}
            {status === 'failed' && <div className="state-box error-box">{error}</div>}

            {status === 'succeeded' && subjectFiles.length === 0 && (
              <div className="empty-state">
                {isOwner
                  ? 'В вашей папке пока нет файлов. Нажмите «+ Добавить файл с компьютера» справа сверху.'
                  : 'Автор пока не загрузил файлы в эту папку.'}
              </div>
            )}

            {status === 'succeeded' && subjectFiles.length > 0 && (
              <div className="files-list">
                {subjectFiles.map((file) => (
                  <FileCardItem
                    key={file.id}
                    file={file}
                    isStarred={starredIds.includes(file.id)}
                    isOwner={isOwner}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
