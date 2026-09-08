/**
 * Kâr hesabı. Buradaki hiçbir sayı tahmin değildir: baz maliyet Printify
 * kataloğundan gelir, komisyonlar aşağıdaki tablodan hesaplanır.
 *
 * Komisyon oranları değişebilir — bu yüzden her oran kaynağı ve doğrulama
 * tarihiyle birlikte tutulur ve panelde açıkça gösterilir. Değiştirmek
 * gerekirse tek yer burasıdır.
 */

export const CHANNEL_FEES = {
  etsy: {
    label: 'Etsy',
    listing: 0.2, // her satışta yenilenen listeleme ücreti
    transactionPct: 0.065, // kargo dahil satış tutarı üzerinden
    paymentPct: 0.03, // ABD satıcıları için
    paymentFlat: 0.25,
    monthly: 0,
    source: 'https://www.etsy.com/legal/fees',
    verifiedAt: '2026-09',
  },
  shopify: {
    label: 'Shopify',
    listing: 0,
    transactionPct: 0, // pazaryeri komisyonu yok
    paymentPct: 0.029, // Shopify Payments, ABD
    paymentFlat: 0.3,
    monthly: 39, // sipariş başına değil; aylık abonelik ayrı gösterilir
    source: 'https://www.shopify.com/pricing',
    verifiedAt: '2026-09',
  },
  printify_popup: {
    label: 'Printify Pop-Up',
    listing: 0,
    transactionPct: 0,
    paymentPct: 0.029,
    paymentFlat: 0.3,
    monthly: 0,
    source: 'https://help.printify.com',
    verifiedAt: '2026-09',
    uncertain: true, // Printify tarafındaki kesinti kanala göre değişebilir
  },
};

/**
 * Tek bir satışın kârını kalem kalem çıkarır.
 *
 * @param {object} input
 * @param {number} input.basePrice      Printify baz maliyeti (ürün + baskı)
 * @param {number} input.shippingCost   Printify kargo maliyeti
 * @param {number} input.salePrice      Müşterinin ürüne ödediği
 * @param {number} [input.shippingCharged] Müşteriden alınan kargo (0 = ücretsiz kargo)
 * @param {string} [input.channel]      CHANNEL_FEES anahtarı
 * @param {number} [input.adRate]       Satış başına reklam maliyeti oranı (0.1 = %10)
 * @param {number} [input.returnRate]   İade/yeniden baskı payı (0.02 = %2)
 */
export function calculateMargin({
  basePrice,
  shippingCost = 0,
  salePrice,
  shippingCharged = 0,
  channel = 'etsy',
  adRate = 0,
  returnRate = 0.02,
}) {
  const fees = CHANNEL_FEES[channel] ?? CHANNEL_FEES.etsy;

  // Etsy komisyonu kargo dahil toplam tahsilat üzerinden işler.
  const buyerPays = round(salePrice + shippingCharged);

  const items = [
    { label: 'Printify baz maliyeti', amount: round(basePrice) },
    { label: 'Printify kargo', amount: round(shippingCost) },
    { label: `${fees.label} listeleme`, amount: round(fees.listing) },
    { label: `${fees.label} işlem (%${(fees.transactionPct * 100).toFixed(1)})`, amount: round(buyerPays * fees.transactionPct) },
    {
      label: `Ödeme (%${(fees.paymentPct * 100).toFixed(1)} + $${fees.paymentFlat.toFixed(2)})`,
      amount: round(buyerPays * fees.paymentPct + fees.paymentFlat),
    },
    { label: `Reklam (%${(adRate * 100).toFixed(0)})`, amount: round(buyerPays * adRate) },
    { label: `İade / yeniden baskı payı (%${(returnRate * 100).toFixed(0)})`, amount: round((basePrice + shippingCost) * returnRate) },
  ].filter((item) => item.amount > 0);

  const totalCost = round(items.reduce((sum, item) => sum + item.amount, 0));
  const profit = round(buyerPays - totalCost);

  return {
    buyerPays,
    items,
    totalCost,
    profit,
    // Marj, müşterinin ödediğinin yüzde kaçının cebe kaldığı.
    marginPct: buyerPays > 0 ? round((profit / buyerPays) * 100, 1) : 0,
    breakEvenPrice: breakEven({ basePrice, shippingCost, shippingCharged, channel, adRate, returnRate }),
    fees: { channel, ...fees },
  };
}

/** Kârın sıfır olduğu satış fiyatı — bunun altında her satış zarardır. */
export function breakEven({ basePrice, shippingCost = 0, shippingCharged = 0, channel = 'etsy', adRate = 0, returnRate = 0.02 }) {
  const fees = CHANNEL_FEES[channel] ?? CHANNEL_FEES.etsy;

  // buyerPays = sabitMaliyet + buyerPays * oranlar  →  buyerPays çözülür.
  const oranlar = fees.transactionPct + fees.paymentPct + adRate;
  const sabit = basePrice + shippingCost + fees.listing + fees.paymentFlat + (basePrice + shippingCost) * returnRate;

  if (oranlar >= 1) return null; // oranlar geliri tamamen yiyorsa fiyat çözülemez
  const buyerPays = sabit / (1 - oranlar);
  return round(buyerPays - shippingCharged);
}

/**
 * Hedeflenen marja ulaşan satış fiyatını bulur.
 * @param {number} targetMarginPct Örn. 30 → %30 kâr marjı
 */
export function priceForMargin({ basePrice, shippingCost = 0, shippingCharged = 0, channel = 'etsy', adRate = 0, returnRate = 0.02, targetMarginPct = 30 }) {
  const fees = CHANNEL_FEES[channel] ?? CHANNEL_FEES.etsy;
  const hedef = targetMarginPct / 100;
  const oranlar = fees.transactionPct + fees.paymentPct + adRate;
  const sabit = basePrice + shippingCost + fees.listing + fees.paymentFlat + (basePrice + shippingCost) * returnRate;

  // profit = buyerPays * hedef  ve  profit = buyerPays - sabit - buyerPays * oranlar
  const payda = 1 - oranlar - hedef;
  if (payda <= 0) return null; // bu marj bu komisyon yapısında mümkün değil
  return round(sabit / payda - shippingCharged);
}

/** Printify fiyatları sent cinsinden tam sayı verir (2499 = $24.99). */
export const centsToDollars = (cents) => round((Number(cents) || 0) / 100);

const round = (value, digits = 2) => Number((Number(value) || 0).toFixed(digits));
