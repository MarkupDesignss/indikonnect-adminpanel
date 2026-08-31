import type { ReturnRequest } from '@/types/returnRefund';

interface InternalNotesProps {
  notes?: ReturnRequest['notes'];
}

const InternalNotes = ({ notes }: InternalNotesProps) => {
  return (
    <div className="bg-white rounded border border-border-light p-6 mb-12">
      <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
        <span className="material-symbols-outlined text-outline">speaker_notes</span>
        <h3 className="text-title-lg font-title-lg text-primary">Internal Notes</h3>
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-md text-[10px] uppercase tracking-wider">
          Staff Only
        </span>
      </div>
      <textarea
        className="w-full p-3 bg-surface border border-border-light rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body-md font-body-md text-on-surface resize-none"
        placeholder="Add operational notes, carrier claim numbers, or specific handling instructions..."
        rows={4}
      />
      <div className="flex justify-end mt-3">
        <button className="px-4 py-2 rounded bg-surface-container-high text-primary hover:bg-surface-variant transition-colors font-label-md text-label-md">
          Save Note
        </button>
      </div>
      {!!notes?.length && (
        <div className="mt-6 space-y-4 border-t border-border-light pt-4">
          {notes.map((note) => (
            <div key={`${note.author}-${note.date}`} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                {note.author
                  .split(' ')
                  .map((word) => word[0])
                  .join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body-md font-body-md font-bold text-primary">{note.author}</span>
                  <span className="text-label-md font-label-md text-on-surface-variant">{note.date}</span>
                </div>
                <p className="text-body-md font-body-md text-on-surface">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternalNotes;
