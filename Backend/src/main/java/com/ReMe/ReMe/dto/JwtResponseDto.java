package com.ReMe.ReMe.dto;

public class JwtResponseDto {
    
    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    
    // Constructors
    public JwtResponseDto() {}
    
    public JwtResponseDto(String token, String username, String email) {
        this.token = token;
        this.username = username;
        this.email = email;
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
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}
