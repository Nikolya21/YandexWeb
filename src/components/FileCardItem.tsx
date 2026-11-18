import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import {
  deleteMaterial,
  toggleStar,
  submitTypo,
  submitReport,
} from '../store/materialsSlice';
import { Material } from '../types/campus';
import { CurrentUser } from './Sidebar';

interface FileCardItemProps {
  file: Material;
  isStarred: boolean;
  isOwner: boolean;
  currentUser: CurrentUser | null;
}

export const FileCardItem: React.FC<FileCardItemProps> = ({
  file,
  isStarred,
  isOwner,
  currentUser,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [isSquareOpen, setIsSquareOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [typoText, setTypoText] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const authorLabel = currentUser ? currentUser.username : 'Гость';

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    dispatch(submitReport({ materialId: file.id, text: reportText.trim(), authorName: authorLabel }));
    setReportText('');
    setFeedbackNotice('Жалоба отправлена');
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  const handleSendTypo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typoText.trim()) return;
    dispatch(submitTypo({ materialId: file.id, text: typoText.trim(), authorName: authorLabel }));
    setTypoText('');
    setFeedbackNotice('Сообщение об опечатке сохранено');
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  return (
    <div className="file-card">
      <div className="file-card-header">
        <button
          type="button"
          className={`corner-square-btn ${isSquareOpen ? 'active' : ''}`}
          onClick={() => setIsSquareOpen((prev) => !prev)}
          title="Действия с файлом: Жалоба, Опечатка, Звездочка"
        >
          {isSquareOpen ? '✕' : '⋮'}
        </button>

        <span className="file-ext-badge">{file.fileExtension}</span>

        {isOwner && (
          <button
            type="button"
            className="btn-delete-file"
            onClick={() => dispatch(deleteMaterial(file.id))}
            title="Удалить файл"
          >
            Удалить
          </button>
        )}
      </div>

      {isSquareOpen && (
        <div className="feedback-three-cols">
          <form className="fb-col" onSubmit={handleSendReport}>
            <div className="fb-col-title">🚩 Жалоба ({file.reports?.length || 0})</div>
            <textarea
              rows={2}
              placeholder="Опишите причину жалобы..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <button type="submit" className="fb-btn fb-btn-danger">
              Отправить
            </button>
          </form>

          <form className="fb-col" onSubmit={handleSendTypo}>
            <div className="fb-col-title">✏️ Опечатка ({file.typos?.length || 0})</div>
            <textarea
              rows={2}
              placeholder="Укажите, где опечатка..."
              value={typoText}
              onChange={(e) => setTypoText(e.target.value)}
            />
            <button type="submit" className="fb-btn fb-btn-warn">
              Записать
            </button>
          </form>

          <div className="fb-col fb-col-star">
            <div className="fb-col-title">⭐ Оценка</div>
            <button
              type="button"
              className={`star-toggle-btn ${isStarred ? 'starred' : ''}`}
              onClick={() => dispatch(toggleStar(file.id))}
            >
              {isStarred ? '★ Лайкнуто' : '☆ Поставить звезду'}
            </button>
            <span className="star-counter">Всего звезд: {file.starsCount}</span>
          </div>
        </div>
      )}

      {feedbackNotice && <div className="feedback-toast">{feedbackNotice}</div>}

      <div className="file-body">
        <div className="file-big-icon">📄</div>
        <div className="file-info">
          <h3 className="file-name">{file.fileName}</h3>
          <div className="file-meta">
            <span>Размер: {file.fileSize}</span>
            <span>·</span>
            <span>★ {file.starsCount}</span>
            <span>·</span>
            <span>Опечаток: {file.typos?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
