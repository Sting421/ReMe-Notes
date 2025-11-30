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
@Table(name = "note_purchases")
public class NotePurchase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marketplace_note_id", nullable = false)
    private MarketplaceNote marketplaceNote;
    
    @Column(nullable = false)
    @NotNull(message = "Purchase price is required")
    private BigDecimal purchasePriceAda;
    
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Transaction hash is required")
    private String transactionHash;
    
    @Column(nullable = false, length = 200)
    @NotBlank(message = "Buyer wallet address is required")
    private String buyerWalletAddress;
    
    @Column(nullable = false, length = 200)
    @NotBlank(message = "Seller wallet address is required")
    private String sellerWalletAddress;
    
    @CreationTimestamp
    @Column(name = "purchased_at", nullable = false, updatable = false)
    private LocalDateTime purchasedAt;
    
    // Constructors
    public NotePurchase() {}
    
    public NotePurchase(MarketplaceNote marketplaceNote, BigDecimal purchasePriceAda,
                       String transactionHash, String buyerWalletAddress, String sellerWalletAddress) {
        this.marketplaceNote = marketplaceNote;
        this.purchasePriceAda = purchasePriceAda;
        this.transactionHash = transactionHash;
        this.buyerWalletAddress = buyerWalletAddress;
        this.sellerWalletAddress = sellerWalletAddress;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public MarketplaceNote getMarketplaceNote() {
        return marketplaceNote;
    }
    
    public void setMarketplaceNote(MarketplaceNote marketplaceNote) {
        this.marketplaceNote = marketplaceNote;
    }
    
    public BigDecimal getPurchasePriceAda() {
        return purchasePriceAda;
    }
    
    public void setPurchasePriceAda(BigDecimal purchasePriceAda) {
        this.purchasePriceAda = purchasePriceAda;
    }
    
    public String getTransactionHash() {
        return transactionHash;
    }
    
    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }
    
    public String getBuyerWalletAddress() {
        return buyerWalletAddress;
    }
    
    public void setBuyerWalletAddress(String buyerWalletAddress) {
        this.buyerWalletAddress = buyerWalletAddress;
    }
    
    public String getSellerWalletAddress() {
        return sellerWalletAddress;
    }
    
    public void setSellerWalletAddress(String sellerWalletAddress) {
        this.sellerWalletAddress = sellerWalletAddress;
    }
    
    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }
    
    public void setPurchasedAt(LocalDateTime purchasedAt) {
        this.purchasedAt = purchasedAt;
    }
}
