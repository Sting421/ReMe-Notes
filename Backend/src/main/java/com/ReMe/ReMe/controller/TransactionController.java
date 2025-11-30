package com.ReMe.ReMe.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ReMe.ReMe.dto.TransactionDto;
import com.ReMe.ReMe.dto.TransactionResponseDto;
import com.ReMe.ReMe.service.TransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
@Validated
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;
    
    @PostMapping
    public ResponseEntity<TransactionResponseDto> createTransaction(
            @Valid @RequestBody TransactionDto transactionDto,
            Principal principal) {
        try {
            TransactionResponseDto response = transactionService.createTransaction(
                transactionDto, 
                principal.getName()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping
    public ResponseEntity<List<TransactionResponseDto>> getUserTransactions(Principal principal) {
        List<TransactionResponseDto> transactions = transactionService.getUserTransactions(
            principal.getName()
        );
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/{txHash}")
    public ResponseEntity<TransactionResponseDto> getTransactionByHash(
            @PathVariable String txHash,
            Principal principal) {
        try {
            TransactionResponseDto transaction = transactionService.getTransactionByHash(
                txHash, 
                principal.getName()
            );
            return ResponseEntity.ok(transaction);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<TransactionResponseDto>> getNoteTransactions(
            @PathVariable Long noteId,
            Principal principal) {
        try {
            List<TransactionResponseDto> transactions = transactionService.getNoteTransactions(
                noteId, 
                principal.getName()
            );
            return ResponseEntity.ok(transactions);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
