/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import { useQuery } from '@tanstack/react-query';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  it('renders skeleton loader when data is loading', () => {
    useQuery.mockReturnValue({ isLoading: true });
    renderWithProviders(<AdminDashboard />);
    // Check for some pulse animation divs
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders dashboard stats when data is loaded', async () => {
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'dashboard-stats') {
        return { 
          data: { 
            todaySales: 5000, 
            billsToday: 10, 
            pendingPrescriptions: 5, 
            lowStockAlerts: 2, 
            activeStaff: 3 
          }, 
          isLoading: false 
        };
      }
      if (queryKey[0] === 'dashboard-lowstock') return { data: [], isLoading: false };
      if (queryKey[0] === 'dashboard-staff') return { data: [], isLoading: false };
      if (queryKey[0] === 'dashboard-activity') return { data: [], isLoading: false };
      return { data: null, isLoading: false };
    });

    renderWithProviders(<AdminDashboard />);
    
    expect(screen.getByText('₹5,000')).toBeDefined();
    // Use getAllByText if it might be duplicated, or just check the first one
    expect(screen.getByText('10')).toBeDefined();
    // For "5", let's check it's there
    const elementsWith5 = screen.getAllByText('5');
    expect(elementsWith5.length).toBeGreaterThan(0);
  });
});
