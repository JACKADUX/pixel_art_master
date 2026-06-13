import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { listNotes } from "@/application/use-cases/NoteUseCases";
import { useAppStore } from "../stores/appStore";

export function NotesPanel() {
  const project = useAppStore((s) => s.project);
  const draftNote = useAppStore((s) => s.draftNote);
  const editingNoteId = useAppStore((s) => s.editingNoteId);
  const setDraftNote = useAppStore((s) => s.setDraftNote);
  const saveDraftNote = useAppStore((s) => s.saveDraftNote);
  const selectNote = useAppStore((s) => s.selectNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const newNoteDraft = useAppStore((s) => s.newNoteDraft);

  if (!project) return null;

  const notes = listNotes(project);

  return (
    <div className="flex h-full min-w-0 w-full flex-col">
      <div className="min-w-0 shrink-0 border-b border-zinc-700 p-3">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-medium text-zinc-300">
            {editingNoteId ? "编辑笔记" : "新笔记"}
          </h3>
          {editingNoteId && (
            <button
              type="button"
              onClick={newNoteDraft}
              className="shrink-0 text-xs text-blue-400 hover:underline"
            >
              新建
            </button>
          )}
        </div>
        <textarea
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          placeholder="记录绘制感悟（支持 Markdown）..."
          className="box-border h-24 w-full min-w-0 resize-none rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={saveDraftNote}
          disabled={!draftNote.trim()}
          className="mt-2 w-full min-w-0 rounded bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {editingNoteId ? "更新笔记" : "保存笔记"}
        </button>
      </div>

      {draftNote && (
        <div className="max-h-32 min-w-0 overflow-auto border-b border-zinc-700 p-3">
          <p className="mb-1 text-[10px] text-zinc-500">预览</p>
          <div className="prose prose-invert prose-xs max-w-none break-words text-zinc-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftNote}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 overflow-auto p-3">
        <h3 className="mb-2 text-sm font-medium text-zinc-300">历史笔记 ({notes.length})</h3>
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-500">暂无笔记</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`w-full min-w-0 rounded border p-2 ${
                  editingNoteId === note.id
                    ? "border-blue-500 bg-zinc-800"
                    : "border-zinc-700 bg-zinc-800/50"
                }`}
              >
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => selectNote(note)}
                    className="min-w-0 truncate text-left text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    {new Date(note.updatedAt).toLocaleString()}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="shrink-0 text-[10px] text-red-400 hover:underline"
                  >
                    删除
                  </button>
                </div>
                <div className="prose prose-invert prose-xs max-w-none break-words line-clamp-4 text-zinc-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
