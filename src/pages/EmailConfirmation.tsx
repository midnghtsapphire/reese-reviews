import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { confirmSubscriber } from "@/lib/emailStore";

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [subscriberEmail, setSubscriberEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No confirmation token provided. Please check your email link.");
      return;
    }

    // Attempt to confirm the subscriber
    try {
      const subscriber = confirmSubscriber(token);

      if (subscriber) {
        setStatus("success");
        setSubscriberEmail(subscriber.email);
      } else {
        setStatus("error");
        setErrorMessage("Invalid or expired confirmation token. The link may have already been used or is no longer valid.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("An error occurred while confirming your subscription. Please try again later.");
      console.error("Confirmation error:", error);
    }
  }, [searchParams]);

  return (
    <>
      <SEOHead
        title="Email Confirmation | Reese Reviews"
        description="Confirm your email subscription to Reese Reviews newsletter"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Card className="glass-card border-purple-500/20">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {status === "loading" && (
                  <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
                )}
                {status === "success" && (
                  <CheckCircle2 className="h-16 w-16 text-green-400" />
                )}
                {status === "error" && (
                  <XCircle className="h-16 w-16 text-red-400" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {status === "loading" && "Confirming Your Subscription..."}
                {status === "success" && "Email Confirmed!"}
                {status === "error" && "Confirmation Failed"}
              </CardTitle>
              <CardDescription>
                {status === "loading" && "Please wait while we verify your email address"}
                {status === "success" && "Your email has been successfully confirmed"}
                {status === "error" && "We couldn't confirm your email"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {status === "loading" && (
                <Alert className="bg-purple-900/30 border-purple-500/50">
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <AlertDescription className="text-purple-200">
                    Processing your confirmation request...
                  </AlertDescription>
                </Alert>
              )}

              {status === "success" && (
                <>
                  <Alert className="bg-green-900/30 border-green-500/50">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      <strong>Success!</strong> Your email address <strong>{subscriberEmail}</strong> has been confirmed.
                      You'll now receive our newsletter with the latest reviews, tips, and insights.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-purple-400 mt-1" />
                        <div>
                          <h3 className="text-white font-semibold mb-2">What's Next?</h3>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            <li>• You'll receive our weekly newsletter with the latest reviews</li>
                            <li>• Get exclusive tips and insights from Reese</li>
                            <li>• Early access to new features and content</li>
                            <li>• Special offers and promotions</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                      <Button asChild className="gradient-steel">
                        <Link to="/">Go to Homepage</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/blog">Read the Blog</Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <Alert className="bg-red-900/30 border-red-500/50">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h3 className="text-white font-semibold mb-3">Need Help?</h3>
                      <div className="space-y-2 text-gray-300 text-sm">
                        <p>If you continue to have issues, please:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Check if you've already confirmed this email</li>
                          <li>• Try subscribing again with a fresh email</li>
                          <li>• Contact our support team for assistance</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                      <Button asChild className="gradient-steel">
                        <Link to="/">Return to Homepage</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/contact">Contact Support</Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
