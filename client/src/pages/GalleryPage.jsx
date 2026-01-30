import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import { useAuth } from "../context/AuthContext";
import { useScrollRestore } from "../hooks/useScrollRestore";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { useListing } from "../hooks/useListing";
import { useNavigation } from "../context/NavigationContext";
import { toast } from "sonner";
import { Plus, Filter } from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "../components/common/Pagination";
import { FilterSheet, FilterAside } from "../components/common/FilterSidebar";

// Extracted Component imported
import ArtworkFilters from "../components/artwork/ArtworkFilters";

const GalleryPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
  const { isNavbarHidden } = useNavigation();
  const [showFilters, setShowFilters] = useState(true);
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
      category: "", // Backend expects empty string for no filter
      minPrice: "",
      maxPrice: "",
      artist: "", // Backend expects empty string or valid ID
      isForSale: "",
      materials: "", // Keeping simple text for now, or could change to array
      colors: "",
      search: ""
    },
    initialSort: "-createdAt",
    syncWithUrl: true,
  });

  // Restore scroll position after data loads
  useScrollRestore(!isLoading);

  const [artists, setArtists] = useState([]);
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [colorsOptions, setColorsOptions] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]); // Local state for slider

  // Sync slider with filters
  useEffect(() => {
     if (filters.minPrice || filters.maxPrice) {
         setPriceRange([Number(filters.minPrice) || 0, Number(filters.maxPrice) || 10000]);
     }
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceChange = (value) => {
      setPriceRange(value);
      // Debounce could be good here, but for now update on commit (onValueCommit) usually better
  };
  
  const handlePriceCommit = (value) => {
      updateFilters({
          ...filters,
          minPrice: value[0],
          maxPrice: value[1]
      });
  };

  const categories = [
    "painting",
    "sculpture",
    "photography",
    "digital",
    "music",
    "video",
    "other",
  ];

  const sortOptions = [
    { value: "-createdAt", label: "Newest" },
    { value: "price", label: "Price: Low to High" },
    { value: "-price", label: "Price: High to Low" },
    { value: "title", label: "Title: A to Z" },
    { value: "-title", label: "Title: Z to A" },
    { value: "-numOfReviews", label: "Most Reviewed" },
    { value: "-averageRating", label: "Highest Rated" },
  ];

  // Derived state effects (Data Extraction)
  useEffect(() => {
    if (artworks.length > 0) {
      const uniqueArtists = new Map();
      const uniqueMaterials = new Set();
      const uniqueColors = new Set();

      artworks.forEach((artwork) => {
        if (artwork.artist?._id) {
            uniqueArtists.set(artwork.artist._id, `${artwork.artist.firstName} ${artwork.artist.lastName}`);
        }
        artwork.materialsUsed?.forEach((m) => uniqueMaterials.add(m));
        artwork.colors?.forEach((c) => uniqueColors.add(c));
      });

      setArtists(Array.from(uniqueArtists.entries()).map(([id, name]) => ({ id, name })));
      setMaterialsOptions(Array.from(uniqueMaterials).sort());
      setColorsOptions(Array.from(uniqueColors).sort());
    }
  }, [artworks]);

  const clearAllFilters = () => {
      updateFilters({
          category: "",
          minPrice: "",
          maxPrice: "",
          artist: "",
          isForSale: "",
          materials: "",
          colors: "",
          search: ""
      });
      setSort("-createdAt");
      toast.success("Filters cleared");
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Fixed Header */}
      <div 
        className="z-40 bg-background/95 backdrop-blur border-b transition-[top] duration-300 ease-in-out shadow-sm fixed left-0 right-0"
        style={{ top: isNavbarHidden ? "0px" : "4rem" }}
      >
          <div className="container mx-auto px-2 sm:px-4 py-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
                      <div className="flex items-center gap-3">
                          <p className="text-muted-foreground">
                              Showing {artworks.length} of {pagination.total || 0} artworks
                          </p>
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowFilters(!showFilters)}
                              className="hidden lg:flex items-center gap-1.5 h-7 px-2 text-xs"
                          >
                              <Filter className="h-3.5 w-3.5" />
                              {showFilters ? 'Hide' : 'Show'} Filters
                          </Button>
                      </div>
                  </div>
                  
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                          {/* Mobile Filter Sheet */}
                          <FilterSheet title="Filter Artworks" description="Refine your search results">
                              <ArtworkFilters
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    categories={categories}
                                    priceRange={priceRange}
                                    handlePriceChange={handlePriceChange}
                                    handlePriceCommit={handlePriceCommit}
                                    artists={artists}
                                    materialsOptions={materialsOptions}
                                    colorsOptions={colorsOptions}
                                    clearAllFilters={clearAllFilters}
                              />
                          </FilterSheet>

                          <div className="flex-1 w-auto min-w-[120px] sm:w-[180px] sm:flex-none">
                              <Select value={sort} onValueChange={setSort}>
                                  <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Sort by" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {sortOptions.map(opt => (
                                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>

                          {(isVerifiedArtist || isAdmin) && (
                              <Button asChild size="icon" className="bg-green-700 hover:bg-green-800 text-white h-9 w-9 sm:w-auto sm:h-9 sm:px-4">
                                  <Link to="/artworks/new">
                                      <Plus className="h-5 w-5 sm:mr-2" />
                                      <span className="hidden sm:inline">Create Artwork</span>
                                  </Link>
                              </Button>
                          )}
                      </div>
              </div>
          </div>
      </div>

      {/* Spacer */}
      <div className="h-[180px] md:h-[120px] w-full" />

      <div className="container mx-auto px-2 sm:px-4 flex flex-col lg:flex-row gap-8 relative items-start pb-20">
          {/* DESKTOP SIDEBAR */}
          <FilterAside headerVisible="10rem" headerHidden="7rem" show={showFilters}>
               <ArtworkFilters
                    filters={filters}
                    updateFilter={updateFilter}
                    categories={categories}
                    priceRange={priceRange}
                    handlePriceChange={handlePriceChange}
                    handlePriceCommit={handlePriceCommit}
                    artists={artists}
                    materialsOptions={materialsOptions}
                    colorsOptions={colorsOptions}
                    clearAllFilters={clearAllFilters}
               />
          </FilterAside>

          {/* MAIN GRID */}
          <main className="w-full lg:flex-1 lg:min-w-0">
               {isLoading ? (
                  <Loading />
               ) : error ? (
                   <ErrorMessage message={error} />
               ) : artworks.length === 0 ? (
                    <EmptyState
                      title="No artworks found"
                      description="Try adjusting your filters or search terms."
                      actionLabel="Clear Filters"
                      actionLink="#"
                      // We handle the click manually instead of navigating
                    />
               ) : (
                   <>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                           {artworks.map(artwork => (
                               <ArtworkCard key={artwork._id} artwork={artwork} />
                           ))}
                       </div>
                       
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={setPage}
                            itemsPerPage={filters.limit || 12}
                            onItemsPerPageChange={(size) => updateFilter("limit", size)}
                        />
                   </>
               )}
                {/* Manual fix for the clear filters button in empty state if needed,
                    but since the EmptyState component uses useNavigate,
                    we might need to wrap the action.
                    For now, I'll rely on the sidebar 'Clear All' button or add a specific handler if requested.
                    To perfectly match the previous logic: */}
                {artworks.length === 0 && (
                     <div className="flex justify-center mt-4">
                         <Button variant="link" onClick={clearAllFilters}>
                             Clear all filters
                         </Button>
                     </div>
                )}
          </main>
      </div>
    </div>
  );
};

export default GalleryPage;
