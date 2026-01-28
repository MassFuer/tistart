import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { useListing } from "../hooks/useListing";
import { toast } from "sonner";
import { SlidersHorizontal, X, ArrowUpDown, Filter, Plus } from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import Pagination from "../components/common/Pagination";

// Extracted Component imported
import ArtworkFilters from "../components/artwork/ArtworkFilters";

const GalleryPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
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
  });

  const [artists, setArtists] = useState([]);
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [colorsOptions, setColorsOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
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
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 mb-8 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
                  <p className="text-muted-foreground">
                      Showing {artworks.length} of {pagination.total || 0} artworks
                  </p>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Mobile Filter Sheet */}
                  <Sheet>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="lg:hidden">
                              <Filter className="mr-2 h-4 w-4" /> Filters
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                          <SheetHeader>
                              <SheetTitle>Filter Artworks</SheetTitle>
                              <SheetDescription>Refine your search results</SheetDescription>
                          </SheetHeader>
                          <div className="py-4">
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
                          </div>
                          <SheetFooter>
                              <SheetClose asChild>
                                  <Button className="w-full">Show Results</Button>
                              </SheetClose>
                          </SheetFooter>
                      </SheetContent>
                  </Sheet>

                  {/* Desktop Filter Toggle */}
                  <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hidden lg:flex" 
                        onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> 
                      {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                  
                  <div className="w-[180px]">
                      <Select value={sort} onValueChange={setSort}>
                          <SelectTrigger>
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
                      <Button asChild size="sm">
                          <Link to="/artworks/new">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Artwork
                          </Link>
                      </Button>
                  )}
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative items-start">
          {/* DESKTOP SIDEBAR */}
          {showFilters && (
              <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 h-auto self-start p-6 border rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
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
              </aside>
          )}

          {/* MAIN GRID */}
          <main className="flex-1 min-w-0">
               {isLoading ? (
                  <Loading />
               ) : error ? (
                   <ErrorMessage message={error} />
               ) : artworks.length === 0 ? (
                   <div className="py-20 text-center">
                        <EmptyState message="No artworks found" />
                        <Button 
                            variant="link" 
                            onClick={clearAllFilters} 
                            className="mt-4"
                        >
                            Clear all filters
                        </Button>
                   </div>
               ) : (
                   <>
                       <div className={`grid grid-cols-2 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 md:gap-6`}>
                           {artworks.map(artwork => (
                               <ArtworkCard key={artwork._id} artwork={artwork} />
                           ))}
                       </div>
                       
                       <div className="mt-12">
                           <Pagination
                               currentPage={pagination.page}
                               totalPages={pagination.pages}
                               onPageChange={setPage}
                           />
                       </div>
                   </>
               )}
          </main>
      </div>
    </div>
  );
};

export default GalleryPage;
