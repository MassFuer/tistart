import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { FaGoogle, FaGithub, FaMicrosoft, FaApple } from "react-icons/fa";

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
import { CheckCircle2, User, Palette } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const isArtistSignup = searchParams.get("role") === "artist";

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    const pwd = formData.password;
    setPasswordCriteria({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      specialChar: /[^A-Za-z0-9]/.test(pwd),
    });
  }, [formData.password]);

  const getStrengthScore = () => {
    return Object.values(passwordCriteria).filter(Boolean).length;
  };

  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score <= 2) return "bg-destructive";
    if (score <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (getStrengthScore() < 5) {
      toast.error("Please meet all password requirements");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...userData } = formData;
      if (isArtistSignup) {
          userData.intent = 'apply_artist';
      }
      await signup(userData);
      setSignupSuccess(true);
      toast.success(
        "Account created! Check your email to verify your address."
      );
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Signup failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-lg border-0 bg-card text-center">
            <CardHeader>
                <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Account Created!</CardTitle>
                <CardDescription>
                    We've sent a verification email to <strong>{formData.email}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Please check your inbox and click the verification link to confirm your email address.
                </p>
                {isArtistSignup && (
                    <Alert className="bg-blue-50 text-blue-900 border-blue-200 text-left">
                        <Palette className="h-4 w-4" />
                        <AlertTitle>Next Step: Artist Application</AlertTitle>
                        <AlertDescription className="text-xs">
                            Once verified and logged in, you can complete your artist profile application.
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                    Redirecting to login in 5 seconds...
                </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full">
                    <Link to="/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link to="/resend-email">Resend Email</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 bg-muted/30">
      <Card className="w-full max-w-lg shadow-lg border-0 bg-card">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
             {isArtistSignup ? (
                 <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Palette className="h-6 w-6 text-primary" />
                 </div>
             ) : (
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                 </div>
             )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
              {isArtistSignup ? "Create Artist Account" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isArtistSignup 
                ? "Step 1: Create your account to start your artist application" 
                : "Enter your email below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        autoComplete="given-name"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        autoComplete="family-name"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                    id="userName"
                    name="userName"
                    placeholder="johndoe"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2 pt-1 transition-all">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                        style={{ width: `${(getStrengthScore() / 5) * 100}%` }} 
                      />
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={`flex items-center gap-2 ${passwordCriteria.length ? "text-green-600" : ""}`}>
                        {passwordCriteria.length ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        At least 8 characters
                      </li>
                       <li className={`flex items-center gap-2 ${passwordCriteria.uppercase ? "text-green-600" : ""}`}>
                        {passwordCriteria.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        At least one uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${passwordCriteria.lowercase ? "text-green-600" : ""}`}>
                        {passwordCriteria.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                         At least one lowercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${passwordCriteria.number ? "text-green-600" : ""}`}>
                        {passwordCriteria.number ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        At least one number
                      </li>
                      <li className={`flex items-center gap-2 ${passwordCriteria.specialChar ? "text-green-600" : ""}`}>
                        {passwordCriteria.specialChar ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : isArtistSignup ? "Continue to Step 2" : "Sign Up"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs uppercase text-muted-foreground font-medium">
              Or sign up with
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" type="button">
               <FaGoogle className="mr-2 h-4 w-4" /> Google
            </Button>
            <Button variant="outline" type="button">
               <FaGithub className="mr-2 h-4 w-4" /> Github
            </Button>
            <Button variant="outline" type="button" disabled>
               <FaMicrosoft className="mr-2 h-4 w-4" /> Microsoft
            </Button>
             <Button variant="outline" type="button" disabled>
               <FaApple className="mr-2 h-4 w-4" /> Apple
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <div>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
