// Maps each zone island to its learning activity + presentation metadata.
import type React from 'react';
import type { ZoneId } from '../three/worldConfig';
import type { ActivityProps } from './shared';
import EmotionsActivity from './EmotionsActivity';
import RoutineActivity from './RoutineActivity';
import CalmActivity from './CalmActivity';
import FriendshipActivity from './FriendshipActivity';

export interface ActivityMeta {
  zone: ZoneId;
  title: string;
  emoji: string;
  accent: string;
  /** the ASD skill area this activity grows */
  skill: string;
  /** kid-facing one-liner for the level-select screen */
  tagline: string;
  /** short labels for each of the 5 levels (what the child is learning) */
  levelNames: string[];
  component: React.FC<ActivityProps>;
}

export const ACTIVITIES: Record<Exclude<ZoneId, 'home'>, ActivityMeta> = {
  meadow: {
    zone: 'meadow',
    title: 'Feelings Meadow',
    emoji: '🌸',
    accent: '#ff8fc8',
    skill: 'Reading Emotions',
    tagline: 'Learn to read how friends feel',
    levelNames: ['Match faces', 'Body clues', 'From the story', 'What they wanted', 'Help a friend'],
    component: EmotionsActivity,
  },
  mountain: {
    zone: 'mountain',
    title: 'Morning Mountain',
    emoji: '⛰️',
    accent: '#7cc6ff',
    skill: 'Life Skills',
    tagline: 'Practice everyday self-care',
    levelNames: ['One step', 'Little chains', 'Whole routine', 'Stay safe', 'All by myself'],
    component: RoutineActivity,
  },
  cove: {
    zone: 'cove',
    title: 'Calm Cove',
    emoji: '🌊',
    accent: '#5fd0e0',
    skill: 'Calm & Senses',
    tagline: 'Find calm when things feel big',
    levelNames: ['Breathe', 'Breathe & count', 'Body check', 'Pick a strategy', 'My calm plan'],
    component: CalmActivity,
  },
  forest: {
    zone: 'forest',
    title: 'Friendship Forest',
    emoji: '🌳',
    accent: '#c6a0ff',
    skill: 'Expressive Language',
    tagline: 'Use your words with friends',
    levelNames: ['Ask for it', 'Action words', 'Two words', 'I see…', 'Sentences & chat'],
    component: FriendshipActivity,
  },
};
