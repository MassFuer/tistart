import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export const useListing = ({
  apiFetcher,
  initialFilters = {},
  initialSort = "",
  onError,
  enabled = true,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12, // Default limit, can be overridden by initialFilters
    ...initialFilters,
  });
  const [sort, setSort] = useState(initialSort);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      // Merge filters and sort, removing empty values
      const params = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      if (sort) {
        params.sort = sort;
      }

      const response = await apiFetcher(params);
      setData(response.data.data);
      setPagination(response.data.pagination || {});
      return response;
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load data";
      setError(msg);
      if (onError) {
        onError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetcher, filters, sort, onError]);

  // Trigger fetch when filters or sort change
  useEffect(() => {
    fetch();
  }, [fetch, enabled]);

  // Helper to update a single filter and reset page
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Always reset to page 1 on filter change
    }));
  };

  // Helper to update multiple filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  // Helper specifically for page change
  const setPage = (pageNumber) => {
    setFilters((prev) => ({
      ...prev,
      page: pageNumber,
    }));
  };

  return {
    data,
    loading,
    error,
    pagination,
    filters,
    setFilters, // Direct access if needed
    updateFilter,
    updateFilters,
    setPage,
    sort,
    setSort,
    refresh: fetch,
  };
};
