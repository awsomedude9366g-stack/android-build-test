// Client-side humanization: phrase replacement + contractions

export interface Replacement {
  original: string;
  replacement: string;
}

const AI_PHRASE_MAP: [string, string][] = [
  ['furthermore', 'also'],
  ['moreover', 'plus'],
  ['consequently', 'so'],
  ['nevertheless', 'still'],
  ['nonetheless', 'even so'],
  ['additionally', 'also'],
  ['subsequently', 'then'],
  ['conversely', 'on the flip side'],
  ['in conclusion', 'to wrap up'],
  ['in summary', 'in short'],
  ['to summarize', 'basically'],
  ['all in all', 'overall'],
  ['first and foremost', 'first'],
  ['last but not least', 'finally'],
  ['to put it simply', 'simply put'],
  ['in other words', 'basically'],
  ['it is worth noting', 'worth mentioning'],
  ['it is important to note', 'note that'],
  ['it should be noted', 'keep in mind'],
  ['it is evident', 'clearly'],
  ['it is clear', 'clearly'],
  ['it is undeniable', 'clearly'],
  ['without a doubt', 'definitely'],
  ['needless to say', 'obviously'],
  ['it can be argued', 'some say'],
  ['it is crucial', "it's important"],
  ['it is vital', "it's important"],
  ['it goes without saying', 'of course'],
  ['one must consider', 'consider'],
  ['with that being said', 'that said'],
  ['that being said', 'still'],
  ['having said that', 'that said'],
  ['utilize', 'use'],
  ['utilization', 'use'],
  ['leverage', 'use'],
  ['facilitate', 'help'],
  ['implementation', 'setup'],
  ['paradigm shift', 'big change'],
  ['holistic approach', 'overall approach'],
  ['synergy', 'teamwork'],
  ['robust', 'strong'],
  ['scalable', 'flexible'],
  ['cutting-edge', 'modern'],
  ['state-of-the-art', 'latest'],
  ['best practices', 'good methods'],
  ['multifaceted', 'complex'],
  ['groundbreaking', 'new'],
  ['transformative', 'impactful'],
  ['innovative', 'creative'],
  ['seamless', 'smooth'],
  ['streamline', 'simplify'],
  ['optimize', 'improve'],
  ['empower', 'help'],
  ['actionable', 'practical'],
  ['disruptive', 'game-changing'],
  ['ecosystem', 'environment'],
  ['as a result', 'so'],
  ['due to the fact', 'because'],
  ['in order to', 'to'],
  ['by leveraging', 'using'],
  ['on the other hand', 'but'],
  ['in the realm of', 'in'],
  ["in today's world", 'today'],
  ['in the modern era', 'these days'],
  ['rapidly evolving', 'fast-changing'],
  ['ever-changing landscape', 'changing world'],
  ['plays a crucial role', 'is key'],
  ['plays a vital role', 'really matters'],
  ['plays an important role', 'matters'],
  ['is essential', 'is needed'],
  ['is paramount', 'is top priority'],
  ['has been shown', 'shows'],
  ['research has shown', 'research shows'],
  ['a wide range of', 'many'],
  ['a variety of', 'many'],
  ['a number of', 'several'],
  ['delve into', 'look at'],
  ['dive into', 'explore'],
  ['at its core', 'essentially'],
  ['this ensures', 'this means'],
  ['this allows', 'this lets'],
  ['this enables', 'this lets'],
  ['significant', 'notable'],
  ['significantly', 'notably'],
  ['substantially', 'a lot'],
];

const CONTRACTIONS: [string, string][] = [
  ['It is', "It's"],
  ['They are', "They're"],
  ['We are', "We're"],
  ['You are', "You're"],
  ['I am', "I'm"],
  ['He is', "He's"],
  ['She is', "She's"],
  ['That is', "That's"],
  ['There is', "There's"],
  ['Here is', "Here's"],
  ['What is', "What's"],
  ['cannot', "can't"],
  ['do not', "don't"],
  ['does not', "doesn't"],
  ['did not', "didn't"],
  ['will not', "won't"],
  ['would not', "wouldn't"],
  ['should not', "shouldn't"],
  ['could not', "couldn't"],
  ['is not', "isn't"],
  ['are not', "aren't"],
  ['was not', "wasn't"],
  ['were not', "weren't"],
  ['have not', "haven't"],
  ['has not', "hasn't"],
  ['had not', "hadn't"],
  ['I would', "I'd"],
  ['I will', "I'll"],
  ['I have', "I've"],
  ['They will', "They'll"],
  ['We will', "We'll"],
];

export interface HumanizeLocalResult {
  output: string;
  replacements: Replacement[];
  totalReplacements: number;
}

export function humanizeLocally(text: string): HumanizeLocalResult {
  const replacements: Replacement[] = [];
  let output = text;

  // Sort phrases by length descending so longer phrases match first
  const sortedPhrases = [...AI_PHRASE_MAP].sort((a, b) => b[0].length - a[0].length);

  for (const [phrase, replacement] of sortedPhrases) {
    const regex = new RegExp(escapeRegex(phrase), 'gi');
    const matches = output.match(regex);
    if (matches) {
      for (const match of matches) {
        replacements.push({ original: match, replacement: matchCase(match, replacement) });
      }
      output = output.replace(regex, (m) => matchCase(m, replacement));
    }
  }

  // Apply contractions (sort by length descending too)
  const sortedContractions = [...CONTRACTIONS].sort((a, b) => b[0].length - a[0].length);

  for (const [full, contracted] of sortedContractions) {
    const regex = new RegExp(escapeRegex(full), 'g');
    const matches = output.match(regex);
    if (matches) {
      for (const match of matches) {
        replacements.push({ original: match, replacement: contracted });
      }
      output = output.replace(regex, contracted);
    }
    // Also try case-insensitive for contractions that start sentences
    const regexI = new RegExp(escapeRegex(full), 'gi');
    const matchesI = output.match(regexI);
    if (matchesI) {
      for (const match of matchesI) {
        replacements.push({ original: match, replacement: matchCase(match, contracted) });
      }
      output = output.replace(regexI, (m) => matchCase(m, contracted));
    }
  }

  return { output, replacements, totalReplacements: replacements.length };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchCase(source: string, target: string): string {
  if (source === source.toUpperCase() && source.length > 1) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return target.charAt(0).toUpperCase() + target.slice(1);
  return target;
}
