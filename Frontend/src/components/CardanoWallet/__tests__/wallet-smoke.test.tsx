/**
 * Smoke test for WalletButton component
 * 
 * To run tests:
 * 1. Install a test runner (e.g., Vitest):
 *    npm install -D vitest @testing-library/react @testing-library/jest-dom
 * 
 * 2. Add to package.json scripts:
 *    "test": "vitest"
 * 
 * 3. Run tests:
 *    npm test
 * 
 * Note: This is a basic smoke test. For full testing, you'll need to:
 * - Mock the window.cardano object
 * - Mock the useCardano hook
 * - Add more comprehensive test cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletButton } from '../WalletButton';

// Mock the useCardano hook
vi.mock('@/hooks/useCardano', () => ({
  useCardano: vi.fn(() => ({
    isConnected: false,
    isConnecting: false,
    walletName: null,
    networkId: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    error: null,
  })),
}));

describe('WalletButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WalletButton />);
    expect(screen.getByText(/Connect Lace Wallet/i)).toBeInTheDocument();
  });

  it('shows connect button when not connected', () => {
    render(<WalletButton />);
    const button = screen.getByRole('button', { name: /Connect Lace Wallet/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  // Additional tests would require mocking the hook with different states
  // Example:
  // it('shows connected state', () => {
  //   vi.mocked(useCardano).mockReturnValue({
  //     isConnected: true,
  //     walletName: 'Lace',
  //     networkId: 0,
  //     // ... other properties
  //   });
  //   render(<WalletButton />);
  //   expect(screen.getByText(/Lace \(Preview\)/i)).toBeInTheDocument();
  // });
});


