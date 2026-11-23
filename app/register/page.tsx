import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams: Promise<{
    ref?: string;
    redirectTo?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { ref, redirectTo } = await searchParams;
  const params = new URLSearchParams();
  params.set("mode", "register");

  if (ref) params.set("ref", ref);
  if (redirectTo) params.set("redirectTo", redirectTo);

  redirect(`/login?${params.toString()}`);
}
