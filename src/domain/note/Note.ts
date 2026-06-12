export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function createNote(content: string): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateNote(note: Note, content: string): Note {
  return {
    ...note,
    content,
    updatedAt: new Date().toISOString(),
  };
}

export function sortNotesByDate(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
