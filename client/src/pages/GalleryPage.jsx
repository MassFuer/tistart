import { useState, useEffect } from "react";
import { artworksAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import toast from "react-hot-toast";
import { useListing } from "../hooks/useListing";
import "./GalleryPage.css";

const GalleryPage = () => {
  const {
    data: artworks,
    loading: isLoading,
    error,
    pagination,
    filters,
    updateFilter,
    updateFilters,
    setPage,
    sort,
    setSort,
    refresh
  } = useListing({
    apiFetcher: artworksAPI.getAll,
    initialFilters: {
      category: "",
      minPrice: "",
      maxPrice: "",
      artist: "",
      isForSale: "",
      materials: "",
      colors: "",
      search: "",
    },
    initialSort: "-createdAt",
  });

  const [artists, setArtists] = useState([]);
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [colorsOptions, setColorsOptions] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const sortOptions = [
    { value: "-createdAt", label: "Newest" },
    { value: "price", label: "Price: Low to High" },
    { value: "-price", label: "Price: High to Low" },
    { value: "title", label: "Title: A to Z" },
    { value: "-title", label: "Title: Z to A" },
    { value: "-numOfReviews", label: "Most Reviewed" },
    { value: "-averageRating", label: "Highest Rated" },
  ];

  const categories = [
    "painting",
    "sculpture",
    "photography",
    "digital",
    "music",
    "video",
    "other",
  ];

  // Derived state effects
  useEffect(() => {
    if (artworks.length > 0) {
      // Extract unique artists
      const uniqueArtists = {};
      artworks.forEach((artwork) => {
        if (artwork.artist && artwork.artist._id) {
          uniqueArtists[artwork.artist._id] =
            artwork.artist.firstName + " " + artwork.artist.lastName;
        }
      });
      setArtists(
        Object.entries(uniqueArtists).map(([id, name]) => ({ id, name }))
      );

      // Extract unique materials
      const uniqueMaterials = new Set();
      artworks.forEach((artwork) => {
        if (artwork.materialsUsed && Array.isArray(artwork.materialsUsed)) {
          artwork.materialsUsed.forEach((material) => {
            uniqueMaterials.add(material);
          });
        }
      });
      setMaterialsOptions(Array.from(uniqueMaterials).sort());

      // Extract unique colors
      const uniqueColors = new Set();
      artworks.forEach((artwork) => {
        if (artwork.colors && Array.isArray(artwork.colors)) {
          artwork.colors.forEach((color) => {
            uniqueColors.add(color);
          });
        }
      });
      setColorsOptions(Array.from(uniqueColors).sort());
    }
  }, [artworks]);

  const handleFilterChange = (e) => {
    const { name, type, value, checked } = e.target;
    const filterValue = type === "checkbox" ? checked : value;
    updateFilter(name, filterValue);
  };

  const resetFilters = () => {
    updateFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      artist: "",
      isForSale: "",
      materials: "",
      colors: "",
      search: "",
    });
    setSort("-createdAt");
    toast.success("Filters reset");
  };

  const removeFilter = (filterKey) => {
    updateFilter(filterKey, "");
    toast.success(`${filterKey} filter removed`);
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.search)
      active.push({ key: "search", label: "Search", value: filters.search });
    if (filters.category) {
      const categoryLabel = categories.find((c) => c === filters.category);
      active.push({ key: "category", label: "Category", value: categoryLabel || filters.category });
    }
    if (filters.artist) {
      const artist = artists.find((a) => a.id === filters.artist);
      active.push({
        key: "artist",
        label: "Artist",
        value: artist?.name || filters.artist,
      });
    }
    if (filters.isForSale)
      active.push({
        key: "isForSale",
        label: "Status",
        value: "For Sale Only",
      });
    if (filters.materials)
      active.push({
        key: "materials",
        label: "Material",
        value: filters.materials,
      });
    if (filters.colors)
      active.push({ key: "colors", label: "Color", value: filters.colors });
    if (filters.minPrice)
      active.push({
        key: "minPrice",
        label: "Min Price",
        value: `$${filters.minPrice}`,
      });
    if (filters.maxPrice)
      active.push({
        key: "maxPrice",
        label: "Max Price",
        value: `$${filters.maxPrice}`,
      });
    return active;
  };

  const activeFilterCount = getActiveFilters().length;

  return (
    <div className="gallery-page">
      <div className="page-header">
        <h1>Gallery</h1>
        <p>Discover unique artworks from talented artists</p>
      </div>

      <div className="gallery-controls">
        <div className="search-sort-bar">
          <div className="search-form">
            <SearchBar
                value={filters.search}
                onSearch={(val) => updateFilter("search", val)}
                placeholder="Search by title, artist or company..."
            />
            {/* </div> removed extra div from conflict */}
          </div>

          <div className="sort-container">
            <label htmlFor="sort-select">Sort:</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="sort-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {getActiveFilters().length > 0 && (
          <div className="active-filters">
            <div className="active-filters-header">
              <h3>Active Filters</h3>
              <button onClick={resetFilters} className="btn btn-reset">
                Reset All
              </button>
            </div>
            <div className="active-filters-list">
              {getActiveFilters().map((filter) => (
                <span key={filter.key} className="filter-tag">
                  <strong>{filter.label}:</strong> {filter.value}
                  <button
                    className="filter-tag-close"
                    onClick={() => removeFilter(filter.key)}
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="gallery-layout">
        <button
          className="filter-toggle"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          aria-expanded={isFilterPanelOpen}
        >
          <span className="filter-toggle-icon">⚙️</span>
          <span className="filter-toggle-text">Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
          <span
            className={`filter-toggle-arrow ${isFilterPanelOpen ? "open" : ""}`}
          >
            ▼
          </span>
        </button>

        <aside
          className={`filter-panel ${isFilterPanelOpen ? "open" : "closed"}`}
        >
          <div className="filter-section">
            <h4 className="filter-section-title">Category & Artist</h4>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              name="artist"
              value={filters.artist}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Artists</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                name="isForSale"
                checked={filters.isForSale === "true" || filters.isForSale === true}
                onChange={(e) => updateFilter("isForSale", e.target.checked ? "true" : "")}
              />
              <span>For Sale Only</span>
            </label>
          </div>

          <div className="filter-section">
            <h4 className="filter-section-title">Price Range</h4>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min Price"
              className="filter-input"
            />
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max Price"
              className="filter-input"
            />
          </div>

          <div className="filter-section">
            <h4 className="filter-section-title">Attributes</h4>
            <select
              name="materials"
              value={filters.materials}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Materials</option>
              {materialsOptions.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>

            <select
              name="colors"
              value={filters.colors}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Colors</option>
              {colorsOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={refresh} className="btn btn-secondary">
              Apply Filters
            </button>
            <button onClick={resetFilters} className="btn btn-outline">
              Clear All
            </button>
          </div>
        </aside>

        <main className="gallery-main">
          {isLoading ? (
            <Loading message="Loading artworks..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={refresh} />
          ) : artworks.length === 0 ? (
            <EmptyState
              message="No artworks found matching your criteria"
              icon="🎨"
            />
          ) : (
            <>
              <div className="artwork-grid">
                {artworks.map((artwork) => (
                  <ArtworkCard key={artwork._id} artwork={artwork} />
                ))}
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={setPage}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default GalleryPage;
