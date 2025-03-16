import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock3Icon, BookmarkIcon, MessageSquareIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Author {
  name: string;
  avatar: string;
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
  comments: number;
  slug: string;
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-48 md:h-auto relative">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
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
  );
}