"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { SearchIcon, FilterIcon, BookmarkIcon, Clock3Icon, CalendarIcon, MessageSquareIcon, ShareIcon } from "lucide-react";
import ArticleCard from "@/components/articles/article-card";
import AdBanner from "@/components/ads/ad-banner";
import Newsletter from "@/components/newsletter";
import React from "react";

// Mock article data
const articles = [
  {
    id: 1,
    title: "The Complete Guide to React Server Components in 2025",
    description: "Learn how to leverage React Server Components to build faster, more efficient web applications with improved user experience.",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
    category: "React",
    isPremium: true,
    readTime: "12 min",
    date: "May 15, 2025",
    author: {
      name: "Jane Cooper",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 24,
    slug: "complete-guide-react-server-components-2025",
  },
  {
    id: 2,
    title: "Building Scalable Microservices with Go and Kubernetes",
    description: "A comprehensive tutorial on designing, implementing, and deploying microservices using Golang and Kubernetes.",
    image: "https://images.unsplash.com/photo-1642059893618-eee386500798?q=80&w=2069&auto=format&fit=crop",
    category: "DevOps",
    isPremium: false,
    readTime: "15 min",
    date: "May 10, 2025",
    author: {
      name: "Alex Morgan",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 18,
    slug: "building-scalable-microservices-go-kubernetes",
  },
  {
    id: 3,
    title: "Machine Learning for Frontend Developers: Practical Applications",
    description: "Discover how frontend developers can use machine learning to enhance user interfaces and create personalized experiences.",
    image: "https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?q=80&w=2070&auto=format&fit=crop",
    category: "AI/ML",
    isPremium: true,
    readTime: "10 min",
    date: "May 5, 2025",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 31,
    slug: "machine-learning-frontend-developers-applications",
  },
  {
    id: 4,
    title: "Advanced TypeScript Patterns for Robust Enterprise Applications",
    description: "Explore advanced TypeScript patterns to build more robust, maintainable, and scalable enterprise applications.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
    category: "TypeScript",
    isPremium: false,
    readTime: "8 min",
    date: "May 3, 2025",
    author: {
      name: "Michael Johnson",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 15,
    slug: "advanced-typescript-patterns-enterprise-applications",
  },
  {
    id: 5,
    title: "Understanding WebAssembly: The Future of Web Performance",
    description: "Deep dive into WebAssembly, how it works, and why it's revolutionizing web application performance.",
    image: "https://images.unsplash.com/photo-1635954780549-bbc97603d7a5?q=80&w=1972&auto=format&fit=crop",
    category: "Web",
    isPremium: true,
    readTime: "14 min",
    date: "April 28, 2025",
    author: {
      name: "Emily Wang",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 27,
    slug: "understanding-webassembly-future-web-performance",
  },
  {
    id: 6,
    title: "Modern Authentication Patterns: OAuth 2.1 and OIDC in Practice",
    description: "Implement secure authentication in your applications using modern OAuth 2.1 and OpenID Connect patterns.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2065&auto=format&fit=crop",
    category: "Security",
    isPremium: false,
    readTime: "11 min",
    date: "April 22, 2025",
    author: {
      name: "David Smith",
      avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    comments: 19,
    slug: "modern-authentication-patterns-oauth-oidc",
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "ai-ml", label: "AI/ML" },
  { id: "devops", label: "DevOps" },
  { id: "web", label: "Web" },
  { id: "security", label: "Security" },
];

export default function ArticlesLayout() {
  const [activeTab, setActiveTab] = useState("all");
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles based on active tab, premium filter, and search query
  const filteredArticles = articles.filter((article) => {
    const matchesTab = activeTab === "all" || article.category.toLowerCase() === activeTab;
    const matchesPremium = !showPremiumOnly || article.isPremium;
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesPremium && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* Main content */}
        <div className="w-full md:w-2/3">
          <h1 className="text-4xl font-bold mb-6">Articles</h1>
          
          {/* Search and filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="sm:w-auto">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="flex items-center">
              <Checkbox
                id="premium-only"
                checked={showPremiumOnly}
                onCheckedChange={(checked) => setShowPremiumOnly(checked === true)}
              />
              <label htmlFor="premium-only" className="ml-2 text-sm font-medium">
                Show premium content only
              </label>
            </div>
          </div>
          
          {/* Categories tabs */}
          <Tabs defaultValue="all" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto p-0 bg-transparent">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="px-4 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="mt-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No articles found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredArticles.map((article, index) => (
                    <React.Fragment key={article.id}>
                      <ArticleCard article={article} />
                      {/* Insert ad after every 3 articles */}
                      {index % 3 === 2 && index < filteredArticles.length - 1 && (
                        <div className="my-8">
                          <AdBanner position="in-content" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>
            {/* Other tabs content will be the same but with different filtering */}
            {categories.slice(1).map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                {/* Content for this tab */}
                <div className="space-y-6">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium">No {category.label} articles found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredArticles.map((article, index) => (
                      <React.Fragment key={article.id}>
                        <ArticleCard article={article} />
                        {/* Insert ad after every 3 articles */}
                        {index % 3 === 2 && index < filteredArticles.length - 1 && (
                          <div className="my-8">
                            <AdBanner position="in-content" />
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <div className="flex space-x-2">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button variant="outline">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 space-y-8">
          <AdBanner position="sidebar" />
          
          <Card>
            <CardHeader>
              <CardTitle>Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["JavaScript", "React", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "TypeScript", "GraphQL", "Next.js", "Vue.js", "CSS", "DevOps"].map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Newsletter />
          
          <Card>
            <CardHeader>
              <CardTitle>Most Read Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {articles.slice(0, 4).map((article) => (
                <div key={article.id} className="flex gap-3">
                  <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                    <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-medium line-clamp-2 text-sm">
                      <Link href={`/articles/${article.slug}`} className="hover:text-primary">
                        {article.title}
                      </Link>
                    </h4>
                    <div className="flex items-center mt-1">
                      <Clock3Icon className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{article.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">View all popular articles</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}