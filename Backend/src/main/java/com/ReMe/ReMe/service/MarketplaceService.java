package com.ReMe.ReMe.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ReMe.ReMe.dto.MarketplaceNoteDto;
import com.ReMe.ReMe.dto.MarketplaceNoteResponseDto;
import com.ReMe.ReMe.dto.NotePurchaseDto;
import com.ReMe.ReMe.dto.NotePurchaseHistoryDto;
import com.ReMe.ReMe.entity.MarketplaceNote;
import com.ReMe.ReMe.entity.NotePurchase;
import com.ReMe.ReMe.entity.User;
import com.ReMe.ReMe.repository.MarketplaceNoteRepository;
import com.ReMe.ReMe.repository.NotePurchaseRepository;
import com.ReMe.ReMe.repository.NoteRepository;
import com.ReMe.ReMe.repository.TransactionRepository;
import com.ReMe.ReMe.repository.UserRepository;
import com.ReMe.ReMe.util.AddressMaskingUtil;

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
        
        // Check if already purchased by this wallet address
        if (notePurchaseRepository.existsByMarketplaceNoteAndBuyerWalletAddress(note, dto.getBuyerWalletAddress())) {
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
        
        // Create purchase record (without buyer_id, only wallet addresses)
        NotePurchase purchase = new NotePurchase(
            note,
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
        
        // Get all transaction hashes for this user to find their purchases
        List<String> userTxHashes = transactionRepository.findByUserOrderByCreatedAtDesc(buyer).stream()
            .map(com.ReMe.ReMe.entity.Transaction::getTxHash)
            .collect(Collectors.toList());
        
        // Find purchases by transaction hash
        List<NotePurchase> purchases = userTxHashes.stream()
            .map(txHash -> notePurchaseRepository.findByTransactionHash(txHash))
            .filter(java.util.Optional::isPresent)
            .map(java.util.Optional::get)
            .collect(Collectors.toList());
        
        return purchases.stream()
            .map(purchase -> convertToResponseDto(purchase.getMarketplaceNote(), buyer))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotePurchaseHistoryDto> getMyPurchaseHistory(String username) {
        User buyer = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all transaction hashes for this user to find their purchases
        List<String> userTxHashes = transactionRepository.findByUserOrderByCreatedAtDesc(buyer).stream()
            .map(com.ReMe.ReMe.entity.Transaction::getTxHash)
            .collect(Collectors.toList());
        
        // Get unique buyer wallet addresses from user's transactions
        java.util.Set<String> buyerWalletAddresses = transactionRepository.findByUserOrderByCreatedAtDesc(buyer).stream()
            .map(com.ReMe.ReMe.entity.Transaction::getSenderAddress)
            .collect(Collectors.toSet());
        
        // Find purchases by buyer wallet address or transaction hash
        List<NotePurchase> purchases = buyerWalletAddresses.stream()
            .flatMap(address -> notePurchaseRepository.findByBuyerWalletAddressOrderByPurchasedAtDesc(address).stream())
            .filter(purchase -> userTxHashes.contains(purchase.getTransactionHash()))
            .sorted((a, b) -> b.getPurchasedAt().compareTo(a.getPurchasedAt()))
            .collect(Collectors.toList());

        return purchases.stream()
            .map(purchase -> mapToPurchaseHistoryDto(purchase, purchase.getBuyerWalletAddress(), true))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotePurchaseHistoryDto> getMySalesHistory(String username) {
        User seller = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get seller wallet addresses from user's marketplace notes
        List<String> sellerWalletAddresses = marketplaceNoteRepository.findBySellerOrderByCreatedAtDesc(seller).stream()
            .map(MarketplaceNote::getSellerWalletAddress)
            .distinct()
            .collect(Collectors.toList());

        // Find purchases by seller wallet address
        List<NotePurchase> purchases = sellerWalletAddresses.stream()
            .flatMap(address -> notePurchaseRepository.findBySellerWalletAddressOrderByPurchasedAtDesc(address).stream())
            .collect(Collectors.toMap(
                NotePurchase::getId,
                purchase -> purchase,
                (existing, replacement) -> existing
            ))
            .values()
            .stream()
            .sorted((a, b) -> b.getPurchasedAt().compareTo(a.getPurchasedAt()))
            .collect(Collectors.toList());

        return purchases.stream()
            .map(purchase -> mapToPurchaseHistoryDto(purchase, purchase.getSellerWalletAddress(), false))
            .collect(Collectors.toList());
    }
    
    /**
     * Gets the seller wallet address for a specific marketplace note.
     * Only returns the address if the note is active and available for purchase.
     * This is a secure endpoint that should only be called when user is about to purchase.
     * 
     * @param noteId The marketplace note ID
     * @param username The current user's username
     * @return The seller wallet address
     * @throws RuntimeException if note not found, not active, or user is trying to buy their own note
     */
    @Transactional(readOnly = true)
    public String getSellerAddressForPurchase(Long noteId, String username) {
        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        MarketplaceNote note = marketplaceNoteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Marketplace note not found"));
        
        // Security checks
        if (!note.getIsActive()) {
            throw new RuntimeException("This note is no longer available for purchase");
        }
        
        // Prevent users from getting their own seller address (they already know it)
        if (note.getSeller().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You cannot purchase your own note");
        }
        
        // Note: We can't check if already purchased here without wallet address
        // This check should be done before calling this method with the buyer's wallet address
        
        // Return the seller wallet address for purchase
        return note.getSellerWalletAddress();
    }
    
    private MarketplaceNoteResponseDto convertToResponseDto(MarketplaceNote note, User currentUser) {
        MarketplaceNoteResponseDto dto = new MarketplaceNoteResponseDto();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setDescription(note.getDescription());
        dto.setPriceAda(note.getPriceAda());
        
        // Security Note: Seller wallet addresses are kept visible in marketplace listings
        // because they are needed for payment transactions. They function like public payment addresses.
        // The real security concern is protecting buyer addresses and preventing address correlation attacks.
        // Buyer addresses are masked in purchase history (see mapToPurchaseHistoryDto).
        boolean isSeller = note.getSeller().getId().equals(currentUser.getId());
        dto.setSellerWalletAddress(note.getSellerWalletAddress());
        
        dto.setIsActive(note.getIsActive());
        dto.setViewCount(note.getViewCount());
        dto.setPurchaseCount(note.getPurchaseCount());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        
        // Check if user has purchased this note by checking their transactions
        // This is a simplified check - in production you might want to check by wallet address
        boolean isPurchased = false;
        // We can't check this directly anymore without wallet address, so we'll leave it false
        // The frontend can check if the note is in purchased notes list
        dto.setIsPurchased(isPurchased);
        
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

    /**
     * Maps NotePurchase to DTO with security-aware address masking.
     * 
     * @param purchase The purchase entity
     * @param currentUserWalletAddress The current user's wallet address viewing the history
     * @param isBuyerView true if current user is the buyer, false if seller
     * @return DTO with appropriately masked addresses
     */
    private NotePurchaseHistoryDto mapToPurchaseHistoryDto(NotePurchase purchase, String currentUserWalletAddress, boolean isBuyerView) {
        NotePurchaseHistoryDto dto = new NotePurchaseHistoryDto();
        dto.setId(purchase.getId());

        MarketplaceNote marketplaceNote = purchase.getMarketplaceNote();
        if (marketplaceNote != null) {
            dto.setMarketplaceNoteId(marketplaceNote.getId());
            dto.setNoteTitle(marketplaceNote.getTitle());
        }

        dto.setPurchasePriceAda(purchase.getPurchasePriceAda());
        dto.setTransactionHash(purchase.getTransactionHash());
        dto.setPurchasedAt(purchase.getPurchasedAt());

        // Security: Mask wallet addresses based on user role
        String buyerAddress = purchase.getBuyerWalletAddress();
        String sellerAddress = purchase.getSellerWalletAddress();
        
        if (isBuyerView) {
            // Buyer viewing their purchases: show their own address fully, mask seller's
            if (currentUserWalletAddress != null && currentUserWalletAddress.equals(buyerAddress)) {
                dto.setBuyerWalletAddress(buyerAddress); // Buyer's own address - show fully
            } else {
                dto.setBuyerWalletAddress(AddressMaskingUtil.maskAddress(buyerAddress));
            }
            // Always mask seller address for buyers
            dto.setSellerWalletAddress(AddressMaskingUtil.maskAddress(sellerAddress));
        } else {
            // Seller viewing their sales: show their own address fully, mask buyer's
            if (currentUserWalletAddress != null && currentUserWalletAddress.equals(sellerAddress)) {
                dto.setSellerWalletAddress(sellerAddress); // Seller's own address - show fully
            } else {
                dto.setSellerWalletAddress(AddressMaskingUtil.maskAddress(sellerAddress));
            }
            // Always mask buyer address for sellers
            dto.setBuyerWalletAddress(AddressMaskingUtil.maskAddress(buyerAddress));
        }

        return dto;
    }
    
    // Overloaded method for backward compatibility (should not be used in production)
    private NotePurchaseHistoryDto mapToPurchaseHistoryDto(NotePurchase purchase) {
        // Default to masking all addresses for security
        NotePurchaseHistoryDto dto = new NotePurchaseHistoryDto();
        dto.setId(purchase.getId());

        MarketplaceNote marketplaceNote = purchase.getMarketplaceNote();
        if (marketplaceNote != null) {
            dto.setMarketplaceNoteId(marketplaceNote.getId());
            dto.setNoteTitle(marketplaceNote.getTitle());
        }

        dto.setPurchasePriceAda(purchase.getPurchasePriceAda());
        dto.setTransactionHash(purchase.getTransactionHash());
        // Mask all addresses by default
        dto.setBuyerWalletAddress(AddressMaskingUtil.maskAddress(purchase.getBuyerWalletAddress()));
        dto.setSellerWalletAddress(AddressMaskingUtil.maskAddress(purchase.getSellerWalletAddress()));
        dto.setPurchasedAt(purchase.getPurchasedAt());

        return dto;
    }
}
