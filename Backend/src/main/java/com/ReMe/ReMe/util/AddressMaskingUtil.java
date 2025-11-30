package com.ReMe.ReMe.util;

/**
 * Utility class for masking wallet addresses to protect user privacy and security.
 * Only shows partial addresses to prevent wallet hacking attempts.
 */
public class AddressMaskingUtil {
    
    private static final int VISIBLE_START_CHARS = 8;
    private static final int VISIBLE_END_CHARS = 8;
    private static final String MASK_CHAR = "•";
    
    /**
     * Masks a wallet address showing only the first and last few characters.
     * Format: first8chars...last8chars
     * 
     * @param address The full wallet address to mask
     * @return Masked address string, or original if address is too short
     */
    public static String maskAddress(String address) {
        if (address == null || address.isEmpty()) {
            return address;
        }
        
        // If address is short enough, return as is
        if (address.length() <= VISIBLE_START_CHARS + VISIBLE_END_CHARS) {
            return address;
        }
        
        // Mask the middle portion
        String start = address.substring(0, VISIBLE_START_CHARS);
        String end = address.substring(address.length() - VISIBLE_END_CHARS);
        
        return start + "..." + end;
    }
    
    /**
     * Returns the full address if it belongs to the user, otherwise returns a masked version.
     * 
     * @param address The wallet address
     * @param userAddress The user's wallet address to compare against
     * @return Full address if it matches user's address, masked otherwise
     */
    public static String maskAddressForUser(String address, String userAddress) {
        if (address == null || address.isEmpty()) {
            return address;
        }
        
        // If this is the user's own address, show it fully
        if (address.equals(userAddress)) {
            return address;
        }
        
        // Otherwise, mask it
        return maskAddress(address);
    }
    
    /**
     * Checks if an address should be shown in full based on user context.
     * 
     * @param address The address to check
     * @param userAddresses Array of user's addresses (can be null or empty)
     * @return true if address belongs to user, false otherwise
     */
    public static boolean isUserAddress(String address, String... userAddresses) {
        if (address == null || userAddresses == null || userAddresses.length == 0) {
            return false;
        }
        
        for (String userAddr : userAddresses) {
            if (address.equals(userAddr)) {
                return true;
            }
        }
        
        return false;
    }
}

