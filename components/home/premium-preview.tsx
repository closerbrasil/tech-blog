import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheckIcon, CheckCircle2Icon, LockIcon } from "lucide-react";
import Link from "next/link";

export default function PremiumPreview() {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-b from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2 mb-2">
          <BadgeCheckIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Premium Content</span>
        </div>
        <CardTitle>Unlock Premium Benefits</CardTitle>
        <CardDescription>
          Get exclusive access to advanced tutorials, source code, and expert resources.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <ul className="space-y-2">
          {[
            "Exclusive in-depth tutorials",
            "Complete source code access",
            "Premium video courses",
            "Early access to new content",
            "Direct support from experts"
          ].map((benefit, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2Icon className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button className="w-full" asChild>
          <Link href="/pricing">Upgrade to Premium</Link>
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Starting at just $9.99/month
        </div>
      </CardFooter>
    </Card>
  );
}