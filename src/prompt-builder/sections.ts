/** Numbered sections of the prompt, in document order. Reordering here renumbers headings and cross-references. */
import { contextSection } from "./sections/context";
import { discoverySection } from "./sections/discovery";
import { endpointSection } from "./sections/endpoint";
import { examplesSection } from "./sections/examples";
import { exclusionsSection } from "./sections/exclusions";
import { outputFormatSection } from "./sections/output-format";
import { requestSection } from "./sections/request";
import { researchSection } from "./sections/research";
import { rubricSection } from "./sections/rubric";
import type { PromptSection } from "./types";

export const SECTIONS: readonly PromptSection[] = [
  requestSection,
  contextSection,
  discoverySection,
  researchSection,
  rubricSection,
  outputFormatSection,
  endpointSection,
  exclusionsSection,
  examplesSection,
];
