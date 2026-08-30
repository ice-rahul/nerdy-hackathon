export type SceneItem = {
  id: string;
  label: { es: string; en: string; fr: string; de: string };
  imageUrl: string;
};

export type SceneCategory = {
  categoryId: string;
  categoryName: string;
  objects: SceneItem[];
};
