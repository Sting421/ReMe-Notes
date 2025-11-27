package com.ReMe.ReMe.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponseDto {
    
    private Long id;
    private String txHash;
    private String senderAddress;
    private String recipientAddress;
    private BigDecimal amountADA;
    private Long noteId;
    private String noteTitle;
    private Integer networkId;
    private String metadata;
    private LocalDateTime createdAt;
    
    // Constructors
    public TransactionResponseDto() {}
    
    public TransactionResponseDto(Long id, String txHash, String senderAddress, 
                                 String recipientAddress, BigDecimal amountADA, 
                                 LocalDateTime createdAt) {
        this.id = id;
        this.txHash = txHash;
        this.senderAddress = senderAddress;
        this.recipientAddress = recipientAddress;
        this.amountADA = amountADA;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTxHash() {
        return txHash;
    }
    
    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }
    
    public String getSenderAddress() {
        return senderAddress;
    }
    
    public void setSenderAddress(String senderAddress) {
        this.senderAddress = senderAddress;
    }
    
    public String getRecipientAddress() {
        return recipientAddress;
    }
    
    public void setRecipientAddress(String recipientAddress) {
        this.recipientAddress = recipientAddress;
    }
    
    public BigDecimal getAmountADA() {
        return amountADA;
    }
    
    public void setAmountADA(BigDecimal amountADA) {
        this.amountADA = amountADA;
    }
    
    public Long getNoteId() {
        return noteId;
    }
    
    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }
    
    public String getNoteTitle() {
        return noteTitle;
    }
    
    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
    }
    
    public Integer getNetworkId() {
        return networkId;
    }
    
    public void setNetworkId(Integer networkId) {
        this.networkId = networkId;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
