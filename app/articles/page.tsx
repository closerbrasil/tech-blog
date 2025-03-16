import ArticlesLayout from "@/components/articles/articles-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artigos",
  description: "Aprenda Inteligência Artificial do básico ao avançado, domine APIs, ferramentas e técnicas inovadoras e esteja à frente da revolução tecnológica!",
};

export default function ArticlesPage() {
  return <ArticlesLayout />;
}