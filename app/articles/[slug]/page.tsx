import ArticleDetail from "@/components/articles/article-detail";
import { Metadata } from "next";

// This would normally come from a database or API
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
      bio: "Senior Frontend Engineer at TechCorp. React enthusiast and open source contributor.",
    },
    content: `
      # The Complete Guide to React Server Components in 2025

      React Server Components (RSC) have fundamentally changed how we build React applications. In this comprehensive guide, we'll explore the latest features, best practices, and real-world applications of React Server Components in 2025.

      ## What are React Server Components?

      React Server Components allow developers to render React components on the server, sending only the minimal necessary HTML and data to the client. This approach offers several benefits:

      - Reduced JavaScript bundle sizes
      - Improved initial page load performance
      - Better SEO out of the box
      - Direct access to backend resources without API layers

      ## Key Concepts

      ### Component Types

      - **Server Components**: Render on the server only, can access backend resources directly
      - **Client Components**: Render on the client, can be interactive with hooks and event handlers
      - **Shared Components**: Can be used in both server and client contexts

      ### Code Example

      \`\`\`jsx
      // server-component.jsx
      export default async function ServerComponent() {
        // Direct database access without exposing credentials to client
        const data = await db.query('SELECT * FROM users');
        
        return (
          <div>
            <h1>User List</h1>
            <ul>
              {data.map(user => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
            <ClientComponent />
          </div>
        );
      }

      // client-component.jsx
      'use client';

      import { useState } from 'react';

      export default function ClientComponent() {
        const [count, setCount] = useState(0);
        
        return (
          <button onClick={() => setCount(count + 1)}>
            Count: {count}
          </button>
        );
      }
      \`\`\`

      ## Best Practices

      1. **Component Organization**: Clearly separate server and client components in your project structure
      2. **Data Fetching**: Leverage server components for data fetching to avoid exposing API endpoints
      3. **Progressive Enhancement**: Design your app to work well even if JavaScript fails to load
      4. **Selective Hydration**: Only hydrate interactive parts of your UI to reduce JavaScript payload
      
      ## Advanced Patterns

      ### Streaming Rendering

      RSC supports streaming HTML responses, allowing the browser to start rendering content before the entire page is ready:

      \`\`\`jsx
      import { Suspense } from 'react';

      export default function Page() {
        return (
          <div>
            <h1>Dashboard</h1>
            <Suspense fallback={<p>Loading header...</p>}>
              <Header />
            </Suspense>
            <Suspense fallback={<p>Loading main content...</p>}>
              <MainContent />
            </Suspense>
            <Suspense fallback={<p>Loading footer...</p>}>
              <Footer />
            </Suspense>
          </div>
        );
      }
      \`\`\`

      ### Server Actions

      Form submissions and data mutations can be handled directly on the server:

      \`\`\`jsx
      'use server';

      async function addComment(formData) {
        const comment = formData.get('comment');
        await db.comments.create({ content: comment });
        revalidatePath('/post/[id]');
      }

      export function CommentForm() {
        return (
          <form action={addComment}>
            <textarea name="comment" required />
            <button type="submit">Add Comment</button>
          </form>
        );
      }
      \`\`\`
    `,
    tags: ["React", "JavaScript", "Server Components", "Web Development", "Performance"],
    comments: 24,
    slug: "complete-guide-react-server-components-2025",
    resources: [
      {
        type: "github" as const,
        title: "React Server Components Demo",
        url: "https://github.com/reactjs/server-components-demo",
      },
      {
        type: "documentation" as const,
        title: "Official React Documentation",
        url: "https://react.dev/reference/react/use-server",
      },
      {
        type: "download" as const,
        title: "Starter Template",
        url: "https://example.com/rsc-starter-template.zip",
      },
      {
        type: "related" as const,
        title: "Next.js Documentation",
        url: "https://nextjs.org/docs",
      },
    ],
    relatedArticles: [2, 4, 5],
  },
];

// This would be dynamic in a real application
export const generateMetadata = ({ params }: { params: { slug: string } }): Metadata => {
  const article = articles.find(article => article.slug === params.slug);
  
  if (!article) {
    return {
      title: "Artigo não encontrado | CloserAI", 
      description: "O artigo solicitado não foi encontrado.",
    };
  }
  
  return {
    title: `${article.title} | CloserAI`,
    description: article.description,
    keywords: article.tags.join(", "),
    openGraph: {
      title: article.title,
      description: article.description,
      images: [{ url: article.image }],
    },
  };
};

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find(article => article.slug === params.slug);
  
  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Artigo não encontrado</h1>
        <p className="text-muted-foreground mb-8">O artigo que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }
  
  return <ArticleDetail article={article} />;
}