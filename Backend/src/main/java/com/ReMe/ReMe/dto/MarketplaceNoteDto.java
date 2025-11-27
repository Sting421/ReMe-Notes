package com.ReMe.ReMe.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class MarketplaceNoteDto {
    
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotBlank(message = "Content is required")
    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    private String content;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal priceAda;
    
    @NotBlank(message = "Seller wallet address is required")
    private String sellerWalletAddress;
    
    // Constructors
    public MarketplaceNoteDto() {}
    
    public MarketplaceNoteDto(String title, String description, String content, 
                             BigDecimal priceAda, String sellerWalletAddress) {
        this.title = title;
        this.description = description;
        this.content = content;
        this.priceAda = priceAda;
        this.sellerWalletAddress = sellerWalletAddress;
    }
    
    // Getters and Setters
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
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
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
}
