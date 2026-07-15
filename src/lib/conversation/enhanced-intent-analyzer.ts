/**
 * Enhanced Intent Analyzer
 * Provides sophisticated natural language understanding for Bible search conversations
 */

import { UserIntent, IntentType, EmotionalState, ConversationContext } from './conversation-context-manager';

export interface TopicClassification {
  primaryTopic: string;
  secondaryTopics: string[];
  confidence: number;
  biblicalThemes: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface FollowUpType {
  isFollowUp: boolean;
  followUpType: 'clarification' | 'deepening' | 'application' | 'related_topic';
  confidence: number;
}

export class EnhancedIntentAnalyzer {
  private emotionalKeywords: Map<string, { emotion: string; intensity: number; needs: string[] }> = new Map();
  private intentPatterns: Map<IntentType, RegExp[]> = new Map();
  private biblicalTopics: Map<string, string[]> = new Map();

  constructor() {
    this.initializeEmotionalKeywords();
    this.initializeIntentPatterns();
    this.initializeBiblicalTopics();
  }

  /**
   * Analyze user intent with context awareness
   */
  async analyzeIntent(input: string, context?: ConversationContext): Promise<UserIntent> {
    const normalizedInput = input.toLowerCase().trim();
    
    // Detect emotional state
    const emotionalState = this.detectEmotionalState(input);
    
    // Classify topics
    const topicClassification = this.classifyTopics(input);
    
    // Determine primary intent
    const primaryIntent = this.determinePrimaryIntent(input, emotionalState);
    
    // Find secondary intents
    const secondaryIntents = this.findSecondaryIntents(input, primaryIntent);
    
    // Check for follow-up patterns
    const followUpType = context ? this.identifyFollowUpType(input, context) : { isFollowUp: false, followUpType: 'clarification' as const, confidence: 0 };
    
    // Assess complexity
    const complexity = this.assessComplexity(input, topicClassification);
    
    // Check if clarification is needed
    const requiresClarification = this.needsClarification(input, topicClassification, emotionalState);
    
    // Check for historical references
    const referencesHistory = context ? this.checkHistoricalReferences(input) : false;
    
    // Check for practical application needs
    const practicalApplication = this.needsPracticalApplication(input);
    
    // Calculate overall confidence
    const confidence = this.calculateIntentConfidence(
      primaryIntent, 
      topicClassification, 
      emotionalState, 
      followUpType
    );

    return {
      primaryIntent,
      secondaryIntents,
      emotionalContext: emotionalState,
      topics: [topicClassification.primaryTopic, ...topicClassification.secondaryTopics],
      complexity,
      requiresClarification,
      referencesHistory,
      practicalApplication,
      confidence
    };
  }

  /**
   * Detect emotional state from user input
   */
  detectEmotionalState(input: string): EmotionalState {
    const normalizedInput = input.toLowerCase();
    let primaryEmotion = 'neutral';
    let maxIntensity = 0;
    let needsComfort = false;
    let needsEncouragement = false;
    let needsGuidance = false;

    // Check for emotional keywords
    for (const [keyword, data] of this.emotionalKeywords.entries()) {
      if (normalizedInput.includes(keyword)) {
        if (data.intensity > maxIntensity) {
          primaryEmotion = data.emotion;
          maxIntensity = data.intensity;
        }
        
        // Update needs based on detected emotions
        if (data.needs.includes('comfort')) needsComfort = true;
        if (data.needs.includes('encouragement')) needsEncouragement = true;
        if (data.needs.includes('guidance')) needsGuidance = true;
      }
    }

    // Detect intensity modifiers
    const intensityModifiers = [
      { words: ['very', 'extremely', 'really', 'so', 'deeply'], multiplier: 1.5 },
      { words: ['somewhat', 'a bit', 'slightly', 'kind of'], multiplier: 0.7 },
      { words: ['completely', 'totally', 'absolutely'], multiplier: 1.8 }
    ];

    for (const modifier of intensityModifiers) {
      if (modifier.words.some(word => normalizedInput.includes(word))) {
        maxIntensity = Math.min(1, maxIntensity * modifier.multiplier);
        break;
      }
    }

    return {
      primary: primaryEmotion,
      intensity: maxIntensity,
      needsComfort,
      needsEncouragement,
      needsGuidance,
      timestamp: new Date()
    };
  }

