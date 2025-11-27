package com.ReMe.ReMe.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ReMe.ReMe.dto.MarketplaceNoteDto;
import com.ReMe.ReMe.dto.MarketplaceNoteResponseDto;
import com.ReMe.ReMe.dto.NotePurchaseDto;
import com.ReMe.ReMe.entity.MarketplaceNote;
import com.ReMe.ReMe.entity.NotePurchase;
import com.ReMe.ReMe.entity.User;
import com.ReMe.ReMe.repository.MarketplaceNoteRepository;
import com.ReMe.ReMe.repository.NotePurchaseRepository;
import com.ReMe.ReMe.repository.NoteRepository;
import com.ReMe.ReMe.repository.TransactionRepository;
import com.ReMe.ReMe.repository.UserRepository;

@Service
public class MarketplaceService {
    
    @Autowired
    private MarketplaceNoteRepository marketplaceNoteRepository;
    
    @Autowired
    private NotePurchaseRepository notePurchaseRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NoteService noteService;
    
    @Autowired
    private NoteRepository noteRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Transactional
    public MarketplaceNoteResponseDto createMarketplaceNote(MarketplaceNoteDto dto, String username) {
        User seller = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = new MarketplaceNote();
        note.setTitle(dto.getTitle());
        note.setDescription(dto.getDescription());
        note.setContent(dto.getContent());
        note.setPriceAda(dto.getPriceAda());
        note.setSellerWalletAddress(dto.getSellerWalletAddress());
        note.setSeller(seller);
        
        MarketplaceNote savedNote = marketplaceNoteRepository.save(note);
        return convertToResponseDto(savedNote, seller);
    }
    
