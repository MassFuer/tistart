import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
import Pagination from "../components/common/Pagination";
import EventFilters from "../components/event/EventFilters";

const EventsPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
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

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 px-4 mb-8 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">Discover upcoming art events and exhibitions</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    {/* View Mode Tabs */}
                    <TabsList>
                        <TabsTrigger value="grid" className="px-3">
                            <ListIcon className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">List</span>
                        </TabsTrigger>
                        <TabsTrigger value="map" className="px-3">
                            <MapIcon className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Map</span>
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="px-3">
                            <CalendarIcon className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Calendar</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Mobile Filter */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="lg:hidden">
                                <Filter className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Filters</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader>
                                <SheetTitle>Filter Events</SheetTitle>
                                <SheetDescription>Refine your search</SheetDescription>
                            </SheetHeader>
                            <div className="py-4">
                                <EventFilters
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

                    {(isVerifiedArtist || isAdmin) && (
                       <Button asChild size="sm">
                          <Link to="/events/new">Create Event</Link>
                       </Button>
                    )}
                </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative items-start">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start p-6 border rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
                <EventFilters
                    filters={filters}
                    updateFilter={updateFilter}
                    clearAllFilters={clearAllFilters}
                    meta={meta}
                />
            </aside>

            {/* MAIN CONTENT */}
            <main className="w-full lg:flex-1 lg:min-w-0">

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
                                <div className="grid grid-cols-2 gap-3 md:gap-6">
                                    {events.map(event => (
                                        <EventCard key={event._id} event={event} />
                                    ))}
                                </div>
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.pages}
                                    onPageChange={setPage}
                                />
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="map" className="mt-0 w-full">
                        <div className="border rounded-lg overflow-hidden h-[60vh] sm:h-[70vh] md:h-[600px] bg-muted/20">
                             <EventsMap
                                events={allEventsForMap}
                                height="100%"
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
            </main>
        </div>
      </Tabs>
    </div>
  );
};

export default EventsPage;
