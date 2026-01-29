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

const VideoFilters = ({
  filters,
  updateFilter,
  priceRange,
  handlePriceChange,
  handlePriceCommit,
  artists,
  directors,
  castMembers,
  teamMembers,
  clearAllFilters,
}) => {
  return (
    <div className="space-y-6">
      {/* SEARCH */}
      <div className="space-y-2">
        <Label>Search</Label>
        <Input
          placeholder="Search videos..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="bg-black text-white border-white/20 placeholder:text-neutral-500"
        />
      </div>

      <Accordion
        type="multiple"
        defaultValue={["people", "attributes", "price", "status", "artist"]}
        className="w-full"
      >
        <AccordionItem value="people">
          <AccordionTrigger>People</AccordionTrigger>
          <AccordionContent className="space-y-4">
             {/* Director */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Director</Label>
              <Select
                value={filters.director || "all"}
                onValueChange={(val) =>
                  updateFilter("director", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-8 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="dark bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="all">Any</SelectItem>
                  {directors.map((d) => (
                    <SelectItem key={d} value={d} className="focus:bg-white/10">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             {/* Cast */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Cast / Actor</Label>
              <Select
                value={filters.cast || "all"}
                onValueChange={(val) =>
                  updateFilter("cast", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-8 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="dark bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="all">Any</SelectItem>
                  {castMembers.map((c) => (
                    <SelectItem key={c} value={c} className="focus:bg-white/10">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             {/* Team */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Production Team</Label>
              <Select
                value={filters.team || "all"}
                onValueChange={(val) =>
                  updateFilter("team", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="h-8 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="dark bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="all">Any</SelectItem>
                  {teamMembers.map((t) => (
                    <SelectItem key={t} value={t} className="focus:bg-white/10">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="artist">
          <AccordionTrigger>Artist (Uploader)</AccordionTrigger>
          <AccordionContent>
            <Select
              value={filters.artist || "all"}
              onValueChange={(val) =>
                updateFilter("artist", val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="bg-black border-white/20 text-white">
                <SelectValue placeholder="All Artists" />
              </SelectTrigger>
              <SelectContent className="dark bg-neutral-900 border-white/10 text-white">
                <SelectItem value="all">All Artists</SelectItem>
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id} className="focus:bg-white/10">
                    {artist.name}
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
                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="for-sale">For Sale Only</Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10" onClick={clearAllFilters}>
        Reset Filters
      </Button>
    </div>
  );
};

export default VideoFilters;
