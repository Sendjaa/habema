import { NextResponse } from "next/dist/server/web/exports";

export async function GET() {
  const featured = [
    { id: "1", name: "Tenda Arpenaz 4.1", price: 75000, image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=500", rating: 4.9 }
  ];
  return NextResponse.json(featured);
}