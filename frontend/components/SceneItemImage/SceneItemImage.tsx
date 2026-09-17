import Image from "next/image";
import type { SceneItem } from "@/lib/scenes/types";

// Concrete-object items (Kitchen, Bedroom, ...) have a generated
// illustration; phrase/sentence items (Everyday Phrases) have no natural
// "object" to draw, so they carry an emoji instead — this picks whichever
// the item actually has, everywhere Exercise 1 shows an item's picture.
export function SceneItemImage({
  item,
  size,
  sizes,
  emojiTextClass = "text-4xl",
}: {
  item: SceneItem;
  size: number;
  sizes: string;
  emojiTextClass?: string;
}) {
  if (item.emoji) {
    return (
      <div
        className={`flex items-center justify-center ${emojiTextClass}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {item.emoji}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image src={item.imageUrl!} alt={item.label.en} fill sizes={sizes} className="object-contain" />
    </div>
  );
}
