package com.ReMe.ReMe.dto;

import java.util.UUID;

public class JwtResponseDto {
    
    private String token;
    private String type = "Bearer";
    private UUID userId;
    
    // Constructors
    public JwtResponseDto() {}
    
    public JwtResponseDto(String token, UUID userId) {
        this.token = token;
        this.userId = userId;
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}
