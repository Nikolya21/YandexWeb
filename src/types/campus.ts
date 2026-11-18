export interface FeedbackEntry {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface Material {
  id: string;
  subjectId: string;
  authorName: string;
  authorEmail: string;
  fileName: string;
  fileSize: string;
  fileExtension: string;
  starsCount: number;
  typos: FeedbackEntry[];
  reports: FeedbackEntry[];
  createdAt: string;
}

export interface CreateMaterialDto {
  subjectId: string;
  authorName: string;
  authorEmail: string;
  fileName: string;
  fileSize: string;
  fileExtension: string;
}
