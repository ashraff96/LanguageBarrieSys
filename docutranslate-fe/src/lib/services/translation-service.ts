import { db } from '@/lib/db';

export interface TranslationInput {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  userId?: string;
}

export const translationService = {
  async createTranslation(data: TranslationInput) {
    return db.translation.create({
      data: {
        ...data,
      },
    });
  },

  async getTranslationById(id: string) {
    return db.translation.findUnique({
      where: { id },
    });
  },

  async getUserTranslations(userId: string) {
    return db.translation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addToHistory(data: TranslationInput) {
    return db.translationHistory.create({
      data: {
        originalText: data.originalText,
        translatedText: data.translatedText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        userId: data.userId,
      },
    });
  },

  async getTranslationHistory(userId?: string) {
    return db.translationHistory.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 translations
    });
  },
};
