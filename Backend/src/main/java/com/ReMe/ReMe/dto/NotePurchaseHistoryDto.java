package com.ReMe.ReMe.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class NotePurchaseHistoryDto {

    private Long id;
    private Long marketplaceNoteId;
    private String noteTitle;
    private BigDecimal purchasePriceAda;
    private String transactionHash;
    private String buyerWalletAddress;
    private String sellerWalletAddress;
    private LocalDateTime purchasedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMarketplaceNoteId() {
        return marketplaceNoteId;
    }

    public void setMarketplaceNoteId(Long marketplaceNoteId) {
        this.marketplaceNoteId = marketplaceNoteId;
    }

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
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
