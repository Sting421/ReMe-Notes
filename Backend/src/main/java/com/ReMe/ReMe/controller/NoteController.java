package com.ReMe.ReMe.controller;

import com.ReMe.ReMe.dto.NoteDto;
import com.ReMe.ReMe.entity.User;
import com.ReMe.ReMe.service.NoteService;
import com.ReMe.ReMe.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5137"})
public class NoteController {
    
    @Autowired
    private NoteService noteService;
    
    @Autowired
    private UserService userService;
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByUsername(username);
    }
    
    @GetMapping
    public ResponseEntity<List<NoteDto>> getAllNotes() {
        try {
            User currentUser = getCurrentUser();
            List<NoteDto> notes = noteService.getAllNotesByUser(currentUser);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<NoteDto> getNoteById(@PathVariable Long id) {
        try {
            User currentUser = getCurrentUser();
            NoteDto note = noteService.getNoteById(id, currentUser);
            return ResponseEntity.ok(note);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createNote(@Valid @RequestBody NoteDto noteDto) {
        try {
            User currentUser = getCurrentUser();
            NoteDto createdNote = noteService.createNote(noteDto, currentUser);
            return ResponseEntity.ok(createdNote);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable Long id, @Valid @RequestBody NoteDto noteDto) {
        try {
            User currentUser = getCurrentUser();
            NoteDto updatedNote = noteService.updateNote(id, noteDto, currentUser);
            return ResponseEntity.ok(updatedNote);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        try {
            User currentUser = getCurrentUser();
            noteService.deleteNote(id, currentUser);
            return ResponseEntity.ok().body("Note deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<NoteDto>> searchNotes(@RequestParam String title) {
        try {
            User currentUser = getCurrentUser();
            List<NoteDto> notes = noteService.searchNotesByTitle(title, currentUser);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
