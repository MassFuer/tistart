import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";

export const useListing = ({
  apiFetcher,
  initialFilters = {},
  initialSort = "",
  onError,
  enabled = true,
  syncWithUrl = false,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  // Use refs to track state without causing re-renders
  const lastUrlRef = useRef(location.search);
  const userInitiatedChange = useRef(false);

  // Helper to read filters from URL
  const getFiltersFromUrl = useCallback(() => {
    const base = {
      page: 1,
      limit: 12,
      ...initialFilters,
    };

    if (syncWithUrl) {
      const urlPage = searchParams.get("page");
      if (urlPage) base.page = parseInt(urlPage, 10) || 1;

      Object.keys(initialFilters).forEach((key) => {
        const urlValue = searchParams.get(key);
        if (urlValue !== null && urlValue !== "") {
          base[key] = urlValue;
        }
      });
    }

    return base;
  }, [searchParams, syncWithUrl]);

  const getSortFromUrl = useCallback(() => {
    if (syncWithUrl) {
      return searchParams.get("sort") || initialSort;
    }
    return initialSort;
  }, [searchParams, initialSort, syncWithUrl]);

  // Initialize state from URL
  const [filters, setFiltersInternal] = useState(getFiltersFromUrl);
  const [sort, setSortInternal] = useState(getSortFromUrl);

  // Wrapper to mark user-initiated changes
  const setFilters = useCallback((update) => {
    userInitiatedChange.current = true;
    setFiltersInternal(update);
  }, []);

  const setSort = useCallback((value) => {
    userInitiatedChange.current = true;
    setSortInternal(value);
  }, []);

  // Sync URL → State when browser navigation occurs (back/forward)
  useEffect(() => {
    if (!syncWithUrl) return;

    // Check if URL actually changed (browser navigation)
    if (location.search === lastUrlRef.current) return;
    lastUrlRef.current = location.search;

    // If this was a user-initiated change, don't sync back
    if (userInitiatedChange.current) {
      userInitiatedChange.current = false;
      return;
    }

    // Browser navigation - sync URL to state
    const urlFilters = getFiltersFromUrl();
    const urlSort = getSortFromUrl();

    setFiltersInternal(urlFilters);
    setSortInternal(urlSort);
  }, [location.search, syncWithUrl, getFiltersFromUrl, getSortFromUrl]);

  // Sync State → URL when user changes filters/page
  useEffect(() => {
    if (!syncWithUrl || !userInitiatedChange.current) return;

    const params = new URLSearchParams();

    if (filters.page > 1) {
      params.set("page", filters.page.toString());
    }

    if (sort && sort !== initialSort) {
      params.set("sort", sort);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (key === "page" || key === "limit") return;
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });

    const newSearch = params.toString();
    const newUrl = newSearch ? `?${newSearch}` : "";

    // Only update if URL actually changed
    if (newUrl !== lastUrlRef.current) {
      lastUrlRef.current = newUrl;
      setSearchParams(params, { replace: false });
    }

    userInitiatedChange.current = false;
  }, [filters, sort, syncWithUrl, initialSort, setSearchParams]);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
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
  }, [apiFetcher, filters, sort, onError, enabled]);

  useEffect(() => {
    fetch();
  }, [fetch, enabled]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }, [setFilters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, [setFilters]);

  const setPage = useCallback((pageNumber) => {
    setFilters((prev) => ({
      ...prev,
      page: pageNumber,
    }));
  }, [setFilters]);

  return {
    data,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    setPage,
    sort,
    setSort,
    refresh: fetch,
  };
};