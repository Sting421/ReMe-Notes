import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { notesAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

// Import the Note interface from api.ts
import { Note } from '@/lib/api';

const NoteEditor: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNewNote = id === 'new';

  useEffect(() => {
    if (!isNewNote && id) {
      fetchNote(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewNote]);

  useEffect(() => {
    // Check for unsaved changes
    if (note) {
      setHasChanges(title !== note.title || content !== note.content);
    } else if (isNewNote) {
      setHasChanges(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, note, isNewNote]);

  const fetchNote = async (noteId: string) => {
    setIsLoading(true);
    try {
      // Use the getNote API endpoint to fetch a specific note by ID
      const response = await notesAPI.getNote(noteId);
      const foundNote = response.data;
      
      setNote(foundNote);
      setTitle(foundNote.title);
      setContent(foundNote.content);
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Note not found',
        description: 'The note you are looking for does not exist.',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cannot save empty note',
        description: 'Please add a title or content before saving.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const noteData = {
        title: title.trim() || 'Untitled',
        content: content.trim(),
      };

      if (isNewNote) {
        const response = await notesAPI.createNote(noteData);
        const newNote = response.data;
        setNote(newNote);
        toast({
          title: 'Note created',
          description: 'Your note has been saved successfully.',
        });
        // Navigate to the new note's edit page
        navigate(`/note/${newNote.id}`, { replace: true });
      } else {
        const response = await notesAPI.updateNote(String(id!), noteData);
        const updatedNote = response.data;
        setNote(updatedNote);
        toast({
          title: 'Note saved',
          description: 'Your changes have been saved successfully.',
        });
      }
      setHasChanges(false);
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to save note',
        description: errorMessage || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(String(note.id)); // Convert to string to ensure compatibility
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully.',
      });
      navigate('/dashboard');
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to delete note',
        description: errorMessage || 'Please try again.',
      });
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">
                  {isNewNote ? 'New Note' : 'Editing Note'}
                  {hasChanges && ' • Unsaved changes'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isNewNote && note && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive hover:bg-destructive-light"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || (!hasChanges && !isNewNote)}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-semibold border-none bg-transparent px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/60"
              style={{ fontSize: '1.5rem', lineHeight: '2rem' }}
            />
          </div>
          
          <div className="flex-1">
            <Textarea
              placeholder="Start writing your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] border-none bg-transparent px-0 focus-visible:ring-0 resize-none text-base leading-relaxed placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Auto-save indicator */}
        {hasChanges && (
          <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground">
              You have unsaved changes
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NoteEditor;