import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock3Icon, BookmarkIcon, MessageSquareIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const articles = [
  {
    id: 1,
    title: "The Complete Guide to React Server Components in 2025",
    description: "Learn how to leverage React Server Components to build faster, more efficient web applications with improved user experience.",
    image: "https://placehold.co/800x400/1a1a1a/ffffff?text=React+Server+Components",
    category: "React",
    isPremium: true,
    readTime: "12 min",
    date: "May 15, 2025",
    author: {
      name: "Jane Cooper",
      avatar: "https://placehold.co/100/1a1a1a/ffffff?text=JC",
    },
    comments: 24,
    slug: "complete-guide-react-server-components-2025",
  },
  {
    id: 2,
    title: "Building Scalable Microservices with Go and Kubernetes",
    description: "A comprehensive tutorial on designing, implementing, and deploying microservices using Golang and Kubernetes.",
    image: "https://placehold.co/800x400/1a1a1a/ffffff?text=Go+and+Kubernetes",
    category: "DevOps",
    isPremium: false,
    readTime: "15 min",
    date: "May 10, 2025",
    author: {
      name: "Alex Morgan",
      avatar: "https://placehold.co/100/1a1a1a/ffffff?text=AM",
    },
    comments: 18,
    slug: "building-scalable-microservices-go-kubernetes",
  },
  {
    id: 3,
    title: "Machine Learning for Frontend Developers: Practical Applications",
    description: "Discover how frontend developers can use machine learning to enhance user interfaces and create personalized experiences.",
    image: "https://placehold.co/800x400/1a1a1a/ffffff?text=Machine+Learning",
    category: "AI/ML",
    isPremium: true,
    readTime: "10 min",
    date: "May 5, 2025",
    author: {
      name: "Sarah Chen",
      avatar: "https://placehold.co/100/1a1a1a/ffffff?text=SC",
    },
    comments: 31,
    slug: "machine-learning-frontend-developers-applications",
  }
];

export default function FeaturedArticles() {
  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Featured Articles</h2>
        <Link href="/articles" className="text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-48 md:h-auto relative">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {article.isPremium && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      Premium
                    </Badge>
                  </div>
                )}
              </div>
              <div className="md:w-2/3 p-0">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock3Icon className="mr-1 h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl hover:text-primary transition-colors">
                    <Link href={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={article.author.avatar} alt={article.author.name} />
                      <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{article.author.name}</p>
                      <div className="flex items-center text-muted-foreground">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        <span>{article.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/articles/${article.slug}`}>
                      Read article
                    </Link>
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquareIcon className="h-4 w-4" />
                      <span className="sr-only">Comments</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <BookmarkIcon className="h-4 w-4" />
                      <span className="sr-only">Bookmark</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ShareIcon className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}