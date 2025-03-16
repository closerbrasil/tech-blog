import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeIcon, DatabaseIcon, CpuIcon, GlobeIcon, TerminalIcon, RocketIcon } from "lucide-react";

const categories = [
  {
    id: 1,
    title: "Web Development",
    description: "Frontend frameworks, backend APIs, responsive design",
    icon: <GlobeIcon className="h-6 w-6" />,
    articleCount: 124,
    slug: "web-development",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    id: 2,
    title: "DevOps & Cloud",
    description: "CI/CD, container orchestration, cloud services",
    icon: <RocketIcon className="h-6 w-6" />,
    articleCount: 86,
    slug: "devops-cloud",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    id: 3,
    title: "AI & Machine Learning",
    description: "Neural networks, computer vision, NLP",
    icon: <CpuIcon className="h-6 w-6" />,
    articleCount: 73,
    slug: "ai-machine-learning",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    id: 4,
    title: "Data Science",
    description: "Data analysis, visualization, big data",
    icon: <DatabaseIcon className="h-6 w-6" />,
    articleCount: 65,
    slug: "data-science",
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    id: 5,
    title: "Languages & Tools",
    description: "Programming languages, frameworks, libraries",
    icon: <CodeIcon className="h-6 w-6" />,
    articleCount: 92,
    slug: "languages-tools",
    color: "bg-red-500/10 text-red-500",
  },
  {
    id: 6,
    title: "System Architecture",
    description: "Scalable systems, microservices, databases",
    icon: <TerminalIcon className="h-6 w-6" />,
    articleCount: 54,
    slug: "system-architecture",
    color: "bg-indigo-500/10 text-indigo-500",
  },
];

export default function Categories() {
  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Popular Categories</h2>
        <Link href="/categories" className="text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link href={`/category/${category.slug}`} key={category.id}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.color}`}>
                  {category.icon}
                </div>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  {category.articleCount} articles
                </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}