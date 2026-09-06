import { StyleOption, GalleryItem } from '../types';

export const STYLES: StyleOption[] = [
  {
    id: 1,
    prompt: "Flat Vector Art illustration. Adobe Illustrator style, clean bold lines, solid colors, cel-shaded, digital art, sharp edges, minimalist shading, vibrant commercial art style",
    previewColor: "bg-blue-500"
  },
  {
    id: 2,
    prompt: "Hand-drawn Marker Illustration. Alcohol marker texture, rough ink outlines, loose artistic strokes, sketchbook aesthetic, bleeding ink effects, organic and expressive",
    previewColor: "bg-orange-500"
  },
  {
    id: 4,
    prompt: "Risograph Print. Visible halftone dot patterns, misaligned color layers (CMYK offset), grain texture, limited retro color palette, rough paper texture",
    previewColor: "bg-pink-500"
  },
  {
    id: 5,
    prompt: "3D Character Render. Disney/Pixar style, soft ambient occlusion, matte plastic toy texture, smooth surfaces, cute proportions, rim lighting, 3d modeling",
    previewColor: "bg-red-500"
  },
  {
    id: 8,
    prompt: "American Comic Book Art. Bold black ink contours, Ben-Day dots shading, dramatic high-contrast lighting, dynamic superhero art style, vibrant primary colors",
    previewColor: "bg-indigo-600"
  },
  {
    id: 10,
    prompt: "1930s Rubber Hose Animation. Vintage retro cartoon, monochrome black and white, simple rounded shapes, pie-cut eyes, bouncy curved limbs, old film grain",
    previewColor: "bg-gray-800"
  },
  {
    id: 11,
    prompt: "Noir Graphic Novel. High contrast black and white ink, dramatic Chiaroscuro lighting, heavy shadows, mysterious atmosphere, Frank Miller style art",
    previewColor: "bg-neutral-900"
  },
  {
    id: 13,
    prompt: "Cinematic Seinen Graphic Novel illustration. Realistic human anatomy and facial proportions, intricate black ink pen linework with delicate cross-hatching and contour shading, moody chiaroscuro lighting with dramatic deep shadows, warm amber lamp rim-lighting, painterly realistic skin tones with subtle sweat sheen and flushed undertones, mature emotional narrative comic art, clean die-cut white sticker border, transparent background, crisp vector cutout sticker",
    previewColor: "bg-amber-900"
  },
  {
    id: 14,
    prompt: "Modern Korean manhwa webtoon style, semi-realistic digital comic art, delicate sharp ink linework with clean tapering, handsome realistic facial features and expressive eyes, defined anatomy structure, warm skin rendering with subtle flushed blush, atmospheric cinematic rim light, stylized atmospheric smoke vapor with clean outlines if contextually fitting, professional die-cut sticker with thick solid white border outline, isolated on pure solid white background",
    previewColor: "bg-rose-950"
  },
  {
    id: 15,
    prompt: "Harmonious blend of Modern Korean Manhwa (#14, 55%), Sharp Flat Vector Art (#01, 30%), and Seinen Fine Hatching (#13, 10%), with 3% subtle 3D character ambient occlusion volume (#05) and 2% vintage cartoon ink bounce (#10). Refined manhwa facial proportions and expressive eyes, bold clean vector contour lines, crisp cel-shaded color blocks balanced with delicate localized ink hatching, smooth 2.5D skin depth with subtle warm blush, clean die-cut sticker with thick white border outline, isolated on pure solid white background",
    previewColor: "bg-teal-700"
  },
  {
    id: 16,
    prompt: "Sophisticated fusion of Cinematic Seinen Graphic Novel (#13, 50%), 1930s Vintage Retro Ink Aesthetic (#10, 30%), and Korean Manhwa facial refinement (#14, 15%), enriched with 3% soft 3D dimensional lighting (#05) and 2% crisp vector precision. Realistic anatomical structure with moody chiaroscuro deep shadow contrasts, fine cross-hatching combined with rich vintage black ink washes, subtle warm monochromatic tone with delicate flushed highlight accents, collectible die-cut sticker with thick white border, isolated on pure solid white background",
    previewColor: "bg-stone-800"
  },
  {
    id: 17,
    prompt: "Cutting-edge fusion of High-contrast Cel-Shaded Vector (#01, 45%), Korean Webtoon Manhwa Glamour (#14, 35%), and Dynamic Rubber Hose fluid curved line rhythm (#10, 15%), with 5% premium 3D designer vinyl toy ambient occlusion depth (#05). Sharp tapered black ink contours, vivid color saturation with pristine flat and soft-gradient transitions, handsome webtoon facial details with cinematic rim lighting, polished collectible vinyl sticker look, die-cut sticker with thick white border outline, isolated on pure solid white background",
    previewColor: "bg-cyan-800"
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: '1', imageUrl: 'images/illus01.png', styleId: 1, author: 'Vector_Pro' },
  { id: '2', imageUrl: 'images/illus01.png', styleId: 2, author: 'Marker_Art' },
  { id: '4', imageUrl: 'images/illus04.png', styleId: 4, author: 'Riso_Fan' },
  { id: '5', imageUrl: 'images/illus05.png', styleId: 5, author: 'Toon_King' },
  { id: '8', imageUrl: 'images/illus06.png', styleId: 8, author: 'Comic_Noir' },
  { id: '10', imageUrl: 'images/illus010.png.png', styleId: 10, author: 'Retro_Toon' },
  { id: '11', imageUrl: 'images/illus06.png', styleId: 11, author: 'Noir_Fan' },
  { id: '13', imageUrl: 'images/illus011.png', styleId: 13, author: 'Seinen_Noir' },
  { id: '14', imageUrl: 'images/illus012.png', styleId: 14, author: 'Manhwa_Webtoon' },
  { id: '15', imageUrl: 'images/illus00.png', styleId: 15, author: 'Pop_Manhwa' },
  { id: '16', imageUrl: 'images/illus06.png', styleId: 16, author: 'Vintage_Noir' },
  { id: '17', imageUrl: 'images/illus02.png', styleId: 17, author: 'NeoCel_Artist' },
];
