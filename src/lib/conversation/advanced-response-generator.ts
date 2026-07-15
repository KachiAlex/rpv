/**
 * Advanced Response Generator
 * Creates contextual, natural responses with biblical explanations and practical applications
 */

import { UserIntent, IntentType, EmotionalState, BibleVerse, ConversationContext } from './conversation-context-manager';

export interface GeneratedResponse {
  mainResponse: string;
  verses: EnhancedBibleVerse[];
  explanation: string;
  practicalApplication?: string;
  followUpQuestions: string[];
  relatedTopics: string[];
  conversationalTone: 'pastoral' | 'educational' | 'encouraging' | 'comforting';
  confidence: number;
}

export interface EnhancedBibleVerse extends BibleVerse {
  contextualRelevance: string; // Why this verse addresses the user's specific need
  applicationSuggestion?: string; // How to apply this verse practically
  relatedThemes: string[];
  emotionalResonance: number; // 0-1 scale of emotional relevance
}

export interface ResponseTemplate {
  intentType: IntentType;
  emotionalContext?: string;
  template: string;
  followUpQuestions: string[];
  tone: 'pastoral' | 'educational' | 'encouraging' | 'comforting';
}

export class AdvancedResponseGenerator {
  private responseTemplates: Map<string, ResponseTemplate> = new Map();
  private practicalApplications: Map<string, string[]> = new Map();
  private followUpQuestions: Map<IntentType, string[]> = new Map();
  private relatedTopicsMap: Map<string, string[]> = new Map();

  constructor() {
    this.initializeResponseTemplates();
    this.initializePracticalApplications();
    this.initializeFollowUpQuestions();
    this.initializeRelatedTopics();
  }

  /**
   * Generate contextual response based on intent and context
   */
  async generateContextualResponse(
    intent: UserIntent, 
    verses: BibleVerse[], 
    context?: ConversationContext
  ): Promise<GeneratedResponse> {
    
    // Enhance verses with contextual information
    const enhancedVerses = this.enhanceVerses(verses, intent);
    
    // Generate main response
    const mainResponse = this.generateMainResponse(intent, enhancedVerses, context);
    
    // Generate explanation
    const explanation = this.generateExplanation(intent, enhancedVerses);
    
    // Generate practical application if needed
    const practicalApplication = intent.practicalApplication 
      ? this.generatePracticalApplication(intent, enhancedVerses)
      : undefined;
    
    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(intent, context);
    
    // Get related topics
    const relatedTopics = this.getRelatedTopics(intent.topics);
    
    // Determine conversational tone
    const conversationalTone = this.determineConversationalTone(intent);
    
    // Calculate response confidence
    const confidence = this.calculateResponseConfidence(intent, enhancedVerses);

    return {
      mainResponse,
      verses: enhancedVerses,
      explanation,
      practicalApplication,
      followUpQuestions,
      relatedTopics,
      conversationalTone,
      confidence
    };
  }

  /**
   * Enhance verses with contextual relevance and application suggestions
   */
  private enhanceVerses(verses: BibleVerse[], intent: UserIntent): EnhancedBibleVerse[] {
    return verses.map(verse => {
      const contextualRelevance = this.generateContextualRelevance(verse, intent);
      const applicationSuggestion = this.generateApplicationSuggestion(verse, intent);
      const relatedThemes = this.getVerseThemes(verse, intent.topics);
      const emotionalResonance = this.calculateEmotionalResonance(verse, intent.emotionalContext);

      return {
        ...verse,
        contextualRelevance,
        applicationSuggestion,
        relatedThemes,
        emotionalResonance
      };
    });
  }

  /**
   * Generate main response text
   */
  private generateMainResponse(
    intent: UserIntent, 
    verses: EnhancedBibleVerse[], 
    context?: ConversationContext
  ): string {
    const templateKey = this.getTemplateKey(intent);
    const template = this.responseTemplates.get(templateKey);
    
    if (!template) {
      return this.generateFallbackResponse(intent, verses);
    }

    // Personalize response based on context
    let response = template.template;
    
    // Replace placeholders with contextual information
    response = this.replacePlaceholders(response, intent, verses, context);
    
    // Add emotional sensitivity if needed
    if (intent.emotionalContext.intensity > 0.6) {
      response = this.addEmotionalSensitivity(response, intent.emotionalContext);
    }

    return response;
  }

