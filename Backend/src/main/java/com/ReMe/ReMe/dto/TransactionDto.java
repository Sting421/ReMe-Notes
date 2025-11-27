package com.ReMe.ReMe.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TransactionDto {
    
    @NotBlank(message = "Transaction hash is required")
    private String txHash;
    
    @NotBlank(message = "Sender address is required")
    private String senderAddress;
    
    @NotBlank(message = "Recipient address is required")
    private String recipientAddress;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    private BigDecimal amountADA;
    
    private Long noteId;
    
    private Integer networkId;
    
    private String metadata;
    
    // Constructors
    public TransactionDto() {}
    
    public TransactionDto(String txHash, String senderAddress, String recipientAddress, 
                         BigDecimal amountADA) {
        this.txHash = txHash;
        this.senderAddress = senderAddress;
        this.recipientAddress = recipientAddress;
        this.amountADA = amountADA;
    }
    
    // Getters and Setters
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
}
