/**
 * Advanced Conversation Context Manager
 * Handles conversation history, session state, and contextual reference resolution
 */

export interface ConversationContext {
  sessionId: string;
  interactions: Interaction[];
  topics: TopicThread[];
  userPreferences: UserPreferences;
  emotionalJourney: EmotionalState[];
  currentPhase: ConversationPhase;
  lastActivity: Date;
}

export interface Interaction {
  id: string;
  timestamp: Date;
  userInput: string;
  aiResponse: string;
  verses: BibleVerse[];
  userFeedback?: 'helpful' | 'partially_helpful' | 'not_helpful';
  topicsDiscussed: string[];
  emotionalContext?: string;
  intent: UserIntent;
  responseQuality: number; // 0-1 scale
}

export interface TopicThread {
  topic: string;
  subtopics: string[];
  verses: BibleVerse[];
  userInterest: number; // 0-1 scale
  lastDiscussed: Date;
  depth: number; // How deep the exploration has gone
  relatedTopics: string[];
}

export interface UserPreferences {
  spiritualMaturity: 'new' | 'growing' | 'mature';
  preferredTopics: string[];
  communicationStyle: 'direct' | 'exploratory' | 'contemplative';
  needsLevel: 'basic' | 'intermediate' | 'advanced';
  pastoralNeeds: string[];
  clarificationFrequency: 'never' | 'sometimes' | 'often';
  responseLength: 'brief' | 'moderate' | 'detailed';
}

export interface EmotionalState {
  primary: string; // 'anxious', 'hopeful', 'confused', 'grateful', etc.
  intensity: number; // 0-1 scale
  needsComfort: boolean;
  needsEncouragement: boolean;
  needsGuidance: boolean;
  timestamp: Date;
}

export interface UserIntent {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  emotionalContext: EmotionalState;
  topics: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  requiresClarification: boolean;
  referencesHistory: boolean;
  practicalApplication: boolean;
  confidence: number; // 0-1 scale of intent detection confidence
}

export enum IntentType {
  SEEKING_COMFORT = 'seeking_comfort',
  ASKING_GUIDANCE = 'asking_guidance',
  EXPLORING_TOPIC = 'exploring_topic',
  REQUESTING_EXPLANATION = 'requesting_explanation',
  SHARING_STRUGGLE = 'sharing_struggle',
  FOLLOWING_UP = 'following_up',
  EXPRESSING_GRATITUDE = 'expressing_gratitude',
  SEEKING_ENCOURAGEMENT = 'seeking_encouragement',
  ASKING_CLARIFICATION = 'asking_clarification',
  REQUESTING_APPLICATION = 'requesting_application'
}

export enum ConversationPhase {
  INTRODUCTION = 'introduction',
  EXPLORATION = 'exploration',
  DEEPENING = 'deepening',
  APPLICATION = 'application',
  CONCLUSION = 'conclusion'
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance_score?: number;
  contextualRelevance?: string;
  applicationSuggestion?: string;
  relatedThemes?: string[];
  emotionalResonance?: number;
}

export interface ContextualReference {
  type: 'verse' | 'topic' | 'interaction' | 'emotion';
  referenceText: string;
  resolvedContent: any;
  confidence: number;
  interactionId?: string;
}

