import ThemeRegistry from "@/lib/theme";
import PaymentCheckout from "./payment-checkout";

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; clinicId?: string; clinic?: string }>;
}) {
  const params = await searchParams;
  return (
    <ThemeRegistry>
      <PaymentCheckout
        target={params.target === "clinic" ? "clinic" : "individual"}
        clinicId={params.clinicId ?? null}
        clinicName={params.clinic ?? null}
      />
    </ThemeRegistry>
  );
}
