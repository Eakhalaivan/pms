import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useSearchParams } from 'react-router-dom';

/**
 * Reusable hook for paginated data fetching
 * @param {string} queryKey - Unique key for the query
 * @param {string} endpoint - API endpoint to fetch from
 * @param {Object} extraParams - Additional query parameters
 */
export const usePageData = (queryKey, endpoint, extraParams = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);

  const query = useQuery({
    queryKey: [queryKey, page, size, extraParams],
    queryFn: () => api.get(endpoint, {
      params: { page, size, ...extraParams }
    }).then(res => res.data.data),
    staleTime: 5000,
  });

  const goToPage = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage);
      return prev;
    });
  };

  return {
    ...query,
    page,
    size,
    goToPage,
    totalPages: query.data?.totalPages || 0,
    totalElements: query.data?.totalElements || 0,
    items: query.data?.content || [],
  };
};
