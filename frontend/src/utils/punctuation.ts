// Punctuation restoration utility for speech-to-text

interface PunctuationRule {
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  context?: 'sentence_start' | 'sentence_end' | 'question' | 'exclamation';
}

// Common speech patterns that indicate punctuation
const PUNCTUATION_RULES: PunctuationRule[] = [
  // Questions
  { pattern: /\b(what|when|where|who|why|how|which|whose|whom)\b.*$/i, replacement: '?', context: 'question' },
  { pattern: /\b(is|are|was|were|do|does|did|can|could|will|would|should|may|might)\s+\w+.*$/i, replacement: '?', context: 'question' },
  { pattern: /\b(okay|ok|right)\s*\?$/i, replacement: '?', context: 'question' },
  
  // Exclamations
  { pattern: /\b(wow|oh|ah|ooh|wow|amazing|incredible|fantastic|great|excellent|perfect|wonderful|terrible|awful|horrible)\b.*$/i, replacement: '!', context: 'exclamation' },
  { pattern: /\b(stop|wait|no|yes|please|thank you|thanks)\b.*$/i, replacement: '!', context: 'exclamation' },
  
  // Sentence endings
  { pattern: /\b(period|full stop|end|finish|done|complete|that's it|that is all)\b.*$/i, replacement: '.', context: 'sentence_end' },
  { pattern: /\b(comma|pause|wait)\b.*$/i, replacement: ',', context: 'sentence_end' },
  
  // Natural pauses and breaks
  { pattern: /\b(um|uh|er|ah|hmm|well|so|now|then|actually|basically|literally|you know|i mean|like)\b/gi, replacement: ', ' },
];

// Enhanced punctuation rules for different languages
const LANGUAGE_SPECIFIC_RULES: Record<string, PunctuationRule[]> = {
  'en': [
    { pattern: /\b(hello|hi|hey|good morning|good afternoon|good evening|goodbye|bye|see you)\b.*$/i, replacement: '!', context: 'exclamation' },
    { pattern: /\b(please|thank you|thanks|excuse me|sorry|pardon)\b.*$/i, replacement: '.', context: 'sentence_end' },
  ],
  'es': [
    { pattern: /\b(hola|buenos días|buenas tardes|buenas noches|adiós|hasta luego|por favor|gracias|perdón)\b.*$/i, replacement: '!', context: 'exclamation' },
    { pattern: /\b(¿qué|¿cuándo|¿dónde|¿quién|¿por qué|¿cómo|¿cuál)\b.*$/i, replacement: '?', context: 'question' },
  ],
  'fr': [
    { pattern: /\b(bonjour|bonsoir|au revoir|s'il vous plaît|merci|pardon|excusez-moi)\b.*$/i, replacement: '!', context: 'exclamation' },
    { pattern: /\b(qu'est-ce que|quand|où|qui|pourquoi|comment|quel)\b.*$/i, replacement: '?', context: 'question' },
  ],
  'de': [
    { pattern: /\b(hallo|guten tag|guten abend|auf wiedersehen|bitte|danke|entschuldigung)\b.*$/i, replacement: '!', context: 'exclamation' },
    { pattern: /\b(was|wann|wo|wer|warum|wie|welcher)\b.*$/i, replacement: '?', context: 'question' },
  ],
  'zh': [
    { pattern: /\b(你好|早上好|下午好|晚上好|再见|谢谢|请|对不起)\b.*$/i, replacement: '！', context: 'exclamation' },
    { pattern: /\b(什么|什么时候|哪里|谁|为什么|怎么|哪个)\b.*$/i, replacement: '？', context: 'question' },
  ],
  'ja': [
    { pattern: /\b(こんにちは|おはよう|こんばんは|さようなら|ありがとう|お願い|すみません)\b.*$/i, replacement: '！', context: 'exclamation' },
    { pattern: /\b(何|いつ|どこ|誰|なぜ|どう|どちら)\b.*$/i, replacement: '？', context: 'question' },
  ],
};

// Main punctuation restoration function
export function addPunctuation(text: string, language: string = 'en'): string {
  if (!text || text.trim().length === 0) return text;
  
  let processedText = text.trim();
  
  // Get language-specific rules
  const langRules = LANGUAGE_SPECIFIC_RULES[language] || LANGUAGE_SPECIFIC_RULES['en'];
  const allRules = [...PUNCTUATION_RULES, ...langRules];
  
  // Apply punctuation rules
  for (const rule of allRules) {
    if (rule.pattern.test(processedText)) {
      if (typeof rule.replacement === 'function') {
        processedText = processedText.replace(rule.pattern, rule.replacement);
      } else {
        // Add punctuation at the end if not already present
        if (!/[.!?。！？]$/.test(processedText)) {
          processedText = processedText.replace(rule.pattern, rule.replacement);
        }
      }
    }
  }
  
  // Ensure proper sentence capitalization (handle this separately)
  processedText = processedText.replace(/^[a-z]/, (match) => match.toUpperCase());
  
  // Add period at the end if no punctuation exists
  if (!/[.!?。！？]$/.test(processedText)) {
    processedText += '.';
  }
  
  // Clean up multiple spaces and punctuation
  processedText = processedText
    .replace(/\s+/g, ' ')
    .replace(/[.!?。！？]+$/, (match) => match[0])
    .replace(/,\s*,/g, ',')
    .trim();
  
  return processedText;
}

// Function to detect sentence boundaries and add appropriate punctuation
export function addSentencePunctuation(text: string, language: string = 'en'): string {
  if (!text || text.trim().length === 0) return text;
  
  let processedText = text.trim();
  
  // Split into potential sentences based on pauses and natural breaks
  const sentences = processedText.split(/\s+(?=[A-Z]|$)/);
  
  const punctuatedSentences = sentences.map((sentence, index) => {
    if (!sentence.trim()) return sentence;
    
    // Add punctuation to each sentence
    let punctuated = addPunctuation(sentence.trim(), language);
    
    // Ensure proper spacing between sentences
    if (index < sentences.length - 1 && punctuated) {
      punctuated += ' ';
    }
    
    return punctuated;
  });
  
  return punctuatedSentences.join('').trim();
}

// Function to clean up common speech artifacts
export function cleanSpeechText(text: string): string {
  if (!text || text.trim().length === 0) return text;
  
  return text
    // Remove common speech artifacts
    .replace(/\b(um|uh|er|ah|hmm)\b/gi, '')
    // Remove repeated words
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim();
}

// Main function that combines all punctuation processing
export function processSpeechText(text: string, language: string = 'en'): string {
  if (!text || text.trim().length === 0) return text;
  
  // Step 1: Clean up speech artifacts
  let processed = cleanSpeechText(text);
  
  // Step 2: Add sentence punctuation
  processed = addSentencePunctuation(processed, language);
  
  // Step 3: Final punctuation restoration
  processed = addPunctuation(processed, language);
  
  return processed;
} 