  /**
   * Generate explanation of why these verses are relevant
   */
  private generateExplanation(intent: UserIntent, verses: EnhancedBibleVerse[]): string {
    if (verses.length === 0) {
      return "While I don't have specific verses to share right now, I want you to know that the Bible has much to say about your situation.";
    }

    const explanations: string[] = [];
    
    // Group verses by theme for better organization
    const themeGroups = this.groupVersesByTheme(verses);
    
    for (const [theme, themeVerses] of themeGroups.entries()) {
      if (themeVerses.length === 1) {
        explanations.push(`This verse about ${theme} speaks directly to your ${this.getIntentDescription(intent.primaryIntent)}.`);
      } else {
        explanations.push(`These ${themeVerses.length} verses about ${theme} offer different perspectives on your ${this.getIntentDescription(intent.primaryIntent)}.`);
      }
    }

    // Add emotional context if relevant
    if (intent.emotionalContext.intensity > 0.5) {
      explanations.push(`I chose these passages because they offer ${this.getEmotionalSupport(intent.emotionalContext)} for what you're experiencing.`);
    }

    return explanations.join(' ');
  }

  /**
   * Generate practical application suggestions
   */
  private generatePracticalApplication(intent: UserIntent, verses: EnhancedBibleVerse[]): string {
    const applications: string[] = [];
    
    // Get applications from verses
    verses.forEach(verse => {
      if (verse.applicationSuggestion) {
        applications.push(verse.applicationSuggestion);
      }
    });

    // Add general applications based on intent
    const generalApplications = this.practicalApplications.get(intent.primaryIntent);
    if (generalApplications) {
      applications.push(...generalApplications.slice(0, 2)); // Limit to 2 general applications
    }

    if (applications.length === 0) {
      return "Consider spending time in prayer and reflection on how these truths might apply to your specific situation.";
    }

    return `Here are some practical ways to apply these truths: ${applications.join('; ')}.`;
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestions(intent: UserIntent, context?: ConversationContext): string[] {
    const questions: string[] = [];
    
    // Get base questions for the intent type
    const baseQuestions = this.followUpQuestions.get(intent.primaryIntent) || [];
    questions.push(...baseQuestions.slice(0, 2));

    // Add contextual questions based on conversation history
    if (context && context.interactions.length > 0) {
      const recentTopics = context.interactions
        .slice(-3)
        .flatMap(i => i.topicsDiscussed)
        .filter(topic => !intent.topics.includes(topic));

      if (recentTopics.length > 0) {
        questions.push(`Would you like to explore how ${recentTopics[0]} relates to what we're discussing?`);
      }
    }

    // Add emotional support questions if needed
    if (intent.emotionalContext.needsComfort) {
      questions.push("Would you like me to share more verses that offer comfort and hope?");
    }

    if (intent.emotionalContext.needsGuidance) {
      questions.push("Are you looking for specific guidance on how to move forward?");
    }

    // Limit to 3 questions maximum
    return questions.slice(0, 3);
  }

  /**
   * Get related topics for exploration
   */
  private getRelatedTopics(topics: string[]): string[] {
    const related: Set<string> = new Set();
    
    topics.forEach(topic => {
      const relatedList = this.relatedTopicsMap.get(topic);
      if (relatedList) {
        relatedList.forEach(r => related.add(r));
      }
    });

    return Array.from(related).slice(0, 5); // Limit to 5 related topics
  }

  /**
   * Determine appropriate conversational tone
   */
  private determineConversationalTone(intent: UserIntent): 'pastoral' | 'educational' | 'encouraging' | 'comforting' {
    if (intent.emotionalContext.needsComfort || intent.primaryIntent === IntentType.SEEKING_COMFORT) {
      return 'comforting';
    }
    
    if (intent.emotionalContext.needsEncouragement || intent.primaryIntent === IntentType.SEEKING_ENCOURAGEMENT) {
      return 'encouraging';
    }
    
    if (intent.primaryIntent === IntentType.REQUESTING_EXPLANATION || intent.primaryIntent === IntentType.EXPLORING_TOPIC) {
      return 'educational';
    }
    
    return 'pastoral';
  }

  /**
   * Generate contextual relevance explanation for a verse
   */
  private generateContextualRelevance(verse: BibleVerse, intent: UserIntent): string {
    const intentDescriptions = {
      [IntentType.SEEKING_COMFORT]: "offers comfort and reassurance",
      [IntentType.ASKING_GUIDANCE]: "provides divine guidance and wisdom",
      [IntentType.EXPLORING_TOPIC]: "illuminates this important topic",
      [IntentType.REQUESTING_EXPLANATION]: "helps explain this concept",
      [IntentType.SHARING_STRUGGLE]: "speaks to your struggle with understanding and hope",
      [IntentType.SEEKING_ENCOURAGEMENT]: "offers encouragement and strength",
      [IntentType.EXPRESSING_GRATITUDE]: "reflects the heart of gratitude",
      [IntentType.FOLLOWING_UP]: "builds on our previous discussion"
    };

    const baseRelevance = intentDescriptions[intent.primaryIntent as keyof typeof intentDescriptions] || "addresses your spiritual need";
    
    // Add emotional context if relevant
    if (intent.emotionalContext.intensity > 0.5) {
      return `This verse ${baseRelevance} and speaks to the ${intent.emotionalContext.primary} you're experiencing.`;
    }
    
    return `This verse ${baseRelevance} in your current situation.`;
  }

  /**
   * Generate application suggestion for a verse
   */
  private generateApplicationSuggestion(verse: BibleVerse, intent: UserIntent): string | undefined {
    if (!intent.practicalApplication) return undefined;

    // Simple application suggestions based on common verses and intents
    const applicationMap: Record<string, string> = {
      'Philippians 4:6': "When anxiety arises, pause and pray about your specific concerns, thanking God for His care",
      'Philippians 4:7': "Practice experiencing God's peace by surrendering your worries to Him in prayer",
      'Matthew 11:28': "Take time each day to bring your burdens to Jesus in quiet prayer and rest",
      'Psalm 23:1': "Remember throughout your day that God is actively caring for your needs",
      'Romans 8:28': "Look for ways God might be working even in difficult circumstances",
      'Jeremiah 29:11': "Trust that God has good plans for your future, even when you can't see them",
      'Isaiah 41:10': "When fear comes, remind yourself of God's presence and strength with you"
    };

    const verseKey = `${verse.book} ${verse.chapter}:${verse.verse}`;
    const specificApplication = applicationMap[verseKey];
    
    if (specificApplication) {
      return specificApplication;
    }

    // Generate general application based on intent
    const generalApplications = {
      [IntentType.SEEKING_COMFORT]: "Meditate on this truth when you need comfort and peace",
      [IntentType.ASKING_GUIDANCE]: "Pray about this principle when making decisions",
      [IntentType.SEEKING_ENCOURAGEMENT]: "Remember this promise when you need strength",
      [IntentType.SHARING_STRUGGLE]: "Hold onto this truth during difficult times"
    };

    return generalApplications[intent.primaryIntent as keyof typeof generalApplications];
  }

  /**
   * Get themes related to a verse and user topics
   */
  private getVerseThemes(verse: BibleVerse, userTopics: string[]): string[] {
    const themes: string[] = [];
    
    // Add user topics that are relevant
    themes.push(...userTopics.slice(0, 3));
    
    // Add common biblical themes based on verse content
    const verseText = verse.text.toLowerCase();
    
    if (verseText.includes('love') || verseText.includes('beloved')) themes.push('love');
    if (verseText.includes('peace') || verseText.includes('rest')) themes.push('peace');
    if (verseText.includes('strength') || verseText.includes('strong')) themes.push('strength');
    if (verseText.includes('hope') || verseText.includes('future')) themes.push('hope');
    if (verseText.includes('faith') || verseText.includes('trust')) themes.push('faith');
    
    return [...new Set(themes)]; // Remove duplicates
  }

  /**
   * Calculate emotional resonance between verse and user's emotional state
   */
  private calculateEmotionalResonance(verse: BibleVerse, emotionalState: EmotionalState): number {
    const verseText = verse.text.toLowerCase();
    let resonance = 0.3; // Base resonance
    
    // Check for emotional keywords in verse
    const emotionalKeywords = {
      comfort: ['comfort', 'peace', 'rest', 'calm', 'gentle'],
      encouragement: ['strength', 'courage', 'hope', 'overcome', 'victory'],
      guidance: ['way', 'path', 'lead', 'guide', 'wisdom', 'understanding'],
      love: ['love', 'beloved', 'dear', 'precious', 'cherish']
    };

    // Boost resonance based on emotional needs
    if (emotionalState.needsComfort && emotionalKeywords.comfort.some(word => verseText.includes(word))) {
      resonance += 0.4;
    }
    
    if (emotionalState.needsEncouragement && emotionalKeywords.encouragement.some(word => verseText.includes(word))) {
      resonance += 0.4;
    }
    
    if (emotionalState.needsGuidance && emotionalKeywords.guidance.some(word => verseText.includes(word))) {
      resonance += 0.3;
    }

    // Boost for general positive emotional words
    if (emotionalKeywords.love.some(word => verseText.includes(word))) {
      resonance += 0.2;
    }

    return Math.min(1, resonance);
  }

  /**
   * Group verses by theme for better organization
   */
  private groupVersesByTheme(verses: EnhancedBibleVerse[]): Map<string, EnhancedBibleVerse[]> {
    const groups = new Map<string, EnhancedBibleVerse[]>();
    
    verses.forEach(verse => {
      const primaryTheme = verse.relatedThemes[0] || 'general';
      
      if (!groups.has(primaryTheme)) {
        groups.set(primaryTheme, []);
      }
      
      groups.get(primaryTheme)!.push(verse);
    });
    
    return groups;
  }

  /**
   * Get template key for response generation
   */
  private getTemplateKey(intent: UserIntent): string {
    let key: string = intent.primaryIntent;
    
    if (intent.emotionalContext.intensity > 0.6) {
      key += `_${intent.emotionalContext.primary}`;
    }
    
    return key;
  }

  /**
   * Replace placeholders in response templates
   */
  private replacePlaceholders(
    template: string, 
    intent: UserIntent, 
    verses: EnhancedBibleVerse[], 
    context?: ConversationContext
  ): string {
    let response = template;
    
    // Replace common placeholders
    response = response.replace('{topic}', intent.topics[0] || 'this topic');
    response = response.replace('{emotion}', intent.emotionalContext.primary);
    response = response.replace('{verse_count}', verses.length.toString());
    
    // Add contextual information if available
    if (context && context.interactions.length > 0) {
      response = response.replace('{previous_topic}', context.topics[0]?.topic || 'our previous discussion');
    }
    
    return response;
  }

  /**
   * Add emotional sensitivity to response
   */
  private addEmotionalSensitivity(response: string, emotionalState: EmotionalState): string {
    const sensitivityPrefixes = {
      anxious: "I understand you're feeling anxious. ",
      sad: "I can sense you're going through a difficult time. ",
      angry: "I hear that you're feeling frustrated. ",
      confused: "I know this can be confusing. ",
      fearful: "I understand you're feeling afraid. ",
      struggling: "I recognize you're facing challenges. "
    };

    const prefix = sensitivityPrefixes[emotionalState.primary as keyof typeof sensitivityPrefixes];
    
    if (prefix) {
      return prefix + response;
    }
    
    return response;
  }

  /**
   * Generate fallback response when no template is available
   */
  private generateFallbackResponse(intent: UserIntent, verses: EnhancedBibleVerse[]): string {
    if (verses.length === 0) {
      return "I want to help you explore this topic. While I don't have specific verses to share right now, I'm here to discuss what's on your heart.";
    }
    
    return `I found ${verses.length} verse${verses.length > 1 ? 's' : ''} that speak${verses.length === 1 ? 's' : ''} to your ${this.getIntentDescription(intent.primaryIntent)}. Let me share what I discovered.`;
  }

  /**
   * Get description for intent type
   */
  private getIntentDescription(intent: IntentType): string {
    const descriptions = {
      [IntentType.SEEKING_COMFORT]: "need for comfort",
      [IntentType.ASKING_GUIDANCE]: "request for guidance",
      [IntentType.EXPLORING_TOPIC]: "desire to explore this topic",
      [IntentType.REQUESTING_EXPLANATION]: "question",
      [IntentType.SHARING_STRUGGLE]: "struggle",
      [IntentType.SEEKING_ENCOURAGEMENT]: "need for encouragement",
      [IntentType.EXPRESSING_GRATITUDE]: "expression of gratitude",
      [IntentType.FOLLOWING_UP]: "follow-up question"
    };
    
    return descriptions[intent as keyof typeof descriptions] || "spiritual need";
  }

  /**
   * Get emotional support description
   */
  private getEmotionalSupport(emotionalState: EmotionalState): string {
    if (emotionalState.needsComfort) return "comfort and peace";
    if (emotionalState.needsEncouragement) return "encouragement and hope";
    if (emotionalState.needsGuidance) return "wisdom and direction";
    return "support and understanding";
  }

  /**
   * Calculate response confidence
   */
  private calculateResponseConfidence(intent: UserIntent, verses: EnhancedBibleVerse[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost for relevant verses
    if (verses.length > 0) {
      const avgRelevance = verses.reduce((sum, v) => sum + (v.relevance_score || 0.5), 0) / verses.length;
      confidence += avgRelevance * 0.3;
    }
    
    // Boost for emotional resonance
    if (verses.some(v => v.emotionalResonance > 0.7)) {
      confidence += 0.2;
    }
    
    // Boost for high intent confidence
    confidence += intent.confidence * 0.2;
    
    return Math.min(1, confidence);
  }

  /**
   * Initialize response templates
   */
  private initializeResponseTemplates(): void {
    this.responseTemplates = new Map([
      [IntentType.SEEKING_COMFORT, {
        intentType: IntentType.SEEKING_COMFORT,
        template: "I understand you're looking for comfort. The Bible has beautiful promises for times like these. Let me share some verses that have brought peace to many hearts.",
        followUpQuestions: ["Would you like to talk about what's causing you distress?", "Are there specific areas where you need God's comfort?"],
        tone: 'comforting'
      }],
      [IntentType.ASKING_GUIDANCE, {
        intentType: IntentType.ASKING_GUIDANCE,
        template: "Seeking God's guidance is wise. The Bible offers wonderful wisdom for decision-making and finding direction. Here's what Scripture says about {topic}.",
        followUpQuestions: ["What specific decision are you facing?", "Would you like to explore what prayer might look like in this situation?"],
        tone: 'pastoral'
      }],
      [IntentType.EXPLORING_TOPIC, {
        intentType: IntentType.EXPLORING_TOPIC,
        template: "What a wonderful topic to explore! The Bible has rich insights about {topic}. Let me share some key passages that illuminate this subject.",
        followUpQuestions: ["What aspect of {topic} interests you most?", "Would you like to see how this connects to other biblical themes?"],
        tone: 'educational'
      }],
      [IntentType.SEEKING_ENCOURAGEMENT, {
        intentType: IntentType.SEEKING_ENCOURAGEMENT,
        template: "I'm glad you reached out for encouragement. God's Word is full of hope and strength for difficult times. These verses have encouraged countless believers.",
        followUpQuestions: ["What's been weighing on your heart lately?", "Would you like to explore more about God's promises for strength?"],
        tone: 'encouraging'
      }]
    ]);
  }

  /**
   * Initialize practical applications
   */
  private initializePracticalApplications(): void {
    this.practicalApplications = new Map([
      [IntentType.SEEKING_COMFORT, [
        "Set aside time each day for quiet reflection and prayer",
        "Write down one thing you're grateful for each day",
        "Reach out to a trusted friend or counselor for support"
      ]],
      [IntentType.ASKING_GUIDANCE, [
        "Spend time in prayer before making important decisions",
        "Seek counsel from wise, godly people in your life",
        "Look for ways God might be leading through circumstances"
      ]],
      [IntentType.SEEKING_ENCOURAGEMENT, [
        "Memorize encouraging verses to recall during difficult times",
        "Connect with others who can offer support and prayer",
        "Focus on God's faithfulness in past challenges"
      ]]
    ]);
  }

  /**
   * Initialize follow-up questions
   */
  private initializeFollowUpQuestions(): void {
    this.followUpQuestions = new Map([
      [IntentType.SEEKING_COMFORT, [
        "Would you like to share more about what you're going through?",
        "Are there specific fears or worries I can help address?",
        "Would prayer be helpful right now?"
      ]],
      [IntentType.ASKING_GUIDANCE, [
        "What specific situation are you seeking guidance about?",
        "Have you been able to pray about this decision?",
        "Would you like to explore what wise counsel might look like?"
      ]],
      [IntentType.EXPLORING_TOPIC, [
        "What sparked your interest in this topic?",
        "Would you like to see how this connects to daily life?",
        "Are there related topics you'd like to explore?"
      ]]
    ]);
  }

  /**
   * Initialize related topics mapping
   */
  private initializeRelatedTopics(): void {
    this.relatedTopicsMap = new Map([
      ['love', ['forgiveness', 'grace', 'mercy', 'compassion', 'relationships']],
      ['faith', ['trust', 'belief', 'doubt', 'assurance', 'hope']],
      ['peace', ['rest', 'calm', 'anxiety', 'worry', 'stress']],
      ['forgiveness', ['grace', 'mercy', 'redemption', 'love', 'reconciliation']],
      ['strength', ['courage', 'endurance', 'perseverance', 'power', 'weakness']],
      ['wisdom', ['understanding', 'knowledge', 'discernment', 'guidance', 'decisions']],
      ['prayer', ['worship', 'communion', 'intercession', 'petition', 'thanksgiving']],
      ['hope', ['future', 'promise', 'expectation', 'faith', 'encouragement']]
    ]);
  }
}