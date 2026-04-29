"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ArrowLeft, MessageSquare, MessageCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { ReviewForm } from "@/components/product/review-form";

// Function to calculate rating from reviews (excluding replies)
const calculateRatingFromReviews = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) {
    return { average: 4.9, count: 0 };
  }
  
  // Only count reviews that are not replies (exclude @mention replies)
  const validReviews = reviews.filter(review => !review.comment.startsWith('@'));
  const totalRating = validReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = validReviews.length > 0 ? totalRating / validReviews.length : 4.9;
  
  return {
    average: averageRating,
    count: validReviews.length
  };
};

// Function to get replies for a specific review
const getRepliesForReview = (reviewId: number, allReviews: any[]) => {
  const review = allReviews.find(r => r.id === reviewId);
  if (!review) return [];
  
  // Find replies that mention the review author (replies start with @mention)
  const mentionName = review.users?.full_name || 'User';
  return allReviews.filter(r => 
    r.comment.startsWith(`@${mentionName}:`) &&
    r.id !== reviewId
  );
};

// Function to filter reviews based on active filter
const getFilteredReviews = (allReviews: any[], activeFilter: string) => {
  // Exclude replies from main review list
  const mainReviews = allReviews.filter(review => !review.comment.startsWith('@'));
  
  switch (activeFilter) {
    case "Dengan Foto":
      // For now, return all since we don't have image data in reviews
      // TODO: Add image filtering logic when review images are implemented
      return mainReviews;
    case "Bintang 5":
      return mainReviews.filter(review => review.rating === 5);
    case "Bintang 4":
      return mainReviews.filter(review => review.rating === 4);
    default:
      return mainReviews;
  }
};

export default function ReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("Semua");

  const reviewFilters = ["Semua", "Dengan Foto", "Bintang 5", "Bintang 4"];

  // Calculate rating statistics from reviews
  const ratingStats = (() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        satisfaction: 0,
      };
    }

    const validReviews = reviews.filter(review => !review.comment.startsWith('@'));
    const total = validReviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    validReviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });

    const totalRating = validReviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total > 0 ? totalRating / total : 0;
    const satisfaction = total > 0 ? (distribution[5] + distribution[4]) / total * 100 : 0;

    return { average, total, distribution, satisfaction };
  })();

  // Handle reply submission
  const handleReplySubmit = async (reviewId: number) => {
    if (replyText.trim().length < 5) {
      toast.error("Balasan harus minimal 5 karakter");
      return;
    }

    setSubmittingReply(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Anda harus login untuk membalas review");
        return;
      }

      // Check if user exists in users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (userError || !userRecord) {
        // Create user record if it doesn't exist
        const { error: insertError } = await (supabase as any)
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });

        if (insertError) {
          console.error('Error creating user record:', insertError);
          toast.error('Gagal membuat user record. Silakan coba lagi.');
          return;
        }
      }

      // Find the original review to get the author's name
      const originalReview = reviews.find(r => r.id === reviewId);
      const authorName = originalReview?.users?.full_name || 'User';

      // Insert reply (using reviews table with special prefix in comment)
      const replyData = {
        equipment_id: id,
        user_id: user.id,
        rating: 5, // Use valid rating (1-5) to satisfy check constraint
        comment: `@${authorName}: ${replyText.trim()}`, // Prefix with @mention
        created_at: new Date().toISOString(), // Add created_at if required
      };

      console.log('Inserting reply data:', replyData);

      const { data, error } = await (supabase as any)
        .from("reviews")
        .insert(replyData)
        .select();

      if (error) {
        console.error('Reply insertion error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Gagal menyimpan balasan: ${error.message || 'Unknown error'}`);
      }

      console.log('Reply inserted successfully:', data);

      toast.success("Balasan berhasil dikirim!");
      setReplyText("");
      setReplyingTo(null);
      
      // Refresh reviews
      const { data: refreshedReviews } = await supabase
        .from("reviews")
        .select("*, users(full_name)")
        .eq("equipment_id", id)
        .order("created_at", { ascending: false });
      
      setReviews(refreshedReviews || []);
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error(error.message || "Gagal mengirim balasan");
    } finally {
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("equipment")
          .select(`*, equipment_categories(name)`)
          .eq("id", id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("*, users(full_name)")
          .eq("equipment_id", id)
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews(reviewsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Produk tidak ditemukan</p>
          <Button onClick={() => router.back()} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredReviews(reviews, activeFilter);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Ulasan Produk</h1>
              <p className="text-sm text-slate-500">{product.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Product Info */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border shrink-0">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{product.name}</h2>
              <p className="text-sm text-slate-500">{product.equipment_categories?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {calculateRatingFromReviews(reviews).average.toFixed(1)}
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{reviews.length > 0 ? `${reviews.length} Review` : `Belum ada review`}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Rating Summary */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center justify-center text-center">
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

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingStats.distribution[rating as keyof typeof ratingStats.distribution];
                const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 w-8">{rating}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {reviewFilters.map((filter) => (
            <Badge
              key={filter}
              variant="outline"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                activeFilter === filter
                  ? "bg-[#1B4332] text-white border-[#1B4332]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#1B4332]"
              }`}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
                          {review.users?.full_name?.charAt(0) || "U"}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {review.users?.full_name || "User"}
                        </p>
                        <div className="flex gap-0.5 my-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(review.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Reply Form */}
                  {replyingTo === review.id && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasan Anda..."
                          className="w-full p-2 text-sm border border-slate-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          rows={3}
                          disabled={submittingReply}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            disabled={submittingReply}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReplySubmit(review.id)}
                            disabled={submittingReply || replyText.trim().length < 5}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {submittingReply ? "Mengirim..." : "Kirim Balasan"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Replies */}
                  {(() => {
                    const replies = getRepliesForReview(review.id, reviews);
                    if (replies.length > 0) {
                      return (
                        <div className="mt-3 space-y-2">
                          {replies.map((reply) => (
                            <div key={reply.id} className="ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-emerald-600">
                                    {(reply.users?.full_name || 'User')[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-700">
                                    {reply.users?.full_name || 'User'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(reply.created_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {reply.comment.replace(/^@\w+:\s*/, '')} {/* Remove @mention prefix */}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Balas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Lapor
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-sm text-slate-500">
                {activeFilter === "Bintang 4" 
                  ? "Belum ada ulasan bintang 4 untuk produk ini" 
                  : activeFilter === "Bintang 5"
                  ? "Belum ada ulasan bintang 5 untuk produk ini"
                  : activeFilter === "Dengan Foto"
                  ? "Belum ada ulasan dengan foto untuk produk ini"
                  : "Belum ada ulasan untuk produk ini"}
              </p>
            </Card>
          )}
        </div>

        {/* Add Review Button */}
        <Card className="p-6">
          {!showReviewForm ? (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="w-full"
            >
              Tulis Ulasan
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Tulis Ulasan</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowReviewForm(false)}
                >
                  Batal
                </Button>
              </div>
              <ReviewForm
                equipmentId={id}
                onReviewSubmitted={() => {
                  setShowReviewForm(false);
                  // Refresh reviews
                  supabase
                    .from("reviews")
                    .select("*, users(full_name)")
                    .eq("equipment_id", id)
                    .order("created_at", { ascending: false })
                    .then(({ data }) => setReviews(data || []));
                }}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
