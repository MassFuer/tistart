import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "../services/api";
import { Mail, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ResendEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await authAPI.resendVerificationEmail({ email: email.toLowerCase() });

      setSent(true);
      toast.success("Verification email sent! Check your inbox.");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Resend email error:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Failed to send verification email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-500">
           <CardHeader className="text-center pb-2">
                 <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                </div>
                <CardTitle className="text-2xl">Email Sent!</CardTitle>
                <CardDescription className="text-base mt-2">
                    We've sent a verification email to <strong className="text-foreground">{email}</strong>
                </CardDescription>
           </CardHeader>
           
           <CardContent className="text-center space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                    Please check your inbox click the verification link to confirm your email address.
                </p>
                <p className="text-sm font-medium animate-pulse text-primary">
                    Redirecting to login in 3 seconds...
                </p>
           </CardContent>

           <CardFooter>
                 <Button className="w-full" asChild>
                    <Link to="/login">Go to Login</Link>
                </Button>
           </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                 </div>
            </div>
          <CardTitle className="text-2xl">Resend Verification</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a new verification link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Resend Verification Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-0">
             <Button variant="link" className="text-sm text-muted-foreground" asChild>
                 <Link to="/login">Back to Login</Link>
             </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ResendEmailPage;
