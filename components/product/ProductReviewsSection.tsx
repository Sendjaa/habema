"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { ReviewForm } from "@/components/product/review-form";

interface ProductReviewsSectionProps {
  id: string;
  isShop: boolean;
  reviews: any[];
  ratingStats: { average: number; total: number; distribution: Record<number, number>; satisfaction: number };
  filteredReviews: any[];
  reviewFilters: string[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  submittingReply: boolean;
  handleReplySubmit: (reviewId: number) => Promise<void>;
  getRepliesForReview: (reviewId: number, allReviews: any[]) => any[];
  canReview: boolean;
  onReviewSubmitted: () => void;
}

export function ProductReviewsSection({
  id,
  isShop,
  reviews,
  ratingStats,
  filteredReviews,
  reviewFilters,
  activeFilter,
  setActiveFilter,
  showReviewForm,
  setShowReviewForm,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  submittingReply,
  handleReplySubmit,
  getRepliesForReview,
  canReview,
  onReviewSubmitted,
}: ProductReviewsSectionProps) {
  const reviewContent = showReviewForm ? (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Tulis Ulasan</h3>
        <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Batal</Button>
      </div>
      <ReviewForm
        equipmentId={isShop ? undefined : id}
        shopProductId={isShop ? id : undefined}
        onReviewSubmitted={onReviewSubmitted}
      />
    </div>
  ) : (
    <Button onClick={() => setShowReviewForm(true)} className="w-full bg-[#1B4332] hover:bg-[#143326]">
      Tulis Ulasan
    </Button>
  );

  return (
    <section className="mt-16 px-4 md:px-0">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-amber-100 rounded-md">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Ulasan & Rating</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl font-black text-slate-800 flex items-baseline gap-1">
              {ratingStats.average.toFixed(1)}
              <span className="text-lg text-slate-400 font-normal">/5.0</span>
            </div>
            <div className="flex gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(ratingStats.average) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500">{ratingStats.total} ulasan</p>
          </div>

          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingStats.distribution[rating as keyof typeof ratingStats.distribution];
              const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 w-8">{rating}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-slate-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {reviewFilters.map((filter) => (
              <Badge key={filter} variant="outline" onClick={() => setActiveFilter(filter)} className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${activeFilter === filter ? "bg-[#1B4332] text-white border-[#1B4332]" : "bg-white text-slate-600 border-slate-200 hover:border-[#1B4332]"}`}>
                {filter}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">{review.users?.full_name?.charAt(0) || "U"}</div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{review.users?.full_name || "User"}</p>
                        <div className="flex gap-0.5 my-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(review.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>

                    {replyingTo === review.id && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-2">
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Tulis balasan Anda..." className="w-full p-2 text-sm border border-slate-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" rows={3} disabled={submittingReply} />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(""); }} disabled={submittingReply}>Batal</Button>
                            <Button size="sm" onClick={() => handleReplySubmit(review.id)} disabled={submittingReply || replyText.trim().length < 5} className="bg-emerald-600 hover:bg-emerald-700">{submittingReply ? "Mengirim..." : "Kirim Balasan"}</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {getRepliesForReview(review.id, reviews).length > 0 && (
                      <div className="space-y-2">
                        {getRepliesForReview(review.id, reviews).map((reply) => (
                          <div key={reply.id} className="ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-600">{(reply.users?.full_name || "User")[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{reply.users?.full_name || "User"}</p>
                                <p className="text-[10px] text-slate-400">{new Date(reply.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{(reply.comment || "").replace(/^@[^:]+:\s*/, "")}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600" onClick={() => setReplyingTo(review.id)}><MessageSquare className="w-3 h-3 mr-1" /> Balas</Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-10 text-center">
                <p className="text-sm text-slate-500">{activeFilter === "Bintang 4" ? "Belum ada ulasan bintang 4 untuk produk ini" : activeFilter === "Bintang 5" ? "Belum ada ulasan bintang 5 untuk produk ini" : activeFilter === "Dengan Foto" ? "Belum ada ulasan dengan foto untuk produk ini" : "Belum ada ulasan untuk produk ini"}</p>
              </Card>
            )}
          </div>

          {reviewContent}
        </div>
      </div>
    </section>
  );
}