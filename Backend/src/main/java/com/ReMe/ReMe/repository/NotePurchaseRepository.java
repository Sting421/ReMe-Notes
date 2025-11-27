package com.ReMe.ReMe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ReMe.ReMe.entity.MarketplaceNote;
import com.ReMe.ReMe.entity.NotePurchase;
import com.ReMe.ReMe.entity.User;

@Repository
public interface NotePurchaseRepository extends JpaRepository<NotePurchase, Long> {
    
    Optional<NotePurchase> findByMarketplaceNoteAndBuyer(MarketplaceNote marketplaceNote, User buyer);
    
    List<NotePurchase> findByBuyerOrderByPurchasedAtDesc(User buyer);
    
    List<NotePurchase> findByMarketplaceNote_SellerOrderByPurchasedAtDesc(User seller);
    
    boolean existsByMarketplaceNoteAndBuyer(MarketplaceNote marketplaceNote, User buyer);
    
    Optional<NotePurchase> findByTransactionHash(String transactionHash);
}
