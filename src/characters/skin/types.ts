export interface PortraitImage {
  src: string;
  width?: number;
  height?: number;
}

export interface CharacterSkinEntry {
  id: string;
  label: string;
  image: PortraitImage;
  classic?: boolean;
}
