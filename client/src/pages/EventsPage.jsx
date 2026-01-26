import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { eventsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/event/EventCard";
import EventsMap from "../components/map/EventsMap";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { useListing } from "../hooks/useListing";
import { toast } from "sonner";
import { Filter, Calendar as CalendarIcon, Map as MapIcon, List as ListIcon } from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationItem,
  PaginationEllipsis
} from "@/components/ui/pagination";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Extracted Filter Component
const EventFilterContent = ({ filters, updateFilter, clearAllFilters, meta }) => {
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

const EventsPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'calendar', 'map'
  const [meta, setMeta] = useState({ cities: [], companies: [], artists: [] });

  // Fetch Filter Meta
  useEffect(() => {
      eventsAPI.getFiltersMeta()
        .then(res => setMeta(res.data))
        .catch(err => console.error("Failed to load filter meta", err));
  }, []);

  // Standard Listing Hook for Grid View
  const {
    data: events,
    loading: isLoading,
    error,
    pagination,
    filters,
    updateFilter,
    updateFilters,
    setPage,
    refresh
  } = useListing({
    apiFetcher: eventsAPI.getAll,
    initialFilters: {
      category: "",
      startDate: "",
      endDate: "",
      search: "",
      city: "",
      company: "",
      artist: ""
    },
  });

  const [allEventsForMap, setAllEventsForMap] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Fetch Logic for Map/Calendar (Specialized)
  const fetchSpecializedData = useCallback(async () => {
      try {
        if (viewMode === "calendar") {
            const now = new Date();
            const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 12, 0);

            const params = {
                start: filters.startDate || defaultStart.toISOString(),
                end: filters.endDate || defaultEnd.toISOString(),
                category: filters.category,
                search: filters.search,
                city: filters.city,
                company: filters.company,
                artist: filters.artist
            };
            const response = await eventsAPI.getCalendar(params);
             const formattedEvents = response.data.data.map((event) => ({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                url: `/events/${event.id}`,
                 // Simple color mapping
                backgroundColor: event.extendedProps?.category === 'exhibition' ? '#3b82f6' : '#10b981',
              }));
            setCalendarEvents(formattedEvents);
        } else if (viewMode === "map") {
            const params = { limit: 200, ...filters };
            const response = await eventsAPI.getAll(params);
            setAllEventsForMap(response.data.data);
        }
      } catch (err) {
          console.error(err);
      }
  }, [viewMode, filters]);

  useEffect(() => {
     if (viewMode !== "grid") {
         fetchSpecializedData();
     }
  }, [viewMode, fetchSpecializedData]);

  const clearAllFilters = () => {
      updateFilters({
          category: "",
          startDate: "",
          endDate: "",
          search: "",
          city: "",
          company: "",
          artist: ""
      });
      toast.success("Filters cleared");
  };

  // Pagination Renderer
   const renderPaginationItems = () => {
      if (pagination.pages <= 1) return null;
      const items = [];
      const current = pagination.page;
      const total = pagination.pages;

      items.push(
          <PaginationItem key="prev">
              <PaginationPrevious 
                onClick={() => current > 1 && setPage(current - 1)} 
                className={current <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
          </PaginationItem>
      );
      for (let i = 1; i <= total; i++) {
          if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink isActive={i === current} onClick={() => setPage(i)} className="cursor-pointer">
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
          } else if (i === current - 2 || i === current + 2) {
              items.push(<PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>);
          }
      }
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
                  <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                  <p className="text-muted-foreground">Discover upcoming art events and exhibitions</p>
              </div>
              {(isVerifiedArtist || isAdmin) && (
                 <Button asChild>
                    <Link to="/events/new">Create Event</Link>
                 </Button>
              )}
          </div>
      </div>

       <div className="flex flex-col lg:flex-row gap-8 relative items-start">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start p-6 border rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
                <EventFilterContent 
                    filters={filters}
                    updateFilter={updateFilter}
                    clearAllFilters={clearAllFilters}
                    meta={meta}
                />
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0">
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <TabsList>
                            <TabsTrigger value="grid" className="px-4">
                                <ListIcon className="w-4 h-4 mr-2" /> List
                            </TabsTrigger>
                            <TabsTrigger value="map" className="px-4">
                                <MapIcon className="w-4 h-4 mr-2" /> Map
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="px-4">
                                <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                            </TabsTrigger>
                        </TabsList>

                        {/* Mobile Filter */}
                         <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="lg:hidden">
                                    <Filter className="mr-2 h-4 w-4" /> Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader>
                                    <SheetTitle>Filter Events</SheetTitle>
                                    <SheetDescription>Refine your search</SheetDescription>
                                </SheetHeader>
                                <div className="py-4">
                                    <EventFilterContent 
                                        filters={filters}
                                        updateFilter={updateFilter}
                                        clearAllFilters={clearAllFilters}
                                        meta={meta}
                                    />
                                </div>
                                <SheetFooter>
                                    <SheetClose asChild>
                                        <Button className="w-full">Show Results</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <TabsContent value="grid" className="mt-0 space-y-8">
                        {isLoading ? (
                            <Loading />
                        ) : error ? (
                            <ErrorMessage message={error} />
                        ) : events.length === 0 ? (
                            <div className="py-12">
                                <EmptyState message="No events found" icon="📅" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {events.map(event => (
                                        <EventCard key={event._id} event={event} />
                                    ))}
                                </div>
                                <Pagination>
                                    <PaginationContent>
                                        {renderPaginationItems()}
                                    </PaginationContent>
                                </Pagination>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="map" className="mt-0">
                        <div className="border rounded-lg overflow-hidden h-[600px] bg-muted/20">
                             <EventsMap
                                events={allEventsForMap}
                                height="100%"
                                onEventClick={(event) => navigate(`/events/${event._id}`)}
                              />
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                         <div className="border p-4 rounded-lg bg-card shadow-sm">
                             <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                  left: "prev,next today",
                                  center: "title",
                                  right: "dayGridMonth,timeGridWeek",
                                }}
                                events={calendarEvents}
                                eventClick={(info) => {
                                  info.jsEvent.preventDefault();
                                  window.location.href = info.event.url;
                                }}
                                height="auto"
                              />
                         </div>
                    </TabsContent>

                </Tabs>
            </main>
       </div>
    </div>
  );
};

export default EventsPage;
