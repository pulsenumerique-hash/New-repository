import { Product, PackagingType } from '../types';

export interface StockBreakdown {
  isPack: boolean;
  itemsPerPack: number;
  totalArticles: number;
  fullPacks: number;
  looseArticles: number;
  hasLooseArticles: boolean;
  stockText: string; // e.g. "8 paquets + 4 articles", "5 paquets (60 articles)", "35 articles"
  totalText: string; // e.g. "Total : 100 articles" or "35 articles"
  badgeText: string; // e.g. "Paquet de 12" or "Article"
  formattedShort: string; // e.g. "8 pqts + 4 art." or "35 art."
}

/**
 * Détermine si un produit est conditionné en « Paquet »
 * Assure une rétrocompatibilité absolue avec les produits créés antérieurement.
 */
export function isPackProduct(product: Partial<Product> | null | undefined): boolean {
  if (!product) return false;
  if (product.packaging_type === 'pack') return true;
  if (product.packaging_type === 'article') return false;
  // Fallback rétrocompatible pour les produits existants sans packaging_type
  return (product.items_per_pack && product.items_per_pack > 1) ||
    ((product.units_per_package ?? 1) > 1);
}

/**
 * Renvoie le nombre d'articles contenus dans un paquet (au moins 2 pour un paquet, 1 pour un article)
 */
export function getItemsPerPack(product: Partial<Product> | null | undefined): number {
  if (!product) return 1;
  if (!isPackProduct(product)) return 1;
  const count = product.items_per_pack || product.units_per_package || 2;
  return Math.max(2, Math.floor(count));
}

/**
 * Décompose le stock d'un produit en paquets complets et articles restants.
 * Gère avec exactitude les paquets ouverts et conversions.
 */
export function getProductStockBreakdown(product: Partial<Product> | null | undefined): StockBreakdown {
  if (!product) {
    return {
      isPack: false,
      itemsPerPack: 1,
      totalArticles: 0,
      fullPacks: 0,
      looseArticles: 0,
      hasLooseArticles: false,
      stockText: '0 article',
      totalText: '0 article',
      badgeText: 'Article',
      formattedShort: '0 art.',
    };
  }

  const isPack = isPackProduct(product);
  const totalArticles = Math.max(0, Number(product.unit_stock) || 0);

  if (!isPack) {
    const plural = totalArticles > 1 ? 'articles' : 'article';
    return {
      isPack: false,
      itemsPerPack: 1,
      totalArticles,
      fullPacks: 0,
      looseArticles: totalArticles,
      hasLooseArticles: false,
      stockText: `${totalArticles} ${plural}`,
      totalText: `${totalArticles} ${plural}`,
      badgeText: 'Article',
      formattedShort: `${totalArticles} art.`,
    };
  }

  const itemsPerPack = getItemsPerPack(product);
  const fullPacks = Math.floor(totalArticles / itemsPerPack);
  const looseArticles = totalArticles % itemsPerPack;
  const hasLooseArticles = looseArticles > 0;

  const packWord = (count: number) => (count > 1 ? 'paquets' : 'paquet');
  const articleWord = (count: number) => (count > 1 ? 'articles' : 'article');

  let stockText = '';
  let formattedShort = '';
  if (totalArticles === 0) {
    stockText = `0 paquet (0 article)`;
    formattedShort = `0 pqt`;
  } else if (!hasLooseArticles) {
    stockText = `${fullPacks} ${packWord(fullPacks)} (${totalArticles} ${articleWord(totalArticles)})`;
    formattedShort = `${fullPacks} pqt${fullPacks > 1 ? 's' : ''}`;
  } else if (fullPacks === 0) {
    stockText = `${looseArticles} ${articleWord(looseArticles)} (${totalArticles} au total)`;
    formattedShort = `${looseArticles} art.`;
  } else {
    stockText = `${fullPacks} ${packWord(fullPacks)} + ${looseArticles} ${articleWord(looseArticles)}`;
    formattedShort = `${fullPacks} pqt${fullPacks > 1 ? 's' : ''} + ${looseArticles} art.`;
  }

  return {
    isPack: true,
    itemsPerPack,
    totalArticles,
    fullPacks,
    looseArticles,
    hasLooseArticles,
    stockText,
    totalText: `Total : ${totalArticles} ${articleWord(totalArticles)}`,
    badgeText: `Paquet de ${itemsPerPack}`,
    formattedShort,
  };
}

/**
 * Calcule le nombre total d'articles à partir d'un nombre de paquets et d'articles en vrac.
 */
export function calculateTotalArticlesFromPacks(
  packs: number,
  itemsPerPack: number,
  extraUnits: number = 0
): number {
  const p = Math.max(0, Number(packs) || 0);
  const i = Math.max(1, Number(itemsPerPack) || 1);
  const e = Math.max(0, Number(extraUnits) || 0);
  return p * i + e;
}

/**
 * Calcule le prix de vente d'un paquet complet
 */
export function getPackSalePrice(product: Partial<Product>): number {
  if (product.pack_sale_price && product.pack_sale_price > 0) {
    return product.pack_sale_price;
  }
  const itemsPerPack = getItemsPerPack(product);
  const unitPrice = product.unit_sale_price || 0;
  return unitPrice * itemsPerPack;
}
