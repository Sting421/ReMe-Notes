package com.ReMe.ReMe.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ReMe.ReMe.dto.TransactionDto;
import com.ReMe.ReMe.dto.TransactionResponseDto;
import com.ReMe.ReMe.entity.Note;
import com.ReMe.ReMe.entity.Transaction;
import com.ReMe.ReMe.entity.User;
import com.ReMe.ReMe.repository.NoteRepository;
import com.ReMe.ReMe.repository.TransactionRepository;
import com.ReMe.ReMe.repository.UserRepository;
import com.ReMe.ReMe.util.AddressMaskingUtil;

@Service
public class TransactionService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private NoteRepository noteRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public TransactionResponseDto createTransaction(TransactionDto transactionDto, String username) {
        // Check if transaction already exists
        if (transactionRepository.existsByTxHash(transactionDto.getTxHash())) {
            throw new RuntimeException("Transaction with this hash already exists");
        }
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Transaction transaction = new Transaction();
        transaction.setTxHash(transactionDto.getTxHash());
        transaction.setSenderAddress(transactionDto.getSenderAddress());
        transaction.setRecipientAddress(transactionDto.getRecipientAddress());
        transaction.setAmountADA(transactionDto.getAmountADA());
        transaction.setUser(user);
        transaction.setNetworkId(transactionDto.getNetworkId());
        transaction.setMetadata(transactionDto.getMetadata());
        
        // Link to note if provided
        if (transactionDto.getNoteId() != null) {
            Note note = noteRepository.findById(transactionDto.getNoteId())
                .orElseThrow(() -> new RuntimeException("Note not found"));
            
            // Verify note belongs to user
            if (!note.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Note does not belong to user");
            }
            
            transaction.setNote(note);
        }
        
        Transaction savedTransaction = transactionRepository.save(transaction);
        return mapToResponseDto(savedTransaction, user);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getUserTransactions(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Transaction> transactions = transactionRepository.findByUserOrderByCreatedAtDesc(user);
        return transactions.stream()
            .map(tx -> mapToResponseDto(tx, user))
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public TransactionResponseDto getTransactionByHash(String txHash, String username) {
        Transaction transaction = transactionRepository.findByTxHash(txHash)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        // Verify transaction belongs to user
        if (!transaction.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Transaction does not belong to user");
        }
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return mapToResponseDto(transaction, user);
    }
    
    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getNoteTransactions(Long noteId, String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Note note = noteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Note not found"));
        
        // Verify note belongs to user
        if (!note.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Note does not belong to user");
        }
        
        List<Transaction> transactions = transactionRepository.findByNoteId(noteId);
        return transactions.stream()
            .map(tx -> mapToResponseDto(tx, user))
            .collect(Collectors.toList());
    }
    
    private TransactionResponseDto mapToResponseDto(Transaction transaction, User currentUser) {
        TransactionResponseDto dto = new TransactionResponseDto();
        dto.setId(transaction.getId());
        dto.setTxHash(transaction.getTxHash());
        
        // Mask addresses - only show full address if it belongs to the current user
        String senderAddress = transaction.getSenderAddress();
        String recipientAddress = transaction.getRecipientAddress();
        
        // Get user's wallet address if available (from user entity or transaction context)
        String userWalletAddress = null;
        if (currentUser != null && transaction.getUser() != null && 
            transaction.getUser().getId().equals(currentUser.getId())) {
            // This is the user's transaction, so we can show their own address fully
            // For now, mask both addresses for security - user can see full details on blockchain explorer
            dto.setSenderAddress(AddressMaskingUtil.maskAddress(senderAddress));
            dto.setRecipientAddress(AddressMaskingUtil.maskAddress(recipientAddress));
        } else {
            // Not user's transaction, mask both addresses
            dto.setSenderAddress(AddressMaskingUtil.maskAddress(senderAddress));
            dto.setRecipientAddress(AddressMaskingUtil.maskAddress(recipientAddress));
        }
        
        dto.setAmountADA(transaction.getAmountADA());
        dto.setNetworkId(transaction.getNetworkId());
        dto.setMetadata(transaction.getMetadata());
        dto.setCreatedAt(transaction.getCreatedAt());
        
        if (transaction.getNote() != null) {
            dto.setNoteId(transaction.getNote().getId());
            dto.setNoteTitle(transaction.getNote().getTitle());
        }
        
        return dto;
    }
    
    // Overloaded method for backward compatibility
    private TransactionResponseDto mapToResponseDto(Transaction transaction) {
        return mapToResponseDto(transaction, null);
    }
}
