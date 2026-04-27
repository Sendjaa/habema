"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

interface ReviewFormProps {
  equipmentId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ equipmentId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Mohon berikan rating");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Komentar harus minimal 10 karakter");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Anda harus login untuk memberikan review");
        return;
      }

      const { error } = await (supabase as any)
        .from("reviews")
        .insert({
          equipment_id: equipmentId,
          user_id: user.id,
          rating,
          comment: comment.trim(),
        });

      if (error) throw error;

      toast.success("Review berhasil dikirim!");
      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Gagal mengirim review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Ulasan</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bagikan pengalaman Anda menggunakan produk ini..."
          rows={4}
          className="resize-none"
          minLength={10}
        />
        <p className="text-xs text-slate-400">
          {comment.length}/10 karakter minimum
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={submitting || rating === 0 || comment.length < 10}
        className="w-full"
      >
        {submitting ? "Mengirim..." : "Kirim Review"}
      </Button>
    </form>
  );
}