export class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_INTERACTIONS = 50; // Keep last 50 interactions
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get or create conversation context for a session
   */
  async getContext(sessionId: string): Promise<ConversationContext> {
    let context = this.contexts.get(sessionId);
    
    if (!context) {
      context = this.createNewContext(sessionId);
      this.contexts.set(sessionId, context);
    } else {
      // Update last activity
      context.lastActivity = new Date();
    }
    
    return context;
  }

  /**
   * Update context with new interaction
   */
  async updateContext(
    sessionId: string, 
    userInput: string, 
    aiResponse: string, 
    verses: BibleVerse[], 
    intent: UserIntent,
    userFeedback?: string
  ): Promise<void> {
    const context = await this.getContext(sessionId);
    
    const interaction: Interaction = {
      id: this.generateInteractionId(),
      timestamp: new Date(),
      userInput,
      aiResponse,
      verses,
      userFeedback: userFeedback as any,
      topicsDiscussed: intent.topics,
      emotionalContext: intent.emotionalContext.primary,
      intent,
      responseQuality: this.calculateResponseQuality(verses, intent)
    };

    // Add interaction to history
    context.interactions.push(interaction);
    
    // Limit interaction history
    if (context.interactions.length > this.MAX_INTERACTIONS) {
      context.interactions = context.interactions.slice(-this.MAX_INTERACTIONS);
    }

    // Update topic threads
    this.updateTopicThreads(context, intent.topics, verses);
    
    // Update emotional journey
    if (intent.emotionalContext) {
      context.emotionalJourney.push(intent.emotionalContext);
      // Keep last 20 emotional states
      if (context.emotionalJourney.length > 20) {
        context.emotionalJourney = context.emotionalJourney.slice(-20);
      }
    }

    // Update conversation phase
    context.currentPhase = this.determineConversationPhase(context);
    
    // Learn user preferences
    this.updateUserPreferences(context, intent, userFeedback);
    
    context.lastActivity = new Date();
  }

  /**
   * Resolve contextual references in user input
   */
  async resolveReferences(sessionId: string, userInput: string): Promise<ContextualReference[]> {
    const context = await this.getContext(sessionId);
    const references: ContextualReference[] = [];
    
    // Common reference patterns
    const referencePatterns = [
      { pattern: /that verse|the verse|that passage|the passage/i, type: 'verse' as const },
      { pattern: /what we discussed|what you mentioned|earlier|before/i, type: 'interaction' as const },
      { pattern: /that topic|the topic we talked about/i, type: 'topic' as const },
      { pattern: /how I was feeling|my situation|what I shared/i, type: 'emotion' as const }
    ];

    for (const { pattern, type } of referencePatterns) {
      const matches = userInput.match(pattern);
      if (matches) {
        const reference = await this.findReferencedContent(context, type, matches[0]);
        if (reference) {
          references.push(reference);
        }
      }
    }

    return references;
  }

  /**
   * Get conversation history for display
   */
  async getConversationHistory(sessionId: string, limit: number = 10): Promise<Interaction[]> {
    const context = await this.getContext(sessionId);
    return context.interactions.slice(-limit);
  }

  /**
   * Get active topic threads
   */
  async getActiveTopics(sessionId: string): Promise<TopicThread[]> {
    const context = await this.getContext(sessionId);
    return context.topics
      .filter(topic => topic.userInterest > 0.3)
      .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())
      .slice(0, 5);
  }

  /**
   * Get user's emotional journey
   */
  async getEmotionalJourney(sessionId: string): Promise<EmotionalState[]> {
    const context = await this.getContext(sessionId);
    return context.emotionalJourney.slice(-10); // Last 10 emotional states
  }

  /**
   * Update user preferences based on interaction
   */
  private updateUserPreferences(
    context: ConversationContext, 
    intent: UserIntent, 
    feedback?: string
  ): void {
    // Update preferred topics based on engagement
    for (const topic of intent.topics) {
      if (!context.userPreferences.preferredTopics.includes(topic)) {
        context.userPreferences.preferredTopics.push(topic);
      }
    }

    // Limit preferred topics to top 10
    if (context.userPreferences.preferredTopics.length > 10) {
      context.userPreferences.preferredTopics = context.userPreferences.preferredTopics.slice(-10);
    }

    // Adjust communication style based on query complexity
    if (intent.complexity === 'complex' && feedback === 'helpful') {
      context.userPreferences.needsLevel = 'advanced';
    } else if (intent.complexity === 'simple' && feedback === 'helpful') {
      context.userPreferences.needsLevel = 'basic';
    }

    // Update pastoral needs based on emotional context
    if (intent.emotionalContext.needsComfort && !context.userPreferences.pastoralNeeds.includes('comfort')) {
      context.userPreferences.pastoralNeeds.push('comfort');
    }
    if (intent.emotionalContext.needsGuidance && !context.userPreferences.pastoralNeeds.includes('guidance')) {
      context.userPreferences.pastoralNeeds.push('guidance');
    }
    if (intent.emotionalContext.needsEncouragement && !context.userPreferences.pastoralNeeds.includes('encouragement')) {
      context.userPreferences.pastoralNeeds.push('encouragement');
    }
  }

  /**
   * Update topic threads with new information
   */
  private updateTopicThreads(context: ConversationContext, topics: string[], verses: BibleVerse[]): void {
    for (const topic of topics) {
      let thread = context.topics.find(t => t.topic === topic);
      
      if (!thread) {
        thread = {
          topic,
          subtopics: [],
          verses: [],
          userInterest: 0.5,
          lastDiscussed: new Date(),
          depth: 1,
          relatedTopics: []
        };
        context.topics.push(thread);
      }

      // Update thread
      thread.lastDiscussed = new Date();
      thread.depth += 0.1; // Gradually increase depth
      thread.userInterest = Math.min(1, thread.userInterest + 0.1); // Increase interest
      
      // Add new verses (avoid duplicates)
      for (const verse of verses) {
        const exists = thread.verses.some(v => 
          v.book === verse.book && v.chapter === verse.chapter && v.verse === verse.verse
        );
        if (!exists) {
          thread.verses.push(verse);
        }
      }

      // Limit verses per topic
      if (thread.verses.length > 20) {
        thread.verses = thread.verses.slice(-20);
      }
    }

    // Clean up old topics (keep last 20)
    if (context.topics.length > 20) {
      context.topics.sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime());
      context.topics = context.topics.slice(0, 20);
    }
  }

  /**
   * Determine current conversation phase
   */
  private determineConversationPhase(context: ConversationContext): ConversationPhase {
    const interactionCount = context.interactions.length;
    
    if (interactionCount <= 2) {
      return ConversationPhase.INTRODUCTION;
    } else if (interactionCount <= 5) {
      return ConversationPhase.EXPLORATION;
    } else if (interactionCount <= 10) {
      return ConversationPhase.DEEPENING;
    } else if (context.interactions.some(i => i.intent.practicalApplication)) {
      return ConversationPhase.APPLICATION;
    } else {
      return ConversationPhase.CONCLUSION;
    }
  }

  /**
   * Find referenced content based on type and context
   */
  private async findReferencedContent(
    context: ConversationContext, 
    type: 'verse' | 'topic' | 'interaction' | 'emotion', 
    referenceText: string
  ): Promise<ContextualReference | null> {
    switch (type) {
      case 'verse':
        // Find the most recent verse mentioned
        const recentInteraction = context.interactions
          .slice()
          .reverse()
          .find(i => i.verses.length > 0);
        
        if (recentInteraction && recentInteraction.verses.length > 0) {
          return {
            type: 'verse',
            referenceText,
            resolvedContent: recentInteraction.verses[0],
            confidence: 0.8,
            interactionId: recentInteraction.id
          };
        }
        break;

      case 'topic':
        // Find the most recent topic discussed
        const recentTopic = context.topics
          .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())[0];
        
        if (recentTopic) {
          return {
            type: 'topic',
            referenceText,
            resolvedContent: recentTopic,
            confidence: 0.7
          };
        }
        break;

      case 'interaction':
        // Find the most recent meaningful interaction
        const meaningfulInteraction = context.interactions
          .slice()
          .reverse()
          .find(i => i.aiResponse.length > 100); // Substantial response
        
        if (meaningfulInteraction) {
          return {
            type: 'interaction',
            referenceText,
            resolvedContent: meaningfulInteraction,
            confidence: 0.6,
            interactionId: meaningfulInteraction.id
          };
        }
        break;

      case 'emotion':
        // Find the most recent emotional state
        const recentEmotion = context.emotionalJourney[context.emotionalJourney.length - 1];
        
        if (recentEmotion) {
          return {
            type: 'emotion',
            referenceText,
            resolvedContent: recentEmotion,
            confidence: 0.7
          };
        }
        break;
    }

    return null;
  }

  /**
   * Calculate response quality based on verses and intent match
   */
  private calculateResponseQuality(verses: BibleVerse[], intent: UserIntent): number {
    if (verses.length === 0) return 0.3;
    
    let quality = 0.5; // Base quality
    
    // Boost for relevant verses
    const avgRelevance = verses.reduce((sum, v) => sum + (v.relevance_score || 0.5), 0) / verses.length;
    quality += avgRelevance * 0.3;
    
    // Boost for emotional resonance match
    if (intent.emotionalContext.needsComfort && verses.some(v => (v.emotionalResonance || 0) > 0.7)) {
      quality += 0.2;
    }
    
    return Math.min(1, quality);
  }

  /**
   * Create new conversation context
   */
  private createNewContext(sessionId: string): ConversationContext {
    return {
      sessionId,
      interactions: [],
      topics: [],
      userPreferences: {
        spiritualMaturity: 'growing',
        preferredTopics: [],
        communicationStyle: 'exploratory',
        needsLevel: 'intermediate',
        pastoralNeeds: [],
        clarificationFrequency: 'sometimes',
        responseLength: 'moderate'
      },
      emotionalJourney: [],
      currentPhase: ConversationPhase.INTRODUCTION,
      lastActivity: new Date()
    };
  }

  /**
   * Generate unique interaction ID
   */
  private generateInteractionId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.contexts.entries()) {
      if (now - context.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.contexts.delete(sessionId);
        console.log(`[ConversationContextManager] Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  /**
   * Get context statistics for monitoring
   */
  getStats(): { activeSessions: number; totalInteractions: number; averageSessionLength: number } {
    const activeSessions = this.contexts.size;
    const totalInteractions = Array.from(this.contexts.values())
      .reduce((sum, context) => sum + context.interactions.length, 0);
    const averageSessionLength = activeSessions > 0 ? totalInteractions / activeSessions : 0;

    return {
      activeSessions,
      totalInteractions,
      averageSessionLength: Math.round(averageSessionLength * 100) / 100
    };
  }
}