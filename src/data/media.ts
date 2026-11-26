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
  hotspots?: { label: string; target: string; yaw: number; pitch: number }[];
};
export type Tour = {
  title: string;
  poster?: Picture;
  embed?: boolean;
} & (
  { kind: 'iframe' | 'video' | 'video360' | 'model'; src: string }
  | { kind: 'panorama'; scenes: Scene[] }
);
type PropertyMedia = { area?: string; bedrooms?: number; bathrooms?: number; floorPlan?: Picture; renders?: Picture[]; availability?: string };
type Progress = { date: string; title: string; summary: string; photos?: Picture[]; video?: Tour; approved: boolean };

export const media = settings as {
  cover: Picture | null;
  gallery: Picture[];
  tour: Tour | null;
  model: Tour | null;
  typologies: Record<string, PropertyMedia>;
  progress: Progress[];
};