  /**
   * Classify topics in the user input
   */
  classifyTopics(input: string): TopicClassification {
    const normalizedInput = input.toLowerCase();
    const foundTopics: { topic: string; confidence: number }[] = [];
    const biblicalThemes: string[] = [];

    // Check for biblical topics
    for (const [topic, keywords] of this.biblicalTopics.entries()) {
      let topicScore = 0;
      let matchCount = 0;

      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          topicScore += 1;
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(1, topicScore / keywords.length);
        foundTopics.push({ topic, confidence });
        
        // Add biblical themes
        const themes = this.getBiblicalThemes(topic);
        biblicalThemes.push(...themes);
      }
    }

    // Sort by confidence
    foundTopics.sort((a, b) => b.confidence - a.confidence);

    // Determine complexity based on topic count and depth
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (foundTopics.length > 3 || biblicalThemes.length > 5) {
      complexity = 'complex';
    } else if (foundTopics.length > 1 || biblicalThemes.length > 2) {
      complexity = 'moderate';
    }

    return {
      primaryTopic: foundTopics[0]?.topic || 'general',
      secondaryTopics: foundTopics.slice(1, 4).map(t => t.topic),
      confidence: foundTopics[0]?.confidence || 0.3,
      biblicalThemes: [...new Set(biblicalThemes)], // Remove duplicates
      complexity
    };
  }

