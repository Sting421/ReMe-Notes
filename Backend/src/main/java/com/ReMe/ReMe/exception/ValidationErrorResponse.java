package com.ReMe.ReMe.exception;

import java.time.LocalDateTime;
import java.util.Map;

public class ValidationErrorResponse {
    
    private int status;
    private String error;
    private Map<String, String> errors;
    private LocalDateTime timestamp;
    
    public ValidationErrorResponse() {}
    
    public ValidationErrorResponse(int status, String error, Map<String, String> errors, LocalDateTime timestamp) {
        this.status = status;
        this.error = error;
        this.errors = errors;
        this.timestamp = timestamp;
    }
    
    // Getters and Setters
    public int getStatus() {
        return status;
    }
    
    public void setStatus(int status) {
        this.status = status;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public Map<String, String> getErrors() {
        return errors;
    }
    
    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
