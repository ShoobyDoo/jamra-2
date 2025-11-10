export interface Chapter {
  id: string;
  mangaId: string;
  title: string;
  chapterNumber: number;
  pageCount: number;
  createdAt: number;
}

export interface CreateChapterInput {
  mangaId: string;
  title: string;
  chapterNumber: number;
  pageCount?: number;
}
