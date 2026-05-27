import { Suspense } from "react";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
