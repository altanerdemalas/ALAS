import { config, hasPrintify } from '../config.js';

/**
 * Printify REST API v1 istemcisi.
 * https://developers.printify.com — token yoksa çağrılar açıklayıcı hata verir,
 * panel de "bağlı değil" durumunu gösterir.
 */
async function request(path, { method = 'GET', body } = {}) {
  if (!hasPrintify()) {
    throw new Error('PRINTIFY_API_TOKEN tanımlı değil. .env dosyasına ekleyip sunucuyu yeniden başlat.');
  }

  const response = await fetch(`${config.printify.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.printify.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'alas-pod-agent',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Printify ${response.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

export const listShops = () => request('/shops.json');

/** Blueprint = ürün tipi (tişört, kupa...). Katalog gezinmenin başlangıcı. */
export const listBlueprints = () => request('/catalog/blueprints.json');

export const getBlueprint = (blueprintId) => request(`/catalog/blueprints/${blueprintId}.json`);

/** Bir blueprint'i basabilen üreticiler; kalite ve kargo burada ayrışır. */
export const listPrintProviders = (blueprintId) =>
  request(`/catalog/blueprints/${blueprintId}/print_providers.json`);

/** Varyant listesi ve baz maliyetler (fiyatlandırma hesabının girdisi). */
export const listVariants = (blueprintId, printProviderId) =>
  request(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`);

export const listProducts = (shopId = config.printify.shopId) =>
  request(`/shops/${shopId}/products.json`);

/**
 * Ürün oluşturur. `payload` Printify'ın beklediği şekildedir:
 * { title, description, blueprint_id, print_provider_id, variants: [...], print_areas: [...] }
 */
export const createProduct = (payload, shopId = config.printify.shopId) =>
  request(`/shops/${shopId}/products.json`, { method: 'POST', body: payload });

/**
 * Tasarım dosyasını Printify'ın medya kütüphanesine yükler.
 * Dönen `id`, ürün oluştururken baskı alanına yerleştirilecek görseli işaret eder.
 */
export const uploadImage = (fileName, base64Contents) =>
  request('/uploads/images.json', { method: 'POST', body: { file_name: fileName, contents: base64Contents } });

/**
 * Ürün fikrinden Printify taslağı üretir.
 * Ürün taslak olarak oluşur; yayına almadan önce Printify'da önizleyebilirsin.
 */
export function buildProductPayload({ title, description, blueprintId, printProviderId, variants, imageId, position = 'front' }) {
  const variantIds = variants.map((v) => v.id);
  return {
    title,
    description,
    blueprint_id: Number(blueprintId),
    print_provider_id: Number(printProviderId),
    variants: variants.map((v) => ({
      id: v.id,
      // Printify fiyatları sent cinsinden bekler.
      price: Math.round(Number(v.price) * 100),
      is_enabled: true,
    })),
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position,
            images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
          },
        ],
      },
    ],
  };
}

/** Bağlantı durumu — panelin Ayarlar sekmesi bunu gösterir. */
export async function connectionStatus() {
  if (!hasPrintify()) return { connected: false, reason: 'Token yok' };
  try {
    const shops = await listShops();
    return { connected: true, shops, configuredShopId: config.printify.shopId || null };
  } catch (error) {
    return { connected: false, reason: error.message };
  }
}
