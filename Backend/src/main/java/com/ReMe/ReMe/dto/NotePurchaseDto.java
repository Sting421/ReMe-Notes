package com.ReMe.ReMe.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NotePurchaseDto {
    
    @NotNull(message = "Marketplace note ID is required")
    private Long marketplaceNoteId;
    
    @NotBlank(message = "Transaction hash is required")
    private String transactionHash;
    
    @NotBlank(message = "Buyer wallet address is required")
    private String buyerWalletAddress;
    
    @NotNull(message = "Purchase price is required")
    private BigDecimal purchasePriceAda;
    
    // Constructors
    public NotePurchaseDto() {}
    
    public NotePurchaseDto(Long marketplaceNoteId, String transactionHash, 
                          String buyerWalletAddress, BigDecimal purchasePriceAda) {
        this.marketplaceNoteId = marketplaceNoteId;
        this.transactionHash = transactionHash;
        this.buyerWalletAddress = buyerWalletAddress;
        this.purchasePriceAda = purchasePriceAda;
    }
    
    // Getters and Setters
    public Long getMarketplaceNoteId() {
        return marketplaceNoteId;
    }
    
    public void setMarketplaceNoteId(Long marketplaceNoteId) {
        this.marketplaceNoteId = marketplaceNoteId;
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
    
    public BigDecimal getPurchasePriceAda() {
        return purchasePriceAda;
    }
    
    public void setPurchasePriceAda(BigDecimal purchasePriceAda) {
        this.purchasePriceAda = purchasePriceAda;
    }
}
