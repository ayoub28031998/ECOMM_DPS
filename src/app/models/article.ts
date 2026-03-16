export interface Article{

  libelle: string,
  prix_ht: number,
  prix_ttc: number,
  reference: string,
  stock: number,
  "stock_reserve": number,
  "stock_arrivage": number,
  "stock_arrivage_reserve": number,
  "availableStock": number,
  "is_website_allowed": boolean,
  "id_categorie": number,
  "id_sous_categorie": number,
  "id_sous_sous_categorie": number,
  "id": number,
  "ligne_packs": any[],
  "pt_ventes": any[],
  "commandes": any[],
  "ligne_promotions": any[],
  "images": any[],
  "ligne_options": any[]
}
