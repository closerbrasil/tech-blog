"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  GithubIcon,
  FileTextIcon,
  DownloadIcon,
  LinkIcon,
  LockIcon,
} from "lucide-react";
import AdBanner from "@/components/ads/ad-banner";
import Newsletter from "@/components/newsletter";
import { useToast } from "@/components/ui/use-toast";
import Markdown from 'react-markdown';

interface Author {
  name: string;
  avatar: string;
  bio: string;
}

interface Resource {
  type: "github" | "documentation" | "download" | "related";
  title: string;
  url: string;
}

interface Article {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  isPremium: boolean;
  readTime: string;
  date: string;
  author: Author;
  content: string;
  tags: string[];
  comments: number;
  slug: string;
  resources: Resource[];
  relatedArticles: number[];
}

// Mock data for related articles
const relatedArticlesData = [
  {
    id: 2,
    title: "Building Scalable Microservices with Go and Kubernetes",
    image: "https://images.unsplash.com/photo-1642059893618-eee386500798?q=80&w=2069&auto=format&fit=crop",
    readTime: "15 min",
    category: "DevOps",
    slug: "building-scalable-microservices-go-kubernetes",
  },
  {
    id: 4,
    title: "Advanced TypeScript Patterns for Robust Enterprise Applications",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
    readTime: "8 min",
    category: "TypeScript",
    slug: "advanced-typescript-patterns-enterprise-applications",
  },
  {
    id: 5,
    title: "Understanding WebAssembly: The Future of Web Performance",
    image: "https://images.unsplash.com/photo-1635954780549-bbc97603d7a5?q=80&w=1972&auto=format&fit=crop",
    readTime: "14 min",
    category: "Web",
    slug: "understanding-webassembly-future-web-performance",
  },
];

export default function ArticleDetail({ article }: { article: Article }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const { toast } = useToast();

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      description: isBookmarked 
        ? "This article has been removed from your bookmarks." 
        : "This article has been added to your bookmarks.",
      duration: 3000,
    });
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    // In a real implementation, this would use the Web Share API
    toast({
      title: "Share this article",
      description: "The share dialog would open here.",
      duration: 3000,
    });
  };

  // Find related articles based on the IDs
  const relatedArticles = article.relatedArticles
    .map(id => relatedArticlesData.find(article => article.id === id))
    .filter(Boolean);

  // Icon map for resource types
  const resourceIcons = {
    github: <GithubIcon className="h-4 w-4" />,
    documentation: <FileTextIcon className="h-4 w-4" />,
    download: <DownloadIcon className="h-4 w-4" />,
    related: <LinkIcon className="h-4 w-4" />,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="outline">{article.category}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <ClockIcon className="mr-1 h-3 w-3" />
                <span>{article.readTime} read</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <span>{article.date}</span>
              </div>
              {article.isPremium && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Premium
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{article.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={article.author.avatar} alt={article.author.name} />
                  <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{article.author.name}</p>
                  <p className="text-sm text-muted-foreground">Author</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBookmark}
                  className={isBookmarked ? "text-primary" : ""}
                >
                  <BookmarkIcon className="h-5 w-5" />
                  <span className="sr-only">Bookmark</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLike}
                  className={isLiked ? "text-primary" : ""}
                >
                  <ThumbsUpIcon className="h-5 w-5" />
                  <span className="sr-only">Like</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <ShareIcon className="h-5 w-5" />
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Featured Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Premium Content Warning */}
          {article.isPremium && (
            <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <LockIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Premium Content</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    This is a premium article. Some sections are available only to premium subscribers.
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/pricing">Upgrade to Premium</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose dark:prose-invert max-w-none mb-10">
            <Markdown>{article.content}</Markdown>
          </div>
          
          {/* In-content Ad */}
          <div className="my-10">
            <AdBanner position="in-content" />
          </div>
          
          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Author Bio */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={article.author.avatar} alt={article.author.name} />
                  <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{article.author.name}</CardTitle>
                  <CardDescription>Author</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{article.author.bio}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Follow
              </Button>
              <Button variant="outline" size="sm">
                View all articles
              </Button>
            </CardFooter>
          </Card>
          
          {/* Comments Section */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4">Comments ({article.comments})</h3>
            <div className="space-y-4 mb-6">
              {/* Placeholder for comments */}
              <div className="flex justify-center items-center p-8 border rounded-lg bg-muted/30">
                <div className="text-center">
                  <MessageSquareIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Comments would be loaded here</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full">Load all comments</Button>
          </div>
          
          {/* Related Articles */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedArticles.map((article) => (
                <Card key={article?.id} className="overflow-hidden hover:border-primary transition-colors">
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={article?.image}
                      alt={article?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{article?.category}</Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <ClockIcon className="mr-1 h-3 w-3" />
                        <span>{article?.readTime}</span>
                      </div>
                    </div>
                    <CardTitle className="text-base">
                      <Link href={`/articles/${article?.slug}`} className="hover:text-primary transition-colors">
                        {article?.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Resources Card */}
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle>Resources</CardTitle>
              <CardDescription>Useful links and materials for this article</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-auto max-h-[300px]">
                <div className="space-y-4">
                  {article.resources.map((resource, index) => (
                    <div key={index}>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="mr-3">
                          {resourceIcons[resource.type]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.type === "github" && "GitHub Repository"}
                            {resource.type === "documentation" && "Documentation"}
                            {resource.type === "download" && "Download Resource"}
                            {resource.type === "related" && "Related Link"}
                          </p>
                        </div>
                      </a>
                      {index < article.resources.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Sidebar Ad */}
          <AdBanner position="sidebar" />
          
          {/* Table of Contents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="text-sm">
                <ul className="space-y-1">
                  <li>
                    <a href="#" className="text-primary hover:underline">What are React Server Components?</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary hover:underline">Key Concepts</a>
                    <ul className="pl-4 pt-1 space-y-1">
                      <li>
                        <a href="#" className="hover:text-primary hover:underline">Component Types</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-primary hover:underline">Code Example</a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary hover:underline">Best Practices</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary hover:underline">Advanced Patterns</a>
                    <ul className="pl-4 pt-1 space-y-1">
                      <li>
                        <a href="#" className="hover:text-primary hover:underline">Streaming Rendering</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-primary hover:underline">Server Actions</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>
            </CardContent>
          </Card>
          
          {/* Newsletter */}
          <Newsletter />
          
          {/* Article Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Article Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-md">
                  <div className="text-2xl font-bold">{likeCount}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-md">
                  <div className="text-2xl font-bold">{article.comments}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-md">
                  <div className="text-2xl font-bold">856</div>
                  <div className="text-sm text-muted-foreground">Views</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-md">
                  <div className="text-2xl font-bold">23</div>
                  <div className="text-sm text-muted-foreground">Shares</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}