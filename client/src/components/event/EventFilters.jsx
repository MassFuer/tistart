import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const EventFilters = ({ filters, updateFilter, clearAllFilters, meta }) => {
    const categories = ["exhibition", "concert", "workshop", "meetup", "other"];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Search</Label>
                <Input
                    placeholder="Search events..."
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                />
            </div>

            <Accordion type="multiple" defaultValue={["category", "city", "company", "artist", "date"]} className="w-full">
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
                                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="city">
                    <AccordionTrigger>City</AccordionTrigger>
                    <AccordionContent>
                        <Select
                            value={filters.city || "all"}
                            onValueChange={(val) => updateFilter("city", val === "all" ? "" : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Cities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {meta.cities?.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="company">
                    <AccordionTrigger>Company</AccordionTrigger>
                    <AccordionContent>
                        <Select
                            value={filters.company || "all"}
                            onValueChange={(val) => updateFilter("company", val === "all" ? "" : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Companies" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Companies</SelectItem>
                                {meta.companies?.map(comp => (
                                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                {meta.artists?.map(artist => (
                                    <SelectItem key={artist._id} value={artist._id}>{artist.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="date">
                    <AccordionTrigger>Date Range</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">From</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => updateFilter("startDate", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => updateFilter("endDate", e.target.value)}
                            />
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

export default EventFilters;
