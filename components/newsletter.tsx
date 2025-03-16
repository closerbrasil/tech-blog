"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      setEmail("");
      toast({
        title: "Subscription successful!",
        description: "You've been added to our newsletter.",
        duration: 5000,
      });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <MailIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Newsletter</span>
        </div>
        <CardTitle>Stay Updated</CardTitle>
        <CardDescription>
          Get the latest articles, tutorials, and offers delivered to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <CheckCircleIcon className="h-12 w-12 text-primary mb-2" />
            <h3 className="text-lg font-medium">Thanks for subscribing!</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive our next newsletter in your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardFooter>
    </Card>
  );
}