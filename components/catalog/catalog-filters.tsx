'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, X, SlidersHorizontal, ArrowLeft } from 'lucide-react'
import  Link  from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function CatalogFilters({
  dbCategories = [],
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  priceRange,
  onPriceRangeChange
}: any) {

  // Komponen Filter yang akan di-reuse
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-md md:rounded-2xl border border-slate-200 overflow-hidden shadow-xs md:shadow-sm">
        <Accordion type="multiple" defaultValue={["cat", "price"]} className="w-full">
          {/* Section Kategori */}
          <AccordionItem value="cat" className="px-4 border-slate-100">
            <AccordionTrigger className="text-sm font-bold text-slate-800 hover:no-underline py-4">
              Kategori
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex items-center gap-3 py-1">
                <Checkbox 
                  id="cat-all" 
                  checked={selectedCategory === 'all'} 
                  onCheckedChange={() => onCategoryChange('all')} 
                  className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-[#1B4332] data-[state=checked]:border-[#1B4332]"
                />
                <Label htmlFor="cat-all" className="text-sm font-semibold cursor-pointer">
                  Semua Kategori
                </Label>
              </div>
              
              {dbCategories.length > 0 ? dbCategories.map((cat: any) => (
                <div key={cat.value} className="flex items-center gap-3 py-1">
                  <Checkbox 
                    id={`cat-${cat.value}`} 
                    checked={selectedCategory === cat.value} 
                    onCheckedChange={() => onCategoryChange(cat.value)}
                    className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-[#1B4332] data-[state=checked]:border-[#1B4332]"
                  />
                  <Label 
                    htmlFor={`cat-${cat.value}`} 
                    className="text-sm cursor-pointer text-slate-600 font-medium hover:text-[#1B4332] transition-colors"
                  >
                    {cat.label}
                  </Label>
                </div>
              )) : (
                <div className="py-2 animate-pulse flex flex-col gap-2">
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Section Harga */}
          <AccordionItem value="price" className="px-4 border-none">
            <AccordionTrigger className="text-sm font-bold text-slate-800 hover:no-underline py-4">
              Harga Maksimal
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 space-y-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center font-black text-[#1B4332] shadow-inner">
                Rp{priceRange[1].toLocaleString('id-ID')}
              </div>
              <input 
                type="range" 
                min="0" 
                max="500000" 
                step="10000" 
                value={priceRange[1]} 
                onChange={(e) => onPriceRangeChange([0, parseInt(e.target.value)])}
                className="w-full accent-[#1B4332] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar Row */}
      <div className="flex items-center gap-2">
        
        {/* Tombol Back ke Home (Hanya Mobile: md:hidden atau tampilkan di keduanya) */}
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className=" h-8 w-8 md:h-11 md:w-11 rounded-md md:rounded-xl bg-white border border-slate-200 shadow-xs md:shadow-sm text-slate-600 hover:text-[#1B4332]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        {/* Search Input Container */}
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1B4332] hover:text-[#1B4332]" />
          <Input 
            placeholder="Cari alat camp..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 rounded-md md:rounded-xl lg:rounded-xl border-slate-200 focus-visible:ring-[#1B4332] placeholder:text-#1B4332 bg-white h-8 md:h-11 text-xs md:text-sm lg:text-sm shadow-sm w-full"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Tombol Filter Mobile */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-md bg-white border-slate-200 shadow-sm">
                <SlidersHorizontal className="w-5 h-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[32px] h-[80vh] overflow-y-auto px-6">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left text-lg font-black text-[#1B4332]">Filter Produk</SheetTitle>
              </SheetHeader>
              <FilterContent />
              <div className="mt-6">
                <Button className="w-full bg-[#1B4332] h-12 rounded-xl font-bold" onClick={() => (document.querySelector('[data-radix-collection-item]') as any)?.click()}>
                  Terapkan Filter
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filter Desktop */}
      <div className="hidden md:block">
        <FilterContent />
      </div>
    </div>
  )
}