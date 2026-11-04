import type { ReviewTag } from '@/api/types';

export const REVIEW_TAGS: ReviewTag[] = ['ON_TIME', 'GOOD_TEAMMATE', 'FAIR_PLAY', 'SKILLED'];

export const REVIEW_TAG_LABELS: Record<ReviewTag, string> = {
    ON_TIME: '⏱️ On time',
    GOOD_TEAMMATE: '🤝 Good teammate',
    FAIR_PLAY: '⚖️ Fair play',
    SKILLED: '🔥 Skilled',
};