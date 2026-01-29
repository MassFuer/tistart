import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { artworksAPI } from "../services/api";
import VideoLibraryCard from "../components/video/VideoLibraryCard";
import VideoFilters from "../components/video/VideoFilters";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useScrollRestore } from "../hooks/useScrollRestore";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { useListing } from "../hooks/useListing";
import { useNavigation } from "../context/NavigationContext";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
import PageSizeSelector from "../components/common/PageSizeSelector";
import { FilterSheet, FilterAside } from "../components/common/FilterSidebar";
import SearchBar from "../components/common/SearchBar";

const VideoLibraryPage = () => {
  const { setDarkMode } = useTheme();
  // Force Dark Mode on mount
  useEffect(() => {
      setDarkMode(true);
  }, [setDarkMode]);

  const [searchParams, setSearchParams] = useSearchParams();
  const { isVerifiedArtist, isAdmin } = useAuth();
  const { isNavbarHidden } = useNavigation();
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
      category: "video", // Fixed Category
      minPrice: "",
      maxPrice: "",
      artist: "", 
      isForSale: "",
      director: "",
      cast: "",
      team: "",
      search: ""
    },
    initialSort: "-createdAt",
    syncWithUrl: true,
  });

  // Restore scroll position after data loads
  useScrollRestore(!isLoading);

  const [artists, setArtists] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [castMembers, setCastMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]); // Local state for slider

  // Sync slider with filters
  useEffect(() => {
     if (filters.minPrice || filters.maxPrice) {
         setPriceRange([Number(filters.minPrice) || 0, Number(filters.maxPrice) || 10000]);
     }
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceChange = (value) => {
      setPriceRange(value);
  };
  
  const handlePriceCommit = (value) => {
      updateFilters({
          ...filters,
          minPrice: value[0],
          maxPrice: value[1]
      });
  };

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
      const uniqueDirectors = new Set();
      const uniqueCast = new Set();
      const uniqueTeam = new Set();

      artworks.forEach((artwork) => {
        if (artwork.artist?._id) {
            uniqueArtists.set(artwork.artist._id, `${artwork.artist.firstName} ${artwork.artist.lastName}`);
        }
        
        // Extract Video Specific Metadata
        if (artwork.video) {
             if (artwork.video.director) uniqueDirectors.add(artwork.video.director);
             if (Array.isArray(artwork.video.cast)) {
                 artwork.video.cast.forEach(c => uniqueCast.add(c));
             }
             if (Array.isArray(artwork.video.productionTeam)) {
                 artwork.video.productionTeam.forEach(member => {
                     if (member.name) uniqueTeam.add(member.name);
                 });
             }
        }
      });

      setArtists(Array.from(uniqueArtists.entries()).map(([id, name]) => ({ id, name })));
      setDirectors(Array.from(uniqueDirectors).sort());
      setCastMembers(Array.from(uniqueCast).sort());
      setTeamMembers(Array.from(uniqueTeam).sort());
    }
  }, [artworks]);

  const clearAllFilters = () => {
      updateFilters({
          category: "video", // Keep video filter
          minPrice: "",
          maxPrice: "",
          artist: "",
          isForSale: "",
          director: "",
          cast: "",
          team: "",
          search: ""
      });
      setSort("-createdAt");
      toast.success("Filters cleared");
  };

  return (
    <div className="min-h-screen bg-black text-white dark overflow-visible">
      {/* Fixed Header */}
      <div 
        className="fixed left-0 right-0 z-40 bg-black border-b border-white/10 transition-[top] duration-300 ease-in-out shadow-sm"
        style={{ top: isNavbarHidden ? "0px" : "4rem" }}
      >
          <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <h1 className="text-3xl font-bold tracking-tight text-white">Video Library</h1>
                      <p className="text-neutral-400">
                          {pagination.total || 0} movies
                      </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                       <div className="w-full md:w-64">
                      </div>

                      {/* Mobile Filter Sheet */}
                      <FilterSheet title="Filter Videos" description="Refine your search results">
                          <VideoFilters
                                filters={filters}
                                updateFilter={updateFilter}
                                priceRange={priceRange}
                                handlePriceChange={handlePriceChange}
                                handlePriceCommit={handlePriceCommit}
                                artists={artists}
                                directors={directors}
                                castMembers={castMembers}
                                teamMembers={teamMembers}
                                clearAllFilters={clearAllFilters}
                          />
                      </FilterSheet>

                      <div className="w-[180px]">
                          <Select value={sort} onValueChange={setSort}>
                              <SelectTrigger className="bg-black border-white/20 text-white">
                                  <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent className="dark bg-neutral-900 border-white/10 text-white">
                                  {sortOptions.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10">{opt.label}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>

                      {(isVerifiedArtist || isAdmin) && (
                          <Button asChild size="sm" className="bg-white text-black hover:bg-neutral-200 border-none">
                              <Link to="/artworks/new?category=video">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Video
                              </Link>
                          </Button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Spacer */}
      <div className="h-[240px] md:h-[160px] w-full" />

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 relative items-start pb-20">
          {/* DESKTOP SIDEBAR */}
          <FilterAside>
                <div className="dark text-white">
                   <VideoFilters
                        filters={filters}
                        updateFilter={updateFilter}
                        priceRange={priceRange}
                        handlePriceChange={handlePriceChange}
                        handlePriceCommit={handlePriceCommit}
                        artists={artists}
                        directors={directors}
                        castMembers={castMembers}
                        teamMembers={teamMembers}
                        clearAllFilters={clearAllFilters}
                   />
               </div>
          </FilterAside>

          {/* MAIN GRID */}
          <main className="w-full lg:flex-1 lg:min-w-0">
               {isLoading ? (
                  <Loading />
               ) : error ? (
                   <ErrorMessage message={error} />
               ) : artworks.length === 0 ? (
                   <div className="py-20 text-center">
                        <EmptyState message="No videos found" />
                        <Button 
                            variant="link" 
                            onClick={clearAllFilters} 
                            className="mt-4 text-white"
                        >
                            Clear all filters
                        </Button>
                   </div>
               ) : (
                   <>
                       {/* Video Grid - Uses video specific cards */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                           {artworks.map(artwork => (
                               <VideoLibraryCard key={artwork._id} video={artwork} className="w-full" />
                           ))}
                       </div>
                       
                       <div className="dark text-white w-full">
                           <Pagination
                               currentPage={pagination.page}
                               totalPages={pagination.pages}
                               onPageChange={setPage}
                               itemsPerPage={filters.limit || 12}
                               onItemsPerPageChange={(size) => updateFilter("limit", size)}
                           />
                       </div>
                   </>
               )}
          </main>
      </div>
    </div>
  );
};

export default VideoLibraryPage;
