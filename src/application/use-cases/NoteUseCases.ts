import { createNote, sortNotesByDate, updateNote } from "@/domain/note/Note";
import type { Note } from "@/domain/note/Note";
import type { Project } from "@/domain/project/Project";
import { touchProject } from "@/domain/project/Project";

export function addNote(project: Project, content: string): Project {
  const note = createNote(content);
  return touchProject({
    ...project,
    notes: [note, ...project.notes],
  });
}

export function updateProjectNote(
  project: Project,
  noteId: string,
  content: string,
): Project {
  return touchProject({
    ...project,
    notes: project.notes.map((n) =>
      n.id === noteId ? updateNote(n, content) : n,
    ),
  });
}

export function deleteNote(project: Project, noteId: string): Project {
  return touchProject({
    ...project,
    notes: project.notes.filter((n) => n.id !== noteId),
  });
}

export function listNotes(project: Project): Note[] {
  return sortNotesByDate(project.notes);
}
