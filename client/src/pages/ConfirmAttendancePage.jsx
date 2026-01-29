import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { eventsAPI } from "../services/api";
import { CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ConfirmAttendancePage = () => {
  const { id, token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirm = async () => {
      try {
        const res = await eventsAPI.confirmAttendance(id, token);
        setMessage(res.data.message || "Your attendance has been confirmed!");
        setStatus("success");
      } catch (err) {
        setMessage(err.response?.data?.error || "Failed to confirm attendance. The link may be invalid or expired.");
        setStatus("error");
      }
    };
    confirm();
  }, [id, token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Confirming your attendance...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">Attendance Confirmed!</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button asChild>
                  <Link to={`/events/${id}`}>
                    <Calendar className="mr-2 h-4 w-4" /> View Event
                  </Link>
                </Button>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Confirmation Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button asChild variant="outline">
                  <Link to="/events">Browse Events</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmAttendancePage;