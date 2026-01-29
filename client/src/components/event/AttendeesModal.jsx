import { useState, useEffect, useCallback } from "react";
import { eventsAPI } from "../../services/api";
import { toast } from "sonner";
import { Users, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_STYLES = {
  registered: { label: "Confirmed", variant: "default", className: "bg-green-600" },
  notConfirmed: { label: "Pending", variant: "secondary", className: "" },
  cancelled: { label: "Cancelled", variant: "destructive", className: "" },
};

const AttendeesModal = ({ eventId, open, onOpenChange }) => {
  const [attendees, setAttendees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchAttendees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await eventsAPI.getAttendees(eventId, { page, limit: 10 });
      setAttendees(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load attendees");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open) fetchAttendees(1);
  }, [open, fetchAttendees]);

  const style = (status) => STATUS_STYLES[status] || STATUS_STYLES.notConfirmed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Attendees ({pagination.total})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading && attendees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : attendees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendees yet.</p>
          ) : (
            attendees.map((att) => {
              const s = style(att.status);
              return (
                <div key={att._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={att.profilePicture} />
                    <AvatarFallback>{att.userName?.[0] || att.firstName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {att.userName || `${att.firstName} ${att.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{att.email}</p>
                  </div>
                  <Badge variant={s.variant} className={s.className}>{s.label}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`mailto:${att.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchAttendees(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchAttendees(pagination.page + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendeesModal;