export interface Manga {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  createdAt: number;
  updatedAt: number;
}

export interface CreateMangaInput {
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genres?: string[];
  status?: 'ongoing' | 'completed' | 'hiatus';
}
