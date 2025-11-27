package com.ReMe.ReMe.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MarketplaceNoteResponseDto {
    
    private Long id;
    private String title;
    private String description;
    private String contentPreview; // First 200 characters
    private String fullContent; // Only included if user has purchased
    private BigDecimal priceAda;
    private String sellerWalletAddress;
    private Boolean isActive;
    private Integer viewCount;
    private Integer purchaseCount;
    private Boolean isPurchased; // Whether current user has purchased this note
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public MarketplaceNoteResponseDto() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getContentPreview() {
        return contentPreview;
    }
    
    public void setContentPreview(String contentPreview) {
        this.contentPreview = contentPreview;
    }
    
    public String getFullContent() {
        return fullContent;
    }
    
    public void setFullContent(String fullContent) {
        this.fullContent = fullContent;
    }
    
    public BigDecimal getPriceAda() {
        return priceAda;
    }
    
    public void setPriceAda(BigDecimal priceAda) {
        this.priceAda = priceAda;
    }
    
    public String getSellerWalletAddress() {
        return sellerWalletAddress;
    }
    
    public void setSellerWalletAddress(String sellerWalletAddress) {
        this.sellerWalletAddress = sellerWalletAddress;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Integer getViewCount() {
        return viewCount;
    }
    
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }
    
    public Integer getPurchaseCount() {
        return purchaseCount;
    }
    
    public void setPurchaseCount(Integer purchaseCount) {
        this.purchaseCount = purchaseCount;
    }
    
    public Boolean getIsPurchased() {
        return isPurchased;
    }
    
    public void setIsPurchased(Boolean isPurchased) {
        this.isPurchased = isPurchased;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
