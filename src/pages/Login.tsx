import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Brain, Loader2, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { FormInputField, FormPasswordField } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSigningIn(true);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        toast.success("Signed in successfully.");
        navigate("/dashboard", { replace: true });
      } else {
        form.setError("password", { message: "Invalid username or password." });
      }
    } catch (err) {
      // Not bad credentials (AuthContext.login already handles that case) —
      // a rate limit or the backend being briefly unreachable. Said plainly,
      // instead of the misleading "Invalid username or password.".
      const message =
        err instanceof Error && err.message === "TOO_MANY_ATTEMPTS"
          ? "Too many attempts. Please wait a few minutes and try again."
          : "Unable to reach the server. Please try again.";
      form.setError("password", { message });
    } finally {
      setIsSigningIn(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
            <Brain className="size-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Portfolio Dashboard</h1>
            <p className="text-sm text-muted-foreground">US Portfolio</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <FormInputField
                  control={form.control}
                  name="username"
                  label="Username"
                  required
                />
                <FormPasswordField
                  control={form.control}
                  name="password"
                  label="Password"
                  required
                />
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
