// Stable supplied content for tests, independent of edits made through the live dashboard.
import { copy, contactLinks, projects } from '../../content.js';
import { defaultCaseStudies, defaultExperience } from '../../case-content.js';
export function portfolioFixture() {
  return {
    version: 3,
    profile: { greeting: copy.greeting, bio: copy.bioSegments.map(segment => segment.text !== undefined ? segment.text : copy.companyNames[segment.link]).join(''), contactPrompt: copy.contactPrompt },
    projects: projects.map((image, index) => ({ id: String(index + 1), image, title: '', href: '', visible: true })),
    caseStudies: structuredClone(defaultCaseStudies),
    experience: structuredClone(defaultExperience),
    contactLinks: contactLinks.map(({ key, href }) => ({ id: key, label: copy.links[key], href }))
  };
}
