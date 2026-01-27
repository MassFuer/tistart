import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        setLoading(true);
        const response = await authAPI.verifyEmail({ token });

        setVerified(true);
        setUserData(response.data.data);
        toast.success("Email verified successfully!");

        // Redirect to login after 3 seconds
        const searchParams = new URLSearchParams(window.location.search);
        const next = searchParams.get("next");
        
        setTimeout(() => {
          navigate(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
        }, 3000);
      } catch (err) {
        console.error("Email verification error:", err);
        const errorMessage =
          err.response?.data?.error ||
          "Failed to verify email. Token may have expired.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
                {loading ? (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                ) : verified ? (
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                ) : (
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                )}
            </div>
          <CardTitle className="text-2xl">
            {loading
              ? "Verifying Email"
              : verified
              ? "Email Verified!"
              : "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
             {loading
              ? "Please wait while we verify your email address..."
              : verified
              ? `Thank you, ${userData?.firstName || 'User'}! Your email has been successfully verified.`
              : error}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4 text-center">
             {verified && (
                <p className="text-sm text-muted-foreground animate-pulse">
                     Redirecting to login in 3 seconds...
                </p>
             )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
            {loading ? null : verified ? (
                <Button className="w-full" asChild>
                     <Link to="/login">Go to Login</Link>
                </Button>
            ) : (
                <div className="flex flex-col w-full gap-3">
                     <Button className="w-full" asChild>
                        <Link to="/resend-email">Resend Verification Email</Link>
                     </Button>
                     <Button variant="outline" className="w-full" asChild>
                        <Link to="/signup">Sign Up Again</Link>
                     </Button>
                </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default VerifyEmailPage;