    @Transactional(readOnly = true)
    public List<MarketplaceNoteResponseDto> getAllActiveNotes(String username) {
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MarketplaceNote> notes = marketplaceNoteRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        
        // Filter out notes owned by the current user
        return notes.stream()
            .filter(note -> !note.getSeller().getId().equals(currentUser.getId()))
            .map(note -> convertToResponseDto(note, currentUser))
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MarketplaceNoteResponseDto getNoteById(Long id, String username) {
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = marketplaceNoteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marketplace note not found"));
        
        // Increment view count
        note.incrementViewCount();
        marketplaceNoteRepository.save(note);
        
        return convertToResponseDto(note, currentUser);
    }
    
    @Transactional(readOnly = true)
    public List<MarketplaceNoteResponseDto> getMyListedNotes(String username) {
        User seller = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MarketplaceNote> notes = marketplaceNoteRepository.findBySellerOrderByCreatedAtDesc(seller);
        return notes.stream()
            .map(note -> convertToResponseDto(note, seller))
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MarketplaceNoteResponseDto> searchNotes(String query, String username) {
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MarketplaceNote> notes = marketplaceNoteRepository.searchActiveNotes(query);
        
        // Filter out notes owned by the current user
        return notes.stream()
            .filter(note -> !note.getSeller().getId().equals(currentUser.getId()))
            .map(note -> convertToResponseDto(note, currentUser))
            .collect(Collectors.toList());
    }
    
    @Transactional
    public MarketplaceNoteResponseDto purchaseNote(NotePurchaseDto dto, String username) {
        User buyer = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = marketplaceNoteRepository.findById(dto.getMarketplaceNoteId())
            .orElseThrow(() -> new RuntimeException("Marketplace note not found"));
        
        // Check if already purchased
        if (notePurchaseRepository.existsByMarketplaceNoteAndBuyer(note, buyer)) {
            throw new RuntimeException("You have already purchased this note");
        }
        
        // Check if user is trying to buy their own note
        if (note.getSeller().getId().equals(buyer.getId())) {
            throw new RuntimeException("You cannot purchase your own note");
        }
        
        // Check if transaction hash is already used
        if (notePurchaseRepository.findByTransactionHash(dto.getTransactionHash()).isPresent()) {
            throw new RuntimeException("Transaction hash already used");
        }
        
        // Create purchase record
        NotePurchase purchase = new NotePurchase(
            note,
            buyer,
            dto.getPurchasePriceAda(),
            dto.getTransactionHash(),
            dto.getBuyerWalletAddress(),
            note.getSellerWalletAddress()
        );
        
        notePurchaseRepository.save(purchase);
        
        // Increment purchase count
        note.incrementPurchaseCount();
        marketplaceNoteRepository.save(note);
        
        // Create a personal note copy for the buyer
        com.ReMe.ReMe.dto.NoteDto personalNote = new com.ReMe.ReMe.dto.NoteDto();
        personalNote.setTitle(note.getTitle() + " (Purchased)");
        personalNote.setContent(note.getContent());
        com.ReMe.ReMe.dto.NoteDto createdNote = noteService.createNote(personalNote, buyer);
        
        // Create transaction record
        com.ReMe.ReMe.entity.Transaction transaction = new com.ReMe.ReMe.entity.Transaction();
        transaction.setTxHash(dto.getTransactionHash());
        transaction.setSenderAddress(dto.getBuyerWalletAddress());
        transaction.setRecipientAddress(note.getSellerWalletAddress());
        transaction.setAmountADA(dto.getPurchasePriceAda());
        transaction.setUser(buyer);
        transaction.setMetadata("Marketplace purchase: " + note.getTitle());
        
        // Link transaction to the created note
        if (createdNote.getId() != null) {
            noteRepository.findById(createdNote.getId()).ifPresent(transaction::setNote);
        }
        
        transactionRepository.save(transaction);
        
        return convertToResponseDto(note, buyer);
    }
    
    @Transactional
    public void deleteMarketplaceNote(Long id, String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = marketplaceNoteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marketplace note not found"));
        
        if (!note.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own notes");
        }
        
        // Soft delete by setting isActive to false
        note.setIsActive(false);
        marketplaceNoteRepository.save(note);
    }
    
    @Transactional
    public MarketplaceNoteResponseDto updateMarketplaceNote(Long id, MarketplaceNoteDto dto, String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = marketplaceNoteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marketplace note not found"));
        
        if (!note.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own notes");
        }
        
        note.setTitle(dto.getTitle());
        note.setDescription(dto.getDescription());
        note.setContent(dto.getContent());
        note.setPriceAda(dto.getPriceAda());
        note.setSellerWalletAddress(dto.getSellerWalletAddress());
        
        MarketplaceNote updatedNote = marketplaceNoteRepository.save(note);
        return convertToResponseDto(updatedNote, user);
    }
    
    @Transactional(readOnly = true)
    public List<MarketplaceNoteResponseDto> getMyPurchasedNotes(String username) {
        User buyer = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<NotePurchase> purchases = notePurchaseRepository.findByBuyerOrderByPurchasedAtDesc(buyer);
        return purchases.stream()
            .map(purchase -> convertToResponseDto(purchase.getMarketplaceNote(), buyer))
            .collect(Collectors.toList());
    }
    
    private MarketplaceNoteResponseDto convertToResponseDto(MarketplaceNote note, User currentUser) {
        MarketplaceNoteResponseDto dto = new MarketplaceNoteResponseDto();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setDescription(note.getDescription());
        dto.setPriceAda(note.getPriceAda());
        dto.setSellerWalletAddress(note.getSellerWalletAddress());
        dto.setIsActive(note.getIsActive());
        dto.setViewCount(note.getViewCount());
        dto.setPurchaseCount(note.getPurchaseCount());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        
        // Check if user has purchased this note
        boolean isPurchased = notePurchaseRepository.existsByMarketplaceNoteAndBuyer(note, currentUser);
        dto.setIsPurchased(isPurchased);
        
        // Check if user is the seller
        boolean isSeller = note.getSeller().getId().equals(currentUser.getId());
        
        // If purchased or is seller, provide full content, otherwise just preview
        if (isPurchased || isSeller) {
            dto.setFullContent(note.getContent());
            dto.setContentPreview(note.getContent().length() > 200 
                ? note.getContent().substring(0, 200) + "..." 
                : note.getContent());
        } else {
            dto.setContentPreview(note.getContent().length() > 200 
                ? note.getContent().substring(0, 200) + "..." 
                : note.getContent());
        }
        
        return dto;
    }
}
