'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const PRICE_PRESETS = [
  { label: '≤ 50rb', value: 50000 },
  { label: '≤ 150rb', value: 150000 },
  { label: '≤ 500rb', value: 500000 },
  { label: 'Semua', value: 5000000 },
]

export function CatalogFilters({
  dbCategories = [],
  hideCategory = false,
  hideSearch = false,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  priceRange,
  onPriceRangeChange,
  branches = [],
  selectedBranchId = null,
  onBranchChange,
}: any) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const hasCategoryFilter = !hideCategory && selectedCategory && selectedCategory !== 'all'
  const hasBranchFilter = Boolean(selectedBranchId)
  const hasPriceFilter = Array.isArray(priceRange) && priceRange[1] < 5000000
  const activeFilterCount =
    (hasCategoryFilter ? 1 : 0) +
    (hasBranchFilter ? 1 : 0) +
    (hasPriceFilter ? 1 : 0)

  const activeCategoryLabel = dbCategories.find((c: any) => c.value === selectedCategory)?.label
  const activeBranchLabel = branches.find((b: any) => b.id === selectedBranchId)?.name

  const handleResetAll = () => {
    if (!hideCategory && onCategoryChange) onCategoryChange('all')
    if (onBranchChange) onBranchChange(null)
    if (onPriceRangeChange) onPriceRangeChange([0, 5000000])
  }

  // Komponen Filter yang akan di-reuse
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-none border border-stone-300 overflow-hidden shadow-none">
        {/* Header Panel Filter */}
        <div className="px-4 py-3 bg-[#F4F1EA] border-b border-stone-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#183028]">
              Parameter Filter
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#183028] text-white text-[10px] font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C85A17] hover:text-stone-950 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Chips (Interaktif Lepas Satuan) */}
        {activeFilterCount > 0 && (
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex flex-wrap gap-1.5">
            {hasCategoryFilter && (
              <button
                type="button"
                onClick={() => onCategoryChange('all')}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-300 hover:border-stone-950 text-[11px] font-medium text-stone-800 transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[130px]">{activeCategoryLabel || selectedCategory}</span>
                <X className="w-3 h-3 text-stone-500" />
              </button>
            )}
            {hasBranchFilter && (
              <button
                type="button"
                onClick={() => onBranchChange && onBranchChange(null)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-300 hover:border-stone-950 text-[11px] font-medium text-stone-800 transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[130px]">{activeBranchLabel || 'Cabang'}</span>
                <X className="w-3 h-3 text-stone-500" />
              </button>
            )}
            {hasPriceFilter && (
              <button
                type="button"
                onClick={() => onPriceRangeChange([0, 5000000])}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-300 hover:border-stone-950 text-[11px] font-medium text-stone-800 tabular-nums transition-colors cursor-pointer"
              >
                <span>≤ Rp{priceRange[1].toLocaleString('id-ID')}</span>
                <X className="w-3 h-3 text-stone-500" />
              </button>
            )}
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={hideCategory ? ['price', 'branch'] : ['cat', 'branch', 'price']}
          className="w-full"
        >
          {!hideCategory && (
            <AccordionItem value="cat" className="px-4 border-b border-stone-200">
              <AccordionTrigger className="text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:no-underline py-3.5 cursor-pointer">
                Kategori
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pb-4">
                <div
                  onClick={() => onCategoryChange('all')}
                  className={`flex items-center justify-between gap-3 px-2.5 py-2 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#F4F1EA] text-stone-950'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="cat-all"
                      checked={selectedCategory === 'all'}
                      onCheckedChange={() => onCategoryChange('all')}
                      className="w-4 h-4 rounded-none border-stone-400 data-[state=checked]:bg-[#183028] data-[state=checked]:border-[#183028]"
                    />
                    <Label
                      htmlFor="cat-all"
                      className="text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Semua Kategori
                    </Label>
                  </div>
                  {selectedCategory === 'all' && (
                    <Check className="w-3.5 h-3.5 text-[#183028]" />
                  )}
                </div>

                {dbCategories.length > 0 ? (
                  dbCategories.map((cat: any) => {
                    const isChecked = selectedCategory === cat.value
                    return (
                      <div
                        key={cat.value}
                        onClick={() => onCategoryChange(cat.value)}
                        className={`flex items-center justify-between gap-3 px-2.5 py-2 transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-[#F4F1EA] text-stone-950'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            id={`cat-${cat.value}`}
                            checked={isChecked}
                            onCheckedChange={() => onCategoryChange(cat.value)}
                            className="w-4 h-4 rounded-none border-stone-400 data-[state=checked]:bg-[#183028] data-[state=checked]:border-[#183028] shrink-0"
                          />
                          <Label
                            htmlFor={`cat-${cat.value}`}
                            className={`text-xs sm:text-sm cursor-pointer truncate transition-colors ${
                              isChecked
                                ? 'font-semibold text-stone-950'
                                : 'font-medium text-stone-700'
                            }`}
                          >
                            {cat.label}
                          </Label>
                        </div>
                        {isChecked && (
                          <Check className="w-3.5 h-3.5 text-[#183028] shrink-0" />
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-2 animate-pulse flex flex-col gap-2">
                    <div className="h-7 bg-stone-100 rounded-none w-full" />
                    <div className="h-7 bg-stone-100 rounded-none w-5/6" />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Section Cabang */}
          {branches.length > 0 && (
            <AccordionItem value="branch" className="px-4 border-b border-stone-200">
              <AccordionTrigger className="text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:no-underline py-3.5 cursor-pointer">
                Cabang
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pb-4">
                <div
                  onClick={() => onBranchChange && onBranchChange(null)}
                  className={`flex items-center justify-between gap-3 px-2.5 py-2 transition-colors cursor-pointer ${
                    !selectedBranchId
                      ? 'bg-[#F4F1EA] text-stone-950'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="branch-all"
                      checked={!selectedBranchId}
                      onCheckedChange={() => onBranchChange && onBranchChange(null)}
                      className="w-4 h-4 rounded-none border-stone-400 data-[state=checked]:bg-[#183028] data-[state=checked]:border-[#183028]"
                    />
                    <Label
                      htmlFor="branch-all"
                      className="text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Semua Cabang
                    </Label>
                  </div>
                  {!selectedBranchId && (
                    <Check className="w-3.5 h-3.5 text-[#183028]" />
                  )}
                </div>

                {branches.map((branch: any) => {
                  const isChecked = selectedBranchId === branch.id
                  return (
                    <div
                      key={branch.id}
                      onClick={() => onBranchChange && onBranchChange(branch.id)}
                      className={`flex items-center justify-between gap-3 px-2.5 py-2 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#F4F1EA] text-stone-950'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Checkbox
                          id={`branch-${branch.id}`}
                          checked={isChecked}
                          onCheckedChange={() => onBranchChange && onBranchChange(branch.id)}
                          className="w-4 h-4 rounded-none border-stone-400 data-[state=checked]:bg-[#183028] data-[state=checked]:border-[#183028] shrink-0"
                        />
                        <Label
                          htmlFor={`branch-${branch.id}`}
                          className={`text-xs sm:text-sm cursor-pointer truncate transition-colors ${
                            isChecked
                              ? 'font-semibold text-stone-950'
                              : 'font-medium text-stone-700'
                          }`}
                        >
                          {branch.name}
                        </Label>
                      </div>
                      {isChecked && (
                        <Check className="w-3.5 h-3.5 text-[#183028] shrink-0" />
                      )}
                    </div>
                  )
                })}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Section Harga */}
          <AccordionItem value="price" className="px-4 border-none">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:no-underline py-3.5 cursor-pointer">
              Harga Maksimal
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-5 space-y-4">
              <div className="px-3 py-2.5 bg-[#F4F1EA] rounded-none border border-stone-300 flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Batas
                </span>
                <span className="text-sm sm:text-base font-bold text-[#183028] tabular-nums">
                  Rp{priceRange[1].toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  min="0"
                  max="5000000"
                  step="10000"
                  value={priceRange[1]}
                  onChange={(e) => onPriceRangeChange([0, parseInt(e.target.value, 10)])}
                  className="w-full accent-[#183028] h-1.5 bg-stone-200 rounded-none appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-medium text-stone-400 tabular-nums">
                  <span>Rp0</span>
                  <span>Rp5.000.000</span>
                </div>
              </div>

              {/* Quick Price Presets */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {PRICE_PRESETS.map((preset) => {
                  const isActive = priceRange[1] === preset.value
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onPriceRangeChange([0, preset.value])}
                      className={`px-2 py-1.5 text-[11px] font-bold border transition-colors tabular-nums cursor-pointer ${
                        isActive
                          ? 'bg-[#183028] text-white border-[#183028]'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-950 hover:text-stone-950'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3.5">
      {/* Search Bar Row */}
      <div className="flex items-center gap-2">
        {!hideSearch && (
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 group-focus-within:text-stone-950 transition-colors pointer-events-none" />
            <Input
              placeholder="Cari perlengkapan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9 rounded-none border-stone-300 focus-visible:border-stone-950 focus-visible:ring-0 placeholder:text-stone-400 bg-white h-10 text-xs sm:text-sm text-stone-950 shadow-none w-full transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-950 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Tombol Filter Mobile */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Buka filter produk"
                className="relative h-10 w-10 rounded-none bg-white border-stone-300 hover:border-stone-950 hover:bg-stone-50 shadow-none cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-stone-900" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#C85A17] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-none border-t border-stone-900 bg-[#F4F1EA] h-[82vh] overflow-y-auto px-5 pt-6"
            >
              <SheetHeader className="pb-4 border-b border-stone-300 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#183028] block text-left">
                      Direktori Gear
                    </span>
                    <SheetTitle className="text-left text-xl font-bold text-stone-950 tracking-tight">
                      Filter Produk
                    </SheetTitle>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-xs font-bold uppercase tracking-wider text-[#C85A17] hover:underline cursor-pointer"
                    >
                      Reset ({activeFilterCount})
                    </button>
                  )}
                </div>
              </SheetHeader>

              <FilterContent />

              <div className="mt-6 pb-4 flex gap-2">
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetAll}
                    className="h-11 px-4 rounded-none border-stone-400 bg-white text-stone-900 text-xs font-bold uppercase tracking-wider shadow-none cursor-pointer"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 bg-[#183028] hover:bg-stone-950 text-white h-11 rounded-none text-xs font-bold uppercase tracking-wider shadow-none cursor-pointer"
                >
                  Terapkan Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
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