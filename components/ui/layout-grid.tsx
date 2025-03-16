'use client'

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  titulo: string;
  slug: string;
  thumbnail_url: string | null;
  duracao: number | null;
  visualizacoes: number | null;
  publicado_em: Date;
  autor: {
    nome: string;
    avatar_url: string;
  } | null;
  categoria: {
    nome: string;
    cor: string;
  } | null;
  className?: string;
};

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  const [selected, setSelected] = useState<Card | null>(null);
  const [lastSelected, setLastSelected] = useState<Card | null>(null);

  const handleClick = (card: Card) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  return (
    <div className="w-full h-full p-10 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-4 relative">
      {cards.map((card) => (
        <div key={card.id} className={cn(card.className, "")}>
          <motion.div
            onClick={() => handleClick(card)}
            className={cn(
              "relative overflow-hidden",
              selected?.id === card.id
                ? "rounded-lg cursor-pointer absolute inset-0 h-1/2 w-full md:w-1/2 m-auto z-50 flex justify-center items-center flex-wrap flex-col"
                : lastSelected?.id === card.id
                ? "z-40 bg-white dark:bg-gray-800 rounded-xl h-full w-full"
                : "bg-white dark:bg-gray-800 rounded-xl h-full w-full"
            )}
            layoutId={`card-${card.id}`}
          >
            {selected?.id === card.id ? (
              <Link href={`/videos/${card.slug}`} className="w-full h-full">
                <SelectedCard selected={selected} />
              </Link>
            ) : (
              <Link href={`/videos/${card.slug}`} className="w-full h-full">
                <div className="relative aspect-video">
                  <Image
                    src={card.thumbnail_url || '/placeholder-video.jpg'}
                    alt={card.titulo}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {Math.floor(card.duracao ? card.duracao / 60 : 0)}:{String(card.duracao ? card.duracao % 60 : 0).padStart(2, '0')}
                  </div>
                </div>
                
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">{card.titulo}</h2>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    {card.autor && (
                      <div className="flex items-center">
                        <Image
                          src={card.autor.avatar_url}
                          alt={card.autor.nome}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                        <span>{card.autor.nome}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center ml-auto space-x-2">
                      <span>{card.visualizacoes} visualizações</span>
                      <span>•</span>
                      <span>{new Date(card.publicado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  {card.categoria && (
                    <div className="mt-2">
                      <span 
                        className="inline-block px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: card.categoria.cor }}
                      >
                        {card.categoria.nome}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )}
          </motion.div>
        </div>
      ))}
      <motion.div
        onClick={handleOutsideClick}
        className={cn(
          "absolute h-full w-full left-0 top-0 bg-black opacity-0 z-10",
          selected?.id ? "pointer-events-auto" : "pointer-events-none"
        )}
        animate={{ opacity: selected?.id ? 0.3 : 0 }}
      />
    </div>
  );
};

const SelectedCard = ({ selected }: { selected: Card }) => {
  return (
    <div className="bg-transparent h-full w-full flex flex-col justify-end rounded-lg shadow-2xl relative z-[60]">
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 0.6,
        }}
        className="absolute inset-0 h-full w-full bg-black opacity-60 z-10"
      />
      <motion.div
        initial={{
          opacity: 0,
          y: 100,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 100,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="relative px-8 pb-4 z-[70]"
      >
        <h2 className="text-2xl font-bold text-white mb-2">{selected.titulo}</h2>
        <div className="flex items-center text-sm text-gray-300">
          {selected.autor && (
            <div className="flex items-center">
              <Image
                src={selected.autor.avatar_url}
                alt={selected.autor.nome}
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
              <span>{selected.autor.nome}</span>
            </div>
          )}
          <div className="flex items-center ml-auto space-x-2">
            <span>{selected.visualizacoes} visualizações</span>
            <span>•</span>
            <span>{new Date(selected.publicado_em).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 