  /**
   * Determine primary intent from input and emotional context
   */
  private determinePrimaryIntent(input: string, emotionalState: EmotionalState): IntentType {
    const normalizedInput = input.toLowerCase();

    // Check for explicit intent patterns
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          return intent;
        }
      }
    }

    // Infer intent from emotional state
    if (emotionalState.needsComfort) {
      return IntentType.SEEKING_COMFORT;
    }
    if (emotionalState.needsEncouragement) {
      return IntentType.SEEKING_ENCOURAGEMENT;
    }
    if (emotionalState.needsGuidance) {
      return IntentType.ASKING_GUIDANCE;
    }

    // Default based on question patterns
    if (normalizedInput.includes('what') || normalizedInput.includes('how') || normalizedInput.includes('why')) {
      return IntentType.REQUESTING_EXPLANATION;
    }

    return IntentType.EXPLORING_TOPIC;
  }

  /**
   * Find secondary intents in the input
   */
  private findSecondaryIntents(input: string, primaryIntent: IntentType): IntentType[] {
    const normalizedInput = input.toLowerCase();
    const secondaryIntents: IntentType[] = [];

    // Check for multiple intent patterns
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      if (intent === primaryIntent) continue;

      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          secondaryIntents.push(intent);
          break;
        }
      }
    }

    return secondaryIntents.slice(0, 2); // Limit to 2 secondary intents
  }

  /**
   * Identify if input is a follow-up to previous conversation
   */
  identifyFollowUpType(input: string, context: ConversationContext): FollowUpType {
    const normalizedInput = input.toLowerCase();
    
    // Check for follow-up indicators
    const followUpPatterns = {
      clarification: /^(what do you mean|can you explain|i don't understand|clarify)/,
      deepening: /^(tell me more|can you elaborate|what else|more about)/,
      application: /^(how do i|how can i|what should i|how to apply)/,
      related_topic: /^(what about|also|and|related to)/
    };

    for (const [type, pattern] of Object.entries(followUpPatterns)) {
      if (pattern.test(normalizedInput)) {
        return {
          isFollowUp: true,
          followUpType: type as any,
          confidence: 0.8
        };
      }
    }

    // Check for contextual references
    const contextualReferences = [
      'that verse', 'the passage', 'what we discussed', 'earlier', 'before',
      'you mentioned', 'you said', 'from what you told me'
    ];

    const hasContextualReference = contextualReferences.some(ref => 
      normalizedInput.includes(ref)
    );

    if (hasContextualReference) {
      return {
        isFollowUp: true,
        followUpType: 'clarification',
        confidence: 0.7
      };
    }

    return {
      isFollowUp: false,
      followUpType: 'clarification',
      confidence: 0
    };
  }

  private assessComplexity(input: string, topicClassification: TopicClassification): 'simple' | 'moderate' | 'complex' {
    const wordCount = input.split(/\s+/).length;
    if (wordCount > 20 || topicClassification.secondaryTopics.length > 2) return 'complex';
    if (wordCount > 10 || topicClassification.secondaryTopics.length > 0) return 'moderate';
    return 'simple';
  }

  private needsClarification(input: string, topicClassification: TopicClassification, emotionalState: EmotionalState): boolean {
    return input.trim().length < 10 || 
           (topicClassification.secondaryTopics.length > 1 && topicClassification.confidence < 0.6) ||
           (emotionalState.intensity > 0.7 && topicClassification.confidence < 0.5);
  }

  private checkHistoricalReferences(input: string): boolean {
    const referencePatterns = [
      /that verse|the verse|that passage|the passage/,
      /what we discussed|what you mentioned|earlier|before/
    ];
    return referencePatterns.some(pattern => pattern.test(input.toLowerCase()));
  }

  private needsPracticalApplication(input: string): boolean {
    const applicationPatterns = [
      /how do i|how can i|what should i|how to/,
      /apply|practice|implement|live out/,
      /in my life|in practice|practically/
    ];
    return applicationPatterns.some(pattern => pattern.test(input.toLowerCase()));
  }

  private calculateIntentConfidence(primaryIntent: IntentType, topicClassification: TopicClassification, emotionalState: EmotionalState, followUpType: FollowUpType): number {
    let confidence = 0.5;
    confidence += topicClassification.confidence * 0.3;
    if (emotionalState.intensity > 0.5) confidence += 0.2;
    if (followUpType.isFollowUp && followUpType.confidence > 0.7) confidence += 0.2;
    return Math.max(0.1, Math.min(1, confidence));
  }

  private getBiblicalThemes(topic: string): string[] {
    const themeMap: Record<string, string[]> = {
      love: ['agape', 'compassion', 'mercy', 'kindness'],
      faith: ['trust', 'belief', 'confidence', 'assurance'],
      hope: ['expectation', 'future', 'promise', 'eternal life'],
      peace: ['shalom', 'rest', 'calm', 'reconciliation'],
      forgiveness: ['redemption', 'grace', 'mercy', 'pardon']
    };
    return themeMap[topic] || [];
  }

  private initializeEmotionalKeywords(): void {
    this.emotionalKeywords = new Map([
      ['anxious', { emotion: 'anxious', intensity: 0.7, needs: ['comfort', 'guidance'] }],
      ['worried', { emotion: 'anxious', intensity: 0.6, needs: ['comfort', 'guidance'] }],
      ['afraid', { emotion: 'fearful', intensity: 0.8, needs: ['comfort', 'encouragement'] }],
      ['sad', { emotion: 'sad', intensity: 0.6, needs: ['comfort', 'encouragement'] }],
      ['depressed', { emotion: 'depressed', intensity: 0.8, needs: ['comfort', 'encouragement'] }],
      ['angry', { emotion: 'angry', intensity: 0.7, needs: ['guidance', 'comfort'] }],
      ['confused', { emotion: 'confused', intensity: 0.6, needs: ['guidance'] }],
      ['grateful', { emotion: 'grateful', intensity: 0.7, needs: ['encouragement'] }],
      ['hopeful', { emotion: 'hopeful', intensity: 0.6, needs: ['encouragement'] }],
      ['struggling', { emotion: 'struggling', intensity: 0.7, needs: ['comfort', 'guidance', 'encouragement'] }]
    ]);
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns = new Map([
      [IntentType.SEEKING_COMFORT, [/i need comfort|comfort me|feeling (sad|down|depressed)/]],
      [IntentType.ASKING_GUIDANCE, [/what should i do|how should i|need guidance/]],
      [IntentType.EXPLORING_TOPIC, [/tell me about|what is|explain|learn about/]],
      [IntentType.REQUESTING_EXPLANATION, [/what does (this|that) mean|explain (this|that)/]],
      [IntentType.SHARING_STRUGGLE, [/i'm struggling with|having trouble with|dealing with/]],
      [IntentType.FOLLOWING_UP, [/also|and|what about|tell me more/]],
      [IntentType.EXPRESSING_GRATITUDE, [/thank you|thanks|grateful|appreciate/]],
      [IntentType.SEEKING_ENCOURAGEMENT, [/need encouragement|encourage me|feeling discouraged/]]
    ]);
  }

  private initializeBiblicalTopics(): void {
    this.biblicalTopics = new Map([
      ['love', ['love', 'loving', 'beloved', 'affection', 'care', 'compassion']],
      ['faith', ['faith', 'believe', 'trust', 'confidence', 'assurance']],
      ['hope', ['hope', 'hopeful', 'expectation', 'future', 'promise']],
      ['peace', ['peace', 'peaceful', 'calm', 'rest', 'tranquil']],
      ['forgiveness', ['forgive', 'forgiveness', 'pardon', 'mercy', 'grace']],
      ['strength', ['strength', 'strong', 'power', 'courage', 'endurance']],
      ['wisdom', ['wisdom', 'wise', 'understanding', 'knowledge', 'discernment']],
      ['prayer', ['prayer', 'pray', 'intercession', 'petition', 'worship']],
      ['fear', ['fear', 'afraid', 'anxiety', 'worry', 'concern']],
      ['joy', ['joy', 'joyful', 'happiness', 'gladness', 'celebration']]
    ]);
  }
}