package com.ReMe.ReMe.dto;

public class JwtResponseDto {
    
    private String token;
    private String type = "Bearer";
    private Long userId;
    
    // Constructors
    public JwtResponseDto() {}
    
    public JwtResponseDto(String token, Long userId) {
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
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
