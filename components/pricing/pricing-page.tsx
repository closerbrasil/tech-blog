"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, HelpCircleIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const features = {
  free: [
    { name: "Access to free articles", included: true },
    { name: "Limited video content (5 per month)", included: true },
    { name: "Community forum access", included: true },
    { name: "Code examples", included: true },
    { name: "Basic tutorial access", included: true },
    { name: "Account dashboard", included: true },
    { name: "Premium articles", included: false },
    { name: "Downloadable source code", included: false },
    { name: "Video course access", included: false },
    { name: "Ad-free experience", included: false },
    { name: "Early access to new content", included: false },
    { name: "Expert support", included: false },
  ],
  basic: [
    { name: "All Free tier features", included: true },
    { name: "Unlimited article access", included: true },
    { name: "Downloadable source code", included: true },
    { name: "Access to 2 premium courses", included: true },
    { name: "Ad-free experience", included: true },
    { name: "Community support", included: true },
    { name: "Personalized content recommendations", included: true },
    { name: "Early access to new content", included: false },
    { name: "Expert support", included: false },
    { name: "Offline reading", included: false },
    { name: "Course completion certificates", included: false },
    { name: "Workshop access", included: false },
  ],
  pro: [
    { name: "All Basic tier features", included: true },
    { name: "Unlimited access to all content", included: true },
    { name: "Unlimited premium courses", included: true },
    { name: "Early access to new content", included: true },
    { name: "Priority expert support", included: true },
    { name: "Offline reading and video downloads", included: true },
    { name: "Course completion certificates", included: true },
    { name: "Live Q&A sessions", included: true },
    { name: "Private GitHub repositories", included: true },
    { name: "Exclusive tech events access", included: true },
    { name: "1-on-1 monthly mentoring", included: true },
    { name: "Workshop access", included: true },
  ],
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const prices = {
    monthly: {
      free: 0,
      basic: 9.99,
      pro: 19.99,
    },
    annual: {
      free: 0,
      basic: 99.99,
      pro: 199.99,
    },
  };

  const savings = {
    basic: Math.round((1 - (prices.annual.basic / (prices.monthly.basic * 12))) * 100),
    pro: Math.round((1 - (prices.annual.pro / (prices.monthly.pro * 12))) * 100),
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your tech learning journey, with flexible options for every stage of your career.
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <Tabs
          defaultValue="annual"
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                Save {savings.pro}%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Get started with free content and community access</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $0
              <span className="ml-1 text-2xl font-medium text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/sign-up">Sign up for free</a>
            </Button>
            <div className="mt-8 space-y-4">
              {features.free.map((feature, index) => (
                <div key={index} className="flex">
                  {feature.included ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <XIcon className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  )}
                  <span className={!feature.included ? "text-muted-foreground" : ""}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Plan */}
        <Card className="border-primary shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Basic</CardTitle>
                <CardDescription>Perfect for growing developers</CardDescription>
              </div>
              <Badge>Popular</Badge>
            </div>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              ${prices[billingCycle].basic}
              <span className="ml-1 text-2xl font-medium text-muted-foreground">
                /{billingCycle === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {billingCycle === "annual" && (
              <p className="text-sm text-muted-foreground mt-2">
                Billed annually (save {savings.basic}%)
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Get Basic
            </Button>
            <div className="mt-8 space-y-4">
              {features.basic.map((feature, index) => (
                <div key={index} className="flex">
                  {feature.included ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <XIcon className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  )}
                  <span className={!feature.included ? "text-muted-foreground" : ""}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
            <div className="bg-primary text-primary-foreground py-1 px-10 rotate-45 transform origin-bottom-left">
              Best Value
            </div>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Unlimited access for serious professionals</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              ${prices[billingCycle].pro}
              <span className="ml-1 text-2xl font-medium text-muted-foreground">
                /{billingCycle === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {billingCycle === "annual" && (
              <p className="text-sm text-muted-foreground mt-2">
                Billed annually (save {savings.pro}%)
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Get Pro
            </Button>
            <div className="mt-8 space-y-4">
              {features.pro.map((feature, index) => (
                <div key={index} className="flex">
                  {feature.included ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <XIcon className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                  )}
                  <span className={!feature.included ? "text-muted-foreground" : ""}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Have questions about our pricing plans? Find answers to common questions below.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Can I switch between plans?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will be effective immediately, and any price differences will be prorated.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">How do refunds work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you're not satisfied with your subscription, you can request a refund within 14 days of your purchase. Please contact our support team for assistance.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Do you offer team or company plans?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Yes, we offer special rates for teams and companies. Please contact our sales team for more information on team pricing and custom enterprise solutions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We accept all major credit cards, PayPal, and in some regions, we support Apple Pay and Google Pay. All payments are processed securely.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          If you can't find the answer to your question, please reach out to our friendly support team.
        </p>
        <Button variant="outline" size="lg">
          Contact Support
        </Button>
      </div>
    </div>
  );
}