package com.ReMe.ReMe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ReMe.ReMe.entity.MarketplaceNote;
import com.ReMe.ReMe.entity.NotePurchase;

@Repository
public interface NotePurchaseRepository extends JpaRepository<NotePurchase, Long> {
    
    Optional<NotePurchase> findByMarketplaceNoteAndBuyerWalletAddress(MarketplaceNote marketplaceNote, String buyerWalletAddress);
    
    List<NotePurchase> findByBuyerWalletAddressOrderByPurchasedAtDesc(String buyerWalletAddress);
    
    List<NotePurchase> findBySellerWalletAddressOrderByPurchasedAtDesc(String sellerWalletAddress);
    
    boolean existsByMarketplaceNoteAndBuyerWalletAddress(MarketplaceNote marketplaceNote, String buyerWalletAddress);
    
    Optional<NotePurchase> findByTransactionHash(String transactionHash);
}
