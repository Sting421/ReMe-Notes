package com.ReMe.ReMe.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "transactions")
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    @NotBlank(message = "Transaction hash is required")
    private String txHash;
    
    @Column(nullable = false)
    @NotBlank(message = "Sender address is required")
    private String senderAddress;
    
    @Column(nullable = false)
    @NotBlank(message = "Recipient address is required")
    private String recipientAddress;
    
    @Column(nullable = false, precision = 20, scale = 6)
    @NotNull(message = "Amount is required")
    private BigDecimal amountADA;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "network_id")
    private Integer networkId;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    // Constructors
    public Transaction() {}
    
    public Transaction(String txHash, String senderAddress, String recipientAddress, 
                      BigDecimal amountADA, User user) {
        this.txHash = txHash;
        this.senderAddress = senderAddress;
        this.recipientAddress = recipientAddress;
        this.amountADA = amountADA;
        this.user = user;
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
    
    public Note getNote() {
        return note;
    }
    
    public void setNote(Note note) {
        this.note = note;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
