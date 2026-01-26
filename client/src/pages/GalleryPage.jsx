import { useState, useEffect } from "react";
import { artworksAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { useListing } from "../hooks/useListing";
import toast from "react-hot-toast";
import { SlidersHorizontal, X, ArrowUpDown, Filter } from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

// Extracted Component to prevent re-renders losing focus
const FilterContent = ({ 
    filters, 
    updateFilter, 
    categories, 
    priceRange, 
    handlePriceChange, 
    handlePriceCommit, 
    artists, 
    materialsOptions, 
    colorsOptions,
    clearAllFilters
}) => (
      <div className="space-y-6">
          {/* SEARCH */}
          <div className="space-y-2">
              <Label>Search</Label>
              <Input 
                  placeholder="Search artworks..." 
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
              />
          </div>

          <Accordion 
            type="multiple" 
            defaultValue={["category", "price", "status", "artist", "attributes"]}
            className="w-full"
          >
              <AccordionItem value="category">
                  <AccordionTrigger>Category</AccordionTrigger>
                  <AccordionContent>
                      <Select 
                          value={filters.category || "all"} 
                          onValueChange={(val) => updateFilter("category", val === "all" ? "" : val)}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {categories.map(cat => (
                                  <SelectItem key={cat} value={cat} className="capitalize">
                                      {cat}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </AccordionContent>
              </AccordionItem>

              <AccordionItem value="price">
                  <AccordionTrigger>Price Range</AccordionTrigger>
                  <AccordionContent className="px-1 py-4">
                        <Slider
                            defaultValue={[0, 10000]}
                            value={priceRange}
                            max={10000}
                            step={100}
                            onValueChange={handlePriceChange}
                            onValueCommit={handlePriceCommit}
                            className="mb-4"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{priceRange[0]}€</span>
                            <span>{priceRange[1]}€+</span>
                        </div>
                  </AccordionContent>
              </AccordionItem>
              
               <AccordionItem value="artist">
                  <AccordionTrigger>Artist</AccordionTrigger>
                  <AccordionContent>
                       <Select 
                          value={filters.artist || "all"} 
                          onValueChange={(val) => updateFilter("artist", val === "all" ? "" : val)}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="All Artists" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Artists</SelectItem>
                              {artists.map(artist => (
                                  <SelectItem key={artist.id} value={artist.id}>
                                      {artist.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </AccordionContent>
              </AccordionItem>

              <AccordionItem value="status">
                  <AccordionTrigger>Availability</AccordionTrigger>
                  <AccordionContent>
                      <div className="flex items-center space-x-2">
                          <Checkbox 
                              id="for-sale" 
                              checked={filters.isForSale === "true" || filters.isForSale === true}
                              onCheckedChange={(checked) => updateFilter("isForSale", checked ? "true" : "")}
                          />
                          <Label htmlFor="for-sale">For Sale Only</Label>
                      </div>
                  </AccordionContent>
              </AccordionItem>

              <AccordionItem value="attributes">
                  <AccordionTrigger>Attributes</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Material</Label>
                            <Select 
                                value={filters.materials || "all"} 
                                onValueChange={(val) => updateFilter("materials", val === "all" ? "" : val)}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any</SelectItem>
                                    {materialsOptions.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Color</Label>
                             <Select 
                                value={filters.colors || "all"} 
                                onValueChange={(val) => updateFilter("colors", val === "all" ? "" : val)}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any</SelectItem>
                                    {colorsOptions.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                  </AccordionContent>
              </AccordionItem>
          </Accordion>
          
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
              Reset Filters
          </Button>
      </div>
  );

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

  // Pagination Logic Helper
  const renderPaginationItems = () => {
      if (pagination.pages <= 1) return null;
      
      const items = [];
      const current = pagination.page;
      const total = pagination.pages;

      // Previous
      items.push(
          <PaginationItem key="prev">
              <PaginationPrevious 
                onClick={() => current > 1 && setPage(current - 1)} 
                className={current <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
          </PaginationItem>
      );

      // Simple simplified pagination for now (1, 2, 3 ... Last)
      for (let i = 1; i <= total; i++) {
          if (
            i === 1 ||
            i === total ||
            (i >= current - 1 && i <= current + 1)
          ) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink isActive={i === current} onClick={() => setPage(i)} className="cursor-pointer">
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
          } else if (
              i === current - 2 || 
              i === current + 2
          ) {
              items.push(<PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>);
          }
      }

      // Next
       items.push(
          <PaginationItem key="next">
              <PaginationNext 
                onClick={() => current < total && setPage(current + 1)}
                className={current >= total ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
          </PaginationItem>
      );

      return items;
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
                              <FilterContent 
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
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative items-start">
          {/* DESKTOP SIDEBAR */}
          {showFilters && (
              <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 h-auto self-start p-6 border rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
                   <FilterContent 
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
                       <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
                           {artworks.map(artwork => (
                               <ArtworkCard key={artwork._id} artwork={artwork} />
                           ))}
                       </div>
                       
                       <div className="mt-12">
                           <Pagination>
                               <PaginationContent>
                                   {renderPaginationItems()}
                               </PaginationContent>
                           </Pagination>
                       </div>
                   </>
               )}
          </main>
      </div>
    </div>
  );
};

export default GalleryPage;
