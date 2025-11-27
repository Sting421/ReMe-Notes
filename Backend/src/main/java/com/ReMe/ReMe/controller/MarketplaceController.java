package com.ReMe.ReMe.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ReMe.ReMe.dto.MarketplaceNoteDto;
import com.ReMe.ReMe.dto.MarketplaceNoteResponseDto;
import com.ReMe.ReMe.dto.NotePurchaseDto;
import com.ReMe.ReMe.service.MarketplaceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {
    
    @Autowired
    private MarketplaceService marketplaceService;
    
    @PostMapping("/notes")
    public ResponseEntity<?> createMarketplaceNote(
            @Valid @RequestBody MarketplaceNoteDto dto,
            Principal principal) {
        try {
            MarketplaceNoteResponseDto response = marketplaceService.createMarketplaceNote(
                dto, 
                principal.getName()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/notes")
    public ResponseEntity<?> getAllActiveNotes(Principal principal) {
        try {
            List<MarketplaceNoteResponseDto> notes = marketplaceService.getAllActiveNotes(
                principal.getName()
            );
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/notes/{id}")
    public ResponseEntity<?> getNoteById(
            @PathVariable Long id,
            Principal principal) {
        try {
            MarketplaceNoteResponseDto note = marketplaceService.getNoteById(
                id, 
                principal.getName()
            );
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/notes/my-listings")
    public ResponseEntity<?> getMyListedNotes(Principal principal) {
        try {
            List<MarketplaceNoteResponseDto> notes = marketplaceService.getMyListedNotes(
                principal.getName()
            );
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/notes/search")
    public ResponseEntity<?> searchNotes(
            @RequestParam String query,
            Principal principal) {
        try {
            List<MarketplaceNoteResponseDto> notes = marketplaceService.searchNotes(
                query, 
                principal.getName()
            );
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseNote(
            @Valid @RequestBody NotePurchaseDto dto,
            Principal principal) {
        try {
            MarketplaceNoteResponseDto response = marketplaceService.purchaseNote(
                dto, 
                principal.getName()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/notes/{id}")
    public ResponseEntity<?> updateMarketplaceNote(
            @PathVariable Long id,
            @Valid @RequestBody MarketplaceNoteDto dto,
            Principal principal) {
        try {
            MarketplaceNoteResponseDto response = marketplaceService.updateMarketplaceNote(
                id, 
                dto, 
                principal.getName()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/notes/{id}")
    public ResponseEntity<?> deleteMarketplaceNote(
            @PathVariable Long id,
            Principal principal) {
        try {
            marketplaceService.deleteMarketplaceNote(id, principal.getName());
            return ResponseEntity.ok("Marketplace note deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/purchases/my-purchases")
    public ResponseEntity<?> getMyPurchasedNotes(Principal principal) {
        try {
            List<MarketplaceNoteResponseDto> notes = marketplaceService.getMyPurchasedNotes(
                principal.getName()
            );
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
