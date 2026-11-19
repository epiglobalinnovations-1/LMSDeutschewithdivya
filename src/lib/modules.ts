/** Navigation and roll-out status for the student and admin applications. */

/** Highest phase whose modules are live. Modules above it show "Soon". */
export const RELEASED_PHASE = 2;
export type ModuleInfo = {
  slug: string;
  label: string;
  phase: number;
  description: string;
};

export const studentModules: ModuleInfo[] = [
  { slug: "courses", label: "My courses", phase: 2, description: "Your enrolled courses, lessons and completion." },
  { slug: "flashcards", label: "Flashcards", phase: 2, description: "Daily new words and FSRS reviews, in both directions, with swipe and keyboard controls." },
  { slug: "vocabulary", label: "Vocabulary", phase: 2, description: "Search every word by level, topic and category, and see your bookmarked and difficult words." },
  { slug: "listening", label: "Listening", phase: 3, description: "German sentences and videos with replay, slow-down, transcripts and comprehension questions." },
  { slug: "stories", label: "Stories", phase: 3, description: "Graded German stories with audio. Tap any word to see its meaning and save it." },
  { slug: "grammar", label: "Grammar", phase: 3, description: "Simple explanations, examples, practice and a mini quiz for every grammar topic." },
  { slug: "sentences", label: "Sentence builder", phase: 3, description: "Reorder, complete and translate sentences, with explanations for every mistake." },
  { slug: "tutor", label: "AI tutor", phase: 4, description: "Conversation practice for everyday life, travel, work and interviews, adapted to your level." },
  { slug: "progress", label: "My progress", phase: 2, description: "Words learned, reviews, streaks, study time and performance by skill." },
  { slug: "achievements", label: "Achievements", phase: 2, description: "Badges, XP, weekly targets and milestones." },
];

export const adminModules: ModuleInfo[] = [
  { slug: "students", label: "Students", phase: 5, description: "Search students, see their progress and identify who needs help." },
  { slug: "courses", label: "Courses", phase: 5, description: "Create courses, modules and lessons with a live preview." },
  { slug: "vocabulary", label: "Vocabulary", phase: 2, description: "Add, edit, verify and publish vocabulary entries." },
  { slug: "flashcards", label: "Flashcard decks", phase: 2, description: "Build decks by course, level or topic." },
  { slug: "exercises", label: "Exercises", phase: 3, description: "Create quizzes and exercises of every type, with answer keys and explanations." },
  { slug: "analytics", label: "Analytics", phase: 5, description: "Activity, retention and performance across all students." },
  { slug: "announcements", label: "Announcements", phase: 5, description: "Send messages to all students or to a plan or course." },
  { slug: "subscriptions", label: "Subscriptions", phase: 6, description: "Plans, prices, payment settings and member subscriptions." },
  { slug: "import", label: "Import and export", phase: 2, description: "Bulk import CSV, Excel and JSON with validation and duplicate detection; export any content." },
];
