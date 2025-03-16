"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="py-12 md:py-20">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Stay Ahead of the Tech Curve
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Join thousands of developers and tech enthusiasts mastering the latest technologies through expert-led tutorials, articles, and videos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/articles">
                  Explore Articles
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing" className="group">
                  <span>Join Premium</span>
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center space-x-4">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                    <span className="text-xs font-medium">{i + 1}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Joined by <span className="font-semibold">10,000+</span> developers
              </p>
            </div>
          </div>
          <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 border">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">Latest Tech Insights</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  High-quality content updated daily
                </p>
                <Button variant="outline" className="mt-6">Play Featured Video</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}