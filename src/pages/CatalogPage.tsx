import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar, CurrentUser } from '../components/Sidebar';
import { FolderCard } from '../components/FolderCard';
import '../../css/catalogPage.css';

const FACULTIES_KEY = 'campusnode_faculties';
const COURSES_KEY = 'campusnode_courses';
const SUBJECTS_KEY = 'campusnode_subjects';
const CURRENT_USER_KEY = 'campusnode_current_user';

const DEFAULT_FACULTIES = [
  'ВШПИ',
  'ФПМИ',
  'ФРКТ',
  'ФЭФМ',
  'ЛФИ',
  'ВШБТ',
  'ФАКТ',
  'ПИШ ФАЛТ',
  'КНТ',
];

const DEFAULT_COURSES = ['1 курс', '2 курс', '3 курс', '4 курс'];

interface SubjectFolder {
  id: string;
  faculty: string;
  course: string;
  name: string;
  goal: string;
  authorName: string;
  authorEmail: string;
}

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();

  const [faculties, setFaculties] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<SubjectFolder[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectGoal, setSubjectGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authWarning, setAuthWarning] = useState(false);

  useEffect(() => {
    const rawFaculties = localStorage.getItem(FACULTIES_KEY);
    if (rawFaculties) {
      setFaculties(JSON.parse(rawFaculties) as string[]);
    } else {
      localStorage.setItem(FACULTIES_KEY, JSON.stringify(DEFAULT_FACULTIES));
      setFaculties(DEFAULT_FACULTIES);
    }

    const rawCourses = localStorage.getItem(COURSES_KEY);
    if (rawCourses) {
      setCourses(JSON.parse(rawCourses) as string[]);
    } else {
      localStorage.setItem(COURSES_KEY, JSON.stringify(DEFAULT_COURSES));
      setCourses(DEFAULT_COURSES);
    }

    const rawSubjects = localStorage.getItem(SUBJECTS_KEY);
    if (rawSubjects) {
      try {
        setSubjects(JSON.parse(rawSubjects) as SubjectFolder[]);
      } catch {
        localStorage.removeItem(SUBJECTS_KEY);
      }
    }

    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser) as CurrentUser);
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  }, []);

  const resetNavigation = () => {
    setSelectedFaculty(null);
    setSelectedCourse(null);
    setIsCreateOpen(false);
    setAuthWarning(false);
  };

  const handlePlusClick = () => {
    setError(null);
    if (!currentUser) {
      setAuthWarning(true);
      return;
    }
    setAuthWarning(false);
    setIsCreateOpen((prev) => !prev);
  };

  const handleCreateSubject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Создавать предметы могут только зарегистрированные пользователи.');
      return;
    }
    if (!selectedFaculty || !selectedCourse) return;

    const trimmedName = subjectName.trim();
    const trimmedGoal = subjectGoal.trim();

    if (!trimmedName) {
      setError('Укажите название предмета.');
      return;
    }
    if (!trimmedGoal) {
      setError('Укажите цель или предпочтения для этого предмета.');
      return;
    }

    const isDuplicate = subjects.some(
      (item) =>
        item.faculty === selectedFaculty &&
        item.course === selectedCourse &&
        item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Папка «${trimmedName}» уже существует на этом курсе.`);
      return;
    }

    const newSubject: SubjectFolder = {
      id: `subj-${Date.now()}`,
      faculty: selectedFaculty,
      course: selectedCourse,
      name: trimmedName,
      goal: trimmedGoal,
      authorName: currentUser.username,
      authorEmail: currentUser.email,
    };

    const updatedSubjects = [newSubject, ...subjects];
    setSubjects(updatedSubjects);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(updatedSubjects));

    setSubjectName('');
    setSubjectGoal('');
    setIsCreateOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((item) => item.id !== id);
    setSubjects(updated);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    setIsCreateOpen(false);
    navigate('/login');
  };

  const currentCourseSubjects = subjects.filter(
    (item) => item.faculty === selectedFaculty && item.course === selectedCourse
  );

  return (
    <div className="app-layout">
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetNavigation={resetNavigation}
        activeMenu="catalog"
      />

      <main className="main-content">
        <header className="top-bar">
          <div>
            <div className="breadcrumbs">
              <button type="button" className="crumb-btn" onClick={resetNavigation}>
                Факультеты
              </button>

              {selectedFaculty && (
                <>
                  <span className="crumb-sep">/</span>
                  <button
                    type="button"
                    className="crumb-btn"
                    onClick={() => {
                      setSelectedCourse(null);
                      setIsCreateOpen(false);
                      setAuthWarning(false);
                    }}
                  >
                    {selectedFaculty}
                  </button>
                </>
              )}

              {selectedCourse && (
                <>
                  <span className="crumb-sep">/</span>
                  <span className="crumb-current">{selectedCourse}</span>
                </>
              )}
            </div>

            <h1>
              {!selectedFaculty && 'Выберите факультет'}
              {selectedFaculty && !selectedCourse && `${selectedFaculty} — Выберите курс`}
              {selectedFaculty && selectedCourse && `${selectedFaculty} · ${selectedCourse}`}
            </h1>
          </div>

          {selectedFaculty && selectedCourse && (
            <button
              type="button"
              className="btn-plus"
              onClick={handlePlusClick}
              title="Добавить предмет"
            >
              +
            </button>
          )}
        </header>

        {authWarning && (
          <div className="auth-warning-box">
            <span>Создавать папки предметов могут только зарегистрированные пользователи.</span>
            <Link to="/login" className="auth-warning-link">
              Войти в аккаунт →
            </Link>
          </div>
        )}

        {isCreateOpen && selectedFaculty && selectedCourse && (
          <div className="subject-modal-frame">
            <div className="frame-header">
              <h3>Новый предмет ({selectedFaculty}, {selectedCourse})</h3>
              <button
                type="button"
                className="btn-close-frame"
                onClick={() => setIsCreateOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="frame-form" onSubmit={handleCreateSubject}>
              <div className="frame-inputs-row">
                <div className="frame-field">
                  <label htmlFor="subj-name">Какой предмет</label>
                  <input
                    id="subj-name"
                    type="text"
                    placeholder="Например: Математический анализ"
                    value={subjectName}
                    onChange={(e) => {
                      setSubjectName(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>

                <div className="frame-field">
                  <label htmlFor="subj-goal">С какой целью (предпочтения)</label>
                  <input
                    id="subj-goal"
                    type="text"
                    placeholder="Например: Подготовка к коллоквиуму, техи лекций"
                    value={subjectGoal}
                    onChange={(e) => {
                      setSubjectGoal(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              {error && <div className="folder-error">{error}</div>}

              <div className="frame-actions">
                <button type="submit" className="btn-create">
                  Создать папку предмета
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedFaculty && (
          <section className="folders-grid">
            {faculties.map((faculty) => (
              <FolderCard
                key={faculty}
                icon="📁"
                title={faculty}
                meta="4 курса"
                onClick={() => setSelectedFaculty(faculty)}
              />
            ))}
          </section>
        )}

        {selectedFaculty && !selectedCourse && (
          <section className="folders-grid">
            {courses.map((course) => (
              <FolderCard
                key={course}
                icon="📂"
                title={course}
                meta={selectedFaculty}
                onClick={() => setSelectedCourse(course)}
              />
            ))}
          </section>
        )}

        {selectedFaculty && selectedCourse && (
          <section>
                        {currentCourseSubjects.length === 0 ? (
              <div className="empty-state">
                На этом курсе пока нет созданных предметов. Нажмите на кнопку <strong>+</strong> справа, чтобы добавить первый!
              </div>
            ) : (
              <div className="folders-grid">
                {currentCourseSubjects.map((subj) => (
                  <FolderCard
                    key={subj.id}
                    icon="📘"
                    title={subj.name}
                    goal={subj.goal}
                    meta={`Создал: ${subj.authorName}`}
                    onClick={() => navigate(`/subject/${subj.id}`)}
                    onDelete={
                      currentUser && currentUser.email === subj.authorEmail
                        ? () => handleDeleteSubject(subj.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

