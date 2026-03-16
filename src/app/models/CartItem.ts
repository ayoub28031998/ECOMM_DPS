export interface CartItem {
  variant: any;
  subtotal: number;
  id: number;
  libelle :string;
  quantity: number;
  prix_ttc: number;
  prix_ht: number;
  prix_final: number;
  prix:number;
  promo: number;

  lignes_pack: Array<{id_pack : number ; id_article: number}>;

}
