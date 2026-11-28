import settings from '../../content/media.json';

export type Picture = {
  src: string;
  srcset?: string;
  full?: string;
  alt: string;
  width: number;
  height: number;
};
export type Scene = {
  id: string;
  title: string;
  group: string;
  src: string;
  yaw?: number;
  pitch?: number;
  hotspots?: { label: string; target: string; yaw: number; pitch: number }[];
};
export type Tour = {
  title: string;
  poster?: Picture;
  embed?: boolean;
  reference?: boolean;
} & (
  { kind: 'iframe' | 'video' | 'video360' | 'model'; src: string }
  | { kind: 'panorama'; scenes: Scene[] }
);
type PropertyMedia = {
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  cardImage?: Picture;
  floorPlan?: Picture;
  renders?: Picture[];
  tourHref?: string;
  availability?: string;
};
type Progress = { date: string; title: string; summary: string; photos?: Picture[]; video?: Tour; approved: boolean };

export const media = settings as {
  cover: Picture | null;
  gallery: Picture[];
  tour: Tour | null;
  exteriorTour?: Tour | null;
  model: Tour | null;
  typologies: Record<string, PropertyMedia>;
  spaces?: Record<string, Picture[]>;
  progress: Progress[];
};
