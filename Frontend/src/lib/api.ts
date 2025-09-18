// Mock API for demo purposes - no real backend needed

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Demo notes data
const DEMO_NOTES_KEY = 'demo-notes';

const getDemoNotes = (): Note[] => {
  const stored = localStorage.getItem(DEMO_NOTES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default demo notes
  const defaultNotes: Note[] = [
    {
      id: '1',
      title: 'Welcome to Your Notes App',
      content: 'This is a demo note-taking app. You can create, edit, and delete notes. All data is stored locally in your browser.',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      title: 'Getting Started',
      content: 'Click the "New Note" button to create your first note. You can search through your notes using the search bar above.',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'Features',
      content: 'This app includes:\n\n• Create and edit notes\n• Search functionality\n• Responsive design\n• Dark theme inspired by Blitzit\n• Local storage for persistence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  
  localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(defaultNotes));
  return defaultNotes;
};

const saveDemoNotes = (notes: Note[]) => {
  localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(notes));
};

export const notesAPI = {
  getNotes: (): Promise<{ data: Note[] }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: getDemoNotes() });
      }, 300); // Simulate network delay
    });
  },
  
  createNote: (note: { title: string; content: string }): Promise<{ data: Note }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notes = getDemoNotes();
        const newNote: Note = {
          id: Date.now().toString(),
          title: note.title,
          content: note.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        notes.unshift(newNote);
        saveDemoNotes(notes);
        resolve({ data: newNote });
      }, 300);
    });
  },
  
  updateNote: (id: string, note: { title: string; content: string }): Promise<{ data: Note }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const notes = getDemoNotes();
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
          notes[index] = {
            ...notes[index],
            title: note.title,
            content: note.content,
            updatedAt: new Date().toISOString(),
          };
          saveDemoNotes(notes);
          resolve({ data: notes[index] });
        } else {
          reject(new Error('Note not found'));
        }
      }, 300);
    });
  },
  
  deleteNote: (id: string): Promise<{ data: { success: boolean } }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notes = getDemoNotes();
        const filteredNotes = notes.filter(n => n.id !== id);
        saveDemoNotes(filteredNotes);
        resolve({ data: { success: true } });
      }, 300);
    });
  },
  
  getNote: (id: string): Promise<{ data: Note }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const notes = getDemoNotes();
        const note = notes.find(n => n.id === id);
        if (note) {
          resolve({ data: note });
        } else {
          reject(new Error('Note not found'));
        }
      }, 300);
    });
  }
};