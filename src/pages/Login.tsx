import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Brain, Loader2, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { FormInputField } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Demo accounts shown below the form (internal demo application). */
const DEMO_ACCOUNTS = [
  { label: "Super Admin", username: "admin", password: "Admin@123" },
  { label: "Director", username: "michael.thompson", password: "Welcome@123" },
  { label: "Eng. Manager", username: "rajesh.kumar", password: "Welcome@123" },
  { label: "Developer", username: "nikhil.menon", password: "Welcome@123" },
];

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
    } finally {
      setIsSigningIn(false);
    }
  });

  const fillDemo = (username: string, password: string) => {
    form.reset({ username, password });
    form.clearErrors();
  };

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
            <CardDescription>Use your portfolio account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <FormInputField
                  control={form.control}
                  name="username"
                  label="Username"
                  placeholder="firstname.lastname"
                  required
                />
                <FormInputField
                  control={form.control}
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Sign In
                </Button>
              </form>
            </Form>

            <Separator />

            {/* Demo accounts (internal demo — no backend) */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Demo accounts — click to fill</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((demo) => (
                  <Button
                    key={demo.username}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col items-start gap-0 py-1.5"
                    onClick={() => fillDemo(demo.username, demo.password)}
                  >
                    <span className="text-xs font-semibold">{demo.label}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{demo.username}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Internal demo · employee accounts use password <code>Welcome@123</code>
        </p>
      </div>
    </div>
  );
}
