package com.ReMe.ReMe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ReMe.ReMe.entity.MarketplaceNote;
import com.ReMe.ReMe.entity.User;

@Repository
public interface MarketplaceNoteRepository extends JpaRepository<MarketplaceNote, Long> {
    
    List<MarketplaceNote> findByIsActiveTrueOrderByCreatedAtDesc();
    
    List<MarketplaceNote> findBySellerAndIsActiveTrueOrderByCreatedAtDesc(User seller);
    
    List<MarketplaceNote> findBySellerOrderByCreatedAtDesc(User seller);
    
    @Query("SELECT m FROM MarketplaceNote m WHERE m.isActive = true AND " +
           "(LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY m.createdAt DESC")
    List<MarketplaceNote> searchActiveNotes(@Param("query") String query);
}
