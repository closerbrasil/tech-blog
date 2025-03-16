import { Card } from "@/components/ui/card";
import Link from "next/link";
import { MegaphoneIcon } from "lucide-react";

interface AdBannerProps {
  position: "top" | "sidebar" | "in-content";
}

export default function AdBanner({ position }: AdBannerProps) {
  // Different styling based on position
  const adStyles = {
    top: "w-full h-24 md:h-32",
    sidebar: "w-full h-60",
    "in-content": "w-full h-20 md:h-24",
  };

  // Mock ad content based on position
  const adContent = {
    top: {
      title: "Try MongoDB Atlas",
      description: "The multi-cloud developer data platform",
      link: "https://example.com/mongodb",
      sponsor: "MongoDB",
    },
    sidebar: {
      title: "Deploy your Next.js site in seconds",
      description: "Start for free and scale as you grow",
      link: "https://example.com/vercel",
      sponsor: "Vercel",
    },
    "in-content": {
      title: "Elevate your API development",
      description: "Modern, intuitive tooling for API teams",
      link: "https://example.com/postman",
      sponsor: "Postman",
    },
  };

  const content = adContent[position];

  return (
    <Link href={content.link} target="_blank" rel="noopener noreferrer">
      <Card className={`${adStyles[position]} relative overflow-hidden bg-gradient-to-r from-muted/50 to-muted hover:from-muted/80 hover:to-muted/30 transition-colors border border-border`}>
        <div className="absolute top-2 right-2 flex items-center">
          <MegaphoneIcon className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ad</span>
        </div>
        <div className="flex h-full items-center justify-center px-4 py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg">{content.title}</h3>
            <p className="text-sm text-muted-foreground mb-1">{content.description}</p>
            <p className="text-xs">Sponsored by {content.sponsor}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}