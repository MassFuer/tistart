import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ArtworkFilters = ({
  filters,
  updateFilter,
  categories,
  priceRange,
  handlePriceChange,
  handlePriceCommit,
  artists,
  materialsOptions,
  colorsOptions,
  clearAllFilters,
}) => {
  return (
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
              onValueChange={(val) =>
                updateFilter("category", val === "all" ? "" : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
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
              onValueChange={(val) =>
                updateFilter("artist", val === "all" ? "" : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Artists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Artists</SelectItem>
                {artists.map((artist) => (
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
                checked={
                  filters.isForSale === "true" || filters.isForSale === true
                }
                onCheckedChange={(checked) =>
                  updateFilter("isForSale", checked ? "true" : "")
                }
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
                onValueChange={(val) =>
                  updateFilter("materials", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {materialsOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <Select
                value={filters.colors || "all"}
                onValueChange={(val) =>
                  updateFilter("colors", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {colorsOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
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
};

export default ArtworkFilters;
