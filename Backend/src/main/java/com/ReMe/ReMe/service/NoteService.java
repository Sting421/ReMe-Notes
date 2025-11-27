package com.ReMe.ReMe.service;

import com.ReMe.ReMe.dto.NoteDto;
import com.ReMe.ReMe.entity.Note;
import com.ReMe.ReMe.entity.User;
import com.ReMe.ReMe.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoteService {
    
    @Autowired
    private NoteRepository noteRepository;
    
    public List<NoteDto> getAllNotesByUser(User user) {
        List<Note> notes = noteRepository.findByUserOrderByCreatedAtDesc(user);
        return notes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public NoteDto getNoteById(Long id, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Note not found or you don't have permission to access it"));
        return convertToDto(note);
    }
    
    public NoteDto createNote(NoteDto noteDto, User user) {
        Note note = new Note();
        note.setTitle(noteDto.getTitle());
        note.setContent(noteDto.getContent());
        note.setUser(user);
        
        Note savedNote = noteRepository.save(note);
        return convertToDto(savedNote);
    }
    
    public NoteDto updateNote(Long id, NoteDto noteDto, User user) {
        Note existingNote = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Note not found or you don't have permission to update it"));
        
        existingNote.setTitle(noteDto.getTitle());
        existingNote.setContent(noteDto.getContent());
        
        Note updatedNote = noteRepository.save(existingNote);
        return convertToDto(updatedNote);
    }
    
    public void deleteNote(Long id, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Note not found or you don't have permission to delete it"));
        
        noteRepository.delete(note);
    }
    
    public List<NoteDto> searchNotesByTitle(String title, User user) {
        List<Note> notes = noteRepository.findByUserAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(user, title);
        return notes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private NoteDto convertToDto(Note note) {
        return new NoteDto(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
