import PricingPage from "@/components/pricing/pricing-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preços | CloserAI",
  description: "Escolha o plano de assinatura ideal para sua jornada de aprendizado com nossas opções de preços flexíveis.",
};

export default function Pricing() {
  return <PricingPage />;
}