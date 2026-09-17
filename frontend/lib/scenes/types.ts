export type SceneItem = {
  id: string;
  label: { es: string; en: string; fr: string; de: string; hi: string };
  // Exactly one of these is set per item. Concrete-object categories (Kitchen,
  // Bedroom, ...) use a generated illustration; phrase/sentence items have no
  // natural "object" to draw, so they use an emoji instead.
  imageUrl?: string;
  emoji?: string;
};

export type SceneCategory = {
  categoryId: string;
  categoryName: { es: string; en: string; fr: string; de: string; hi: string };
  objects: SceneItem[];
};
