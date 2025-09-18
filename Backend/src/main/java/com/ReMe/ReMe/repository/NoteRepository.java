package com.ReMe.ReMe.repository;

import com.ReMe.ReMe.entity.Note;
import com.ReMe.ReMe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    
    List<Note> findByUserOrderByCreatedAtDesc(User user);
    
    List<Note> findByUserAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(User user, String title);
    
    Optional<Note> findByIdAndUser(Long id, User user);
    
    void deleteByIdAndUser(Long id, User user);
}
