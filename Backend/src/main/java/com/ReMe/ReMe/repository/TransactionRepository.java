package com.ReMe.ReMe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ReMe.ReMe.entity.Transaction;
import com.ReMe.ReMe.entity.User;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByUserOrderByCreatedAtDesc(User user);
    
    Optional<Transaction> findByTxHash(String txHash);
    
    List<Transaction> findByNoteId(Long noteId);
    
    boolean existsByTxHash(String txHash);
}
