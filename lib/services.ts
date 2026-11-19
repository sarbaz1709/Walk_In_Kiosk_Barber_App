import { shop } from "@/config/shop";
import { getSetmoreClient } from "@/lib/setmore";

// The kiosk's buttons from config, joined with Setmore's price and length.
export async function getKioskServices() {
  const setmoreServices = await getSetmoreClient().listServices();

  return shop.services.flatMap((button) => {
    const key = button.setmoreKey || button.id;
    const service = setmoreServices.find((candidate) => candidate.key === key);
    if (!service) return [];

    return [
      {
        id: button.id,
        label: button.label,
        setmoreKey: service.key,
        priceLabel: `$${Math.round(service.priceCents / 100)}`,
        durationMin: service.durationMin,
      },
    ];
  });
}
