"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { LoginModal } from "@/components/auth/login-modal";

interface ReviewFormProps {
  equipmentId?: string;
  shopProductId?: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({
  equipmentId,
  shopProductId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      const body: Record<string, any> = { rating, comment: comment.trim() };
      if (equipmentId) body.equipmentId = equipmentId;
      if (shopProductId) body.shopProductId = shopProductId;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ulasan");
      }

      toast.success("Ulasan berhasil dikirim!");
      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Gagal mengirim ulasan");
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
        {submitting ? "Mengirim..." : "Kirim Ulasan"}
      </Button>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </form>
  );
}
