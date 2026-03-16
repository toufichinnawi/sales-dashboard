/**
 * Portal — Accept Invite
 * Landing page when customer clicks invite link
 */

import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Cookie, LogIn } from "lucide-react";

export default function PortalAcceptInvite() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "needs_login" | "accepting" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const acceptInvite = trpc.portal.acceptInvite.useMutation({
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => setLocation("/portal"), 2000);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message || "Invalid or expired invite link.");
    },
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("needs_login");
      return;
    }

    if (token && status === "loading") {
      setStatus("accepting");
      acceptInvite.mutate({ token });
    }
  }, [authLoading, user, token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full py-0">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <h2 className="text-lg font-bold mb-1">Invalid Link</h2>
            <p className="text-sm text-muted-foreground">
              This invite link is missing a token. Please check the link and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-sm w-full py-0">
        <CardContent className="p-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-sm">Hinnawi Bros</p>
              <p className="text-[11px] text-muted-foreground">Customer Portal</p>
            </div>
          </div>

          {(status === "loading" || status === "accepting") && (
            <>
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-3" />
              <h2 className="text-lg font-bold mb-1">Setting Up Your Account</h2>
              <p className="text-sm text-muted-foreground">
                Linking your account to the customer portal...
              </p>
            </>
          )}

          {status === "needs_login" && (
            <>
              <LogIn className="h-10 w-10 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-bold mb-1">Sign In Required</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to accept this invitation and access the customer portal.
              </p>
              <Button
                className="w-full h-10"
                onClick={() => {
                  // Store the invite URL so we can redirect back after login
                  sessionStorage.setItem("portal_invite_return", window.location.href);
                  window.location.href = getLoginUrl();
                }}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <h2 className="text-lg font-bold mb-1">Welcome!</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Your account has been linked successfully.
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to your portal...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
              <h2 className="text-lg font-bold mb-1">Invite Error</h2>
              <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => setLocation("/portal")}
              >
                Go to Portal
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
