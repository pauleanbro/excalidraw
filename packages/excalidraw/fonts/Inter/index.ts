import { GOOGLE_FONTS_RANGES } from "@excalidraw/common";

import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

export const InterFontFaces: ExcalidrawFontFaceDescriptor[] = [
  {
    uri: "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-ext-400-normal.woff2",
    descriptors: { unicodeRange: GOOGLE_FONTS_RANGES.LATIN_EXT },
  },
  {
    uri: "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff2",
    descriptors: { unicodeRange: GOOGLE_FONTS_RANGES.LATIN },
  },
];
