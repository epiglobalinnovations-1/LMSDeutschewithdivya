export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          criteria: NonNullable<Json>;
          description: string;
          icon: string | null;
          id: string;
          is_active: boolean;
          key: string;
          sort_order: number;
          title: string;
          xp_reward: number;
        };
        ComputedFields: never;
        Insert: {
          criteria?: NonNullable<Json>;
          description: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          sort_order?: number;
          title: string;
          xp_reward?: number;
        };
        Update: {
          criteria?: NonNullable<Json>;
          description?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          sort_order?: number;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          created_at: string;
          id: string;
          scenario: Database["public"]["Enums"]["ai_scenario"];
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          created_at?: string;
          id?: string;
          scenario: Database["public"]["Enums"]["ai_scenario"];
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          created_at?: string;
          id?: string;
          scenario?: Database["public"]["Enums"]["ai_scenario"];
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          corrections: Json | null;
          created_at: string;
          id: string;
          input_tokens: number | null;
          output_tokens: number | null;
          role: Database["public"]["Enums"]["ai_message_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          conversation_id: string;
          corrections?: Json | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          role: Database["public"]["Enums"]["ai_message_role"];
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          corrections?: Json | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          role?: Database["public"]["Enums"]["ai_message_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"];
          body: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          published_at: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"];
          body: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          published_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"];
          body?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          published_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          is_public: boolean;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          is_public?: boolean;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: NonNullable<Json>;
        };
        Update: {
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          handled_at: string | null;
          id: string;
          message: string;
          name: string;
          topic: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          handled_at?: string | null;
          id?: string;
          message: string;
          name: string;
          topic?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          handled_at?: string | null;
          id?: string;
          message?: string;
          name?: string;
          topic?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_imports: {
        Row: {
          created_at: string;
          created_by: string | null;
          errors: NonNullable<Json>;
          file_name: string;
          id: string;
          inserted: number;
          kind: string;
          metadata: NonNullable<Json>;
          skipped: number;
          status: Database["public"]["Enums"]["import_status"];
          total_rows: number;
          updated: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          errors?: NonNullable<Json>;
          file_name: string;
          id?: string;
          inserted?: number;
          kind: string;
          metadata?: NonNullable<Json>;
          skipped?: number;
          status?: Database["public"]["Enums"]["import_status"];
          total_rows?: number;
          updated?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          errors?: NonNullable<Json>;
          file_name?: string;
          id?: string;
          inserted?: number;
          kind?: string;
          metadata?: NonNullable<Json>;
          skipped?: number;
          status?: Database["public"]["Enums"]["import_status"];
          total_rows?: number;
          updated?: number;
        };
        Relationships: [
          {
            foreignKeyName: "content_imports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      course_modules: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          cover_image: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          sort_order: number;
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          cover_image?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          sort_order?: number;
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          cover_image?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug?: string;
          sort_order?: number;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_activity: {
        Row: {
          activity_date: string;
          exercises_completed: number;
          minutes_studied: number;
          new_words: number;
          reviews: number;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        ComputedFields: never;
        Insert: {
          activity_date: string;
          exercises_completed?: number;
          minutes_studied?: number;
          new_words?: number;
          reviews?: number;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          activity_date?: string;
          exercises_completed?: number;
          minutes_studied?: number;
          new_words?: number;
          reviews?: number;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          completed_at: string | null;
          course_id: string;
          enrolled_at: string;
          last_lesson_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          course_id: string;
          enrolled_at?: string;
          last_lesson_id?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          enrolled_at?: string;
          last_lesson_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_last_lesson_id_fkey";
            columns: ["last_lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_attempts: {
        Row: {
          ai_feedback: Json | null;
          answer: NonNullable<Json>;
          created_at: string;
          duration_ms: number | null;
          exercise_id: string;
          id: string;
          is_correct: boolean | null;
          question_id: string | null;
          score: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ai_feedback?: Json | null;
          answer: NonNullable<Json>;
          created_at?: string;
          duration_ms?: number | null;
          exercise_id: string;
          id?: string;
          is_correct?: boolean | null;
          question_id?: string | null;
          score?: number | null;
          user_id: string;
        };
        Update: {
          ai_feedback?: Json | null;
          answer?: NonNullable<Json>;
          created_at?: string;
          duration_ms?: number | null;
          exercise_id?: string;
          id?: string;
          is_correct?: boolean | null;
          question_id?: string | null;
          score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "exercise_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_questions: {
        Row: {
          accepted_answers: string[];
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null;
          content_id: string | null;
          correct_answer: NonNullable<Json>;
          data: NonNullable<Json>;
          difficulty: number | null;
          exercise_id: string;
          explanation: string | null;
          id: string;
          learning_objective: string | null;
          points: number;
          prompt: string;
          question_type: Database["public"]["Enums"]["question_type"];
          sort_order: number;
          topic_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          accepted_answers?: string[];
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null;
          content_id?: string | null;
          correct_answer: NonNullable<Json>;
          data?: NonNullable<Json>;
          difficulty?: number | null;
          exercise_id: string;
          explanation?: string | null;
          id?: string;
          learning_objective?: string | null;
          points?: number;
          prompt: string;
          question_type: Database["public"]["Enums"]["question_type"];
          sort_order?: number;
          topic_id?: number | null;
        };
        Update: {
          accepted_answers?: string[];
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null;
          content_id?: string | null;
          correct_answer?: NonNullable<Json>;
          data?: NonNullable<Json>;
          difficulty?: number | null;
          exercise_id?: string;
          explanation?: string | null;
          id?: string;
          learning_objective?: string | null;
          points?: number;
          prompt?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          sort_order?: number;
          topic_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_questions_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id: string | null;
          created_at: string;
          created_by: string | null;
          difficulty: number | null;
          due_at: string | null;
          exercise_type: Database["public"]["Enums"]["exercise_type"];
          grammar_topic_id: string | null;
          id: string;
          instructions: string | null;
          is_published: boolean;
          learning_objective: string | null;
          lesson_id: string | null;
          listening_material_id: string | null;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          skill: Database["public"]["Enums"]["language_skill"] | null;
          slug: string | null;
          sort_order: number;
          story_id: string | null;
          title: string;
          topic_id: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          difficulty?: number | null;
          due_at?: string | null;
          exercise_type: Database["public"]["Enums"]["exercise_type"];
          grammar_topic_id?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean;
          learning_objective?: string | null;
          lesson_id?: string | null;
          listening_material_id?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          skill?: Database["public"]["Enums"]["language_skill"] | null;
          slug?: string | null;
          sort_order?: number;
          story_id?: string | null;
          title: string;
          topic_id?: number | null;
          updated_at?: string;
        };
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          difficulty?: number | null;
          due_at?: string | null;
          exercise_type?: Database["public"]["Enums"]["exercise_type"];
          grammar_topic_id?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean;
          learning_objective?: string | null;
          lesson_id?: string | null;
          listening_material_id?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          skill?: Database["public"]["Enums"]["language_skill"] | null;
          slug?: string | null;
          sort_order?: number;
          story_id?: string | null;
          title?: string;
          topic_id?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_grammar_topic_id_fkey";
            columns: ["grammar_topic_id"];
            isOneToOne: false;
            referencedRelation: "grammar_topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_listening_material_id_fkey";
            columns: ["listening_material_id"];
            isOneToOne: false;
            referencedRelation: "listening_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcard_decks: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          sort_order: number;
          title: string;
          topic_id: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          sort_order?: number;
          title: string;
          topic_id?: number | null;
          updated_at?: string;
        };
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug?: string;
          sort_order?: number;
          title?: string;
          topic_id?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcard_decks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcard_decks_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          deck_id: string;
          id: string;
          sort_order: number;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          deck_id: string;
          id?: string;
          sort_order?: number;
          vocabulary_id: string;
        };
        Update: {
          deck_id?: string;
          id?: string;
          sort_order?: number;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
      grammar_topics: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          common_mistakes: NonNullable<Json>;
          content_id: string | null;
          created_at: string;
          created_by: string | null;
          examples: NonNullable<Json>;
          explanation: string | null;
          id: string;
          is_published: boolean;
          memory_tricks: string[];
          objectives: string[];
          practical_usage: string | null;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          rules: NonNullable<Json>;
          slug: string;
          sort_order: number;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          common_mistakes?: NonNullable<Json>;
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          examples?: NonNullable<Json>;
          explanation?: string | null;
          id?: string;
          is_published?: boolean;
          memory_tricks?: string[];
          objectives?: string[];
          practical_usage?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          rules?: NonNullable<Json>;
          slug: string;
          sort_order?: number;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          common_mistakes?: NonNullable<Json>;
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          examples?: NonNullable<Json>;
          explanation?: string | null;
          id?: string;
          is_published?: boolean;
          memory_tricks?: string[];
          objectives?: string[];
          practical_usage?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          rules?: NonNullable<Json>;
          slug?: string;
          sort_order?: number;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grammar_topics_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          completed_at: string | null;
          lesson_id: string;
          started_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          lesson_id: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          lesson_id?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          estimated_minutes: number | null;
          id: string;
          is_free_preview: boolean;
          is_published: boolean;
          module_id: string;
          slug: string;
          sort_order: number;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          content?: NonNullable<Json>;
          created_at?: string;
          estimated_minutes?: number | null;
          id?: string;
          is_free_preview?: boolean;
          is_published?: boolean;
          module_id: string;
          slug: string;
          sort_order?: number;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          estimated_minutes?: number | null;
          id?: string;
          is_free_preview?: boolean;
          is_published?: boolean;
          module_id?: string;
          slug?: string;
          sort_order?: number;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "course_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      listening_materials: {
        Row: {
          audio_path: string | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id: string | null;
          created_at: string;
          created_by: string | null;
          end_seconds: number | null;
          id: string;
          is_published: boolean;
          kind: Database["public"]["Enums"]["listening_kind"];
          license_note: string | null;
          narration_text: string | null;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          scenario: string | null;
          segments: NonNullable<Json>;
          slug: string;
          speakers: NonNullable<Json>;
          start_seconds: number | null;
          title: string;
          topic_id: number | null;
          transcript_de: string | null;
          transcript_en: string | null;
          updated_at: string;
          vocabulary_notes: NonNullable<Json>;
          youtube_video_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          audio_path?: string | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          end_seconds?: number | null;
          id?: string;
          is_published?: boolean;
          kind: Database["public"]["Enums"]["listening_kind"];
          license_note?: string | null;
          narration_text?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          scenario?: string | null;
          segments?: NonNullable<Json>;
          slug: string;
          speakers?: NonNullable<Json>;
          start_seconds?: number | null;
          title: string;
          topic_id?: number | null;
          transcript_de?: string | null;
          transcript_en?: string | null;
          updated_at?: string;
          vocabulary_notes?: NonNullable<Json>;
          youtube_video_id?: string | null;
        };
        Update: {
          audio_path?: string | null;
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          end_seconds?: number | null;
          id?: string;
          is_published?: boolean;
          kind?: Database["public"]["Enums"]["listening_kind"];
          license_note?: string | null;
          narration_text?: string | null;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          scenario?: string | null;
          segments?: NonNullable<Json>;
          slug?: string;
          speakers?: NonNullable<Json>;
          start_seconds?: number | null;
          title?: string;
          topic_id?: number | null;
          transcript_de?: string | null;
          transcript_en?: string | null;
          updated_at?: string;
          vocabulary_notes?: NonNullable<Json>;
          youtube_video_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listening_materials_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listening_materials_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_plans: {
        Row: {
          created_at: string;
          description: string | null;
          features: NonNullable<Json>;
          id: string;
          is_active: boolean;
          limits: NonNullable<Json>;
          name: string;
          price_inr_month: number | null;
          price_inr_year: number | null;
          price_usd_month: number | null;
          price_usd_year: number | null;
          sort_order: number;
          tier: Database["public"]["Enums"]["plan_tier"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          features?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          limits?: NonNullable<Json>;
          name: string;
          price_inr_month?: number | null;
          price_inr_year?: number | null;
          price_usd_month?: number | null;
          price_usd_year?: number | null;
          sort_order?: number;
          tier: Database["public"]["Enums"]["plan_tier"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          features?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          limits?: NonNullable<Json>;
          name?: string;
          price_inr_month?: number | null;
          price_inr_year?: number | null;
          price_usd_month?: number | null;
          price_usd_year?: number | null;
          sort_order?: number;
          tier?: Database["public"]["Enums"]["plan_tier"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          country: string | null;
          created_at: string;
          current_level: Database["public"]["Enums"]["cefr_level"];
          daily_new_words: number;
          display_name: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          last_active_at: string | null;
          marketing_opt_in: boolean;
          onboarded_at: string | null;
          study_direction: Database["public"]["Enums"]["study_direction"];
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          current_level?: Database["public"]["Enums"]["cefr_level"];
          daily_new_words?: number;
          display_name?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          last_active_at?: string | null;
          marketing_opt_in?: boolean;
          onboarded_at?: string | null;
          study_direction?: Database["public"]["Enums"]["study_direction"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          current_level?: Database["public"]["Enums"]["cefr_level"];
          daily_new_words?: number;
          display_name?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          last_active_at?: string | null;
          marketing_opt_in?: boolean;
          onboarded_at?: string | null;
          study_direction?: Database["public"]["Enums"]["study_direction"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_history: {
        Row: {
          difficulty_after: number;
          direction: Database["public"]["Enums"]["study_direction"];
          duration_ms: number | null;
          elapsed_days: number;
          id: number;
          rating: Database["public"]["Enums"]["review_rating"];
          reviewed_at: string;
          scheduled_days: number;
          stability_after: number;
          state_before: Database["public"]["Enums"]["srs_state"];
          user_id: string;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          difficulty_after: number;
          direction: Database["public"]["Enums"]["study_direction"];
          duration_ms?: number | null;
          elapsed_days?: number;
          id?: number;
          rating: Database["public"]["Enums"]["review_rating"];
          reviewed_at?: string;
          scheduled_days?: number;
          stability_after: number;
          state_before: Database["public"]["Enums"]["srs_state"];
          user_id: string;
          vocabulary_id: string;
        };
        Update: {
          difficulty_after?: number;
          direction?: Database["public"]["Enums"]["study_direction"];
          duration_ms?: number | null;
          elapsed_days?: number;
          id?: number;
          rating?: Database["public"]["Enums"]["review_rating"];
          reviewed_at?: string;
          scheduled_days?: number;
          stability_after?: number;
          state_before?: Database["public"]["Enums"]["srs_state"];
          user_id?: string;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_history_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          description: string | null;
          id: number;
          key: Database["public"]["Enums"]["app_role"];
          name: string;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          id: number;
          key: Database["public"]["Enums"]["app_role"];
          name: string;
        };
        Update: {
          description?: string | null;
          id?: number;
          key?: Database["public"]["Enums"]["app_role"];
          name?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          audio_path: string | null;
          body_de: string;
          body_en: string | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id: string | null;
          created_at: string;
          created_by: string | null;
          grammar_notes: string | null;
          id: string;
          is_published: boolean;
          required_plan: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          title_de: string;
          title_en: string | null;
          topic_id: number | null;
          updated_at: string;
          vocabulary_highlights: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          audio_path?: string | null;
          body_de: string;
          body_en?: string | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          grammar_notes?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          title_de: string;
          title_en?: string | null;
          topic_id?: number | null;
          updated_at?: string;
          vocabulary_highlights?: NonNullable<Json>;
        };
        Update: {
          audio_path?: string | null;
          body_de?: string;
          body_en?: string | null;
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          grammar_notes?: string | null;
          id?: string;
          is_published?: boolean;
          required_plan?: Database["public"]["Enums"]["plan_tier"];
          slug?: string;
          title_de?: string;
          title_en?: string | null;
          topic_id?: number | null;
          updated_at?: string;
          vocabulary_highlights?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "stories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stories_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      student_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          achievement_id: string;
          earned_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_vocabulary_progress: {
        Row: {
          correct_count: number;
          difficulty: number;
          due_at: string;
          first_seen_at: string;
          incorrect_count: number;
          is_bookmarked: boolean;
          is_known: boolean;
          lapses: number;
          last_reviewed_at: string | null;
          learning_steps: number;
          reps: number;
          scheduled_days: number;
          source: string | null;
          stability: number;
          state: Database["public"]["Enums"]["srs_state"];
          updated_at: string;
          user_id: string;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          correct_count?: number;
          difficulty?: number;
          due_at?: string;
          first_seen_at?: string;
          incorrect_count?: number;
          is_bookmarked?: boolean;
          is_known?: boolean;
          lapses?: number;
          last_reviewed_at?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          source?: string | null;
          stability?: number;
          state?: Database["public"]["Enums"]["srs_state"];
          updated_at?: string;
          user_id: string;
          vocabulary_id: string;
        };
        Update: {
          correct_count?: number;
          difficulty?: number;
          due_at?: string;
          first_seen_at?: string;
          incorrect_count?: number;
          is_bookmarked?: boolean;
          is_known?: boolean;
          lapses?: number;
          last_reviewed_at?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          source?: string | null;
          stability?: number;
          state?: Database["public"]["Enums"]["srs_state"];
          updated_at?: string;
          user_id?: string;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_vocabulary_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_vocabulary_progress_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string;
          id: string;
          notes: string | null;
          plan_id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string;
          id?: string;
          notes?: string | null;
          plan_id: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string;
          id?: string;
          notes?: string | null;
          plan_id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "membership_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          description: string | null;
          id: number;
          name: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          id?: number;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          description?: string | null;
          id?: number;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role_id: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role_id: number;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vocabulary: {
        Row: {
          article: Database["public"]["Enums"]["german_article"] | null;
          audio_path: string | null;
          auxiliary: Database["public"]["Enums"]["verb_auxiliary"] | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id: string | null;
          created_at: string;
          created_by: string | null;
          difficulty: number;
          frequency_rank: number | null;
          has_plural: boolean | null;
          id: string;
          image_path: string | null;
          ipa: string | null;
          is_published: boolean;
          is_verified: boolean;
          lemma: string;
          notes: string | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          plural: string | null;
          pronunciation_guide: string | null;
          related_terms: string[];
          source: string | null;
          topic_id: number | null;
          updated_at: string;
          verb_forms: Json | null;
        };
        ComputedFields: never;
        Insert: {
          article?: Database["public"]["Enums"]["german_article"] | null;
          audio_path?: string | null;
          auxiliary?: Database["public"]["Enums"]["verb_auxiliary"] | null;
          cefr_level: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          difficulty?: number;
          frequency_rank?: number | null;
          has_plural?: boolean | null;
          id?: string;
          image_path?: string | null;
          ipa?: string | null;
          is_published?: boolean;
          is_verified?: boolean;
          lemma: string;
          notes?: string | null;
          part_of_speech: Database["public"]["Enums"]["part_of_speech"];
          plural?: string | null;
          pronunciation_guide?: string | null;
          related_terms?: string[];
          source?: string | null;
          topic_id?: number | null;
          updated_at?: string;
          verb_forms?: Json | null;
        };
        Update: {
          article?: Database["public"]["Enums"]["german_article"] | null;
          audio_path?: string | null;
          auxiliary?: Database["public"]["Enums"]["verb_auxiliary"] | null;
          cefr_level?: Database["public"]["Enums"]["cefr_level"];
          content_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          difficulty?: number;
          frequency_rank?: number | null;
          has_plural?: boolean | null;
          id?: string;
          image_path?: string | null;
          ipa?: string | null;
          is_published?: boolean;
          is_verified?: boolean;
          lemma?: string;
          notes?: string | null;
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"];
          plural?: string | null;
          pronunciation_guide?: string | null;
          related_terms?: string[];
          source?: string | null;
          topic_id?: number | null;
          updated_at?: string;
          verb_forms?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "vocabulary_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vocabulary_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      vocabulary_examples: {
        Row: {
          audio_path: string | null;
          id: string;
          sentence_de: string;
          sentence_en: string;
          sort_order: number;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          audio_path?: string | null;
          id?: string;
          sentence_de: string;
          sentence_en: string;
          sort_order?: number;
          vocabulary_id: string;
        };
        Update: {
          audio_path?: string | null;
          id?: string;
          sentence_de?: string;
          sentence_en?: string;
          sort_order?: number;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vocabulary_examples_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
      vocabulary_relations: {
        Row: {
          related_id: string;
          relation: string;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          related_id: string;
          relation?: string;
          vocabulary_id: string;
        };
        Update: {
          related_id?: string;
          relation?: string;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vocabulary_relations_related_id_fkey";
            columns: ["related_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vocabulary_relations_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
      vocabulary_translations: {
        Row: {
          id: string;
          is_primary: boolean;
          language: string;
          sort_order: number;
          translation: string;
          vocabulary_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          is_primary?: boolean;
          language?: string;
          sort_order?: number;
          translation: string;
          vocabulary_id: string;
        };
        Update: {
          id?: string;
          is_primary?: boolean;
          language?: string;
          sort_order?: number;
          translation?: string;
          vocabulary_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vocabulary_translations_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabulary";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_plan_tier: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["plan_tier"];
      };
      import_vocabulary: { Args: { deck?: Json; items: Json; mode?: string }; Returns: Json };
      record_study_activity: { Args: Record<PropertyKey, never>; Returns: Json };
      vocabulary_category_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bookmarked: number;
          difficult: number;
          due: number;
          learning: number;
          mastered: number;
          total_seen: number;
        }[];
      };
    };
    Enums: {
      ai_message_role: "user" | "assistant" | "system";
      ai_scenario:
        | "beginner"
        | "everyday"
        | "travel"
        | "workplace"
        | "interview"
        | "advanced"
        | "writing_correction";
      announcement_audience:
        | "everyone"
        | "students"
        | "free"
        | "premium"
        | "premium_plus"
        | "staff";
      app_role: "student" | "teacher" | "admin";
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      exercise_type:
        | "grammar_practice"
        | "grammar_quiz"
        | "sentence_builder"
        | "listening"
        | "story_comprehension"
        | "vocabulary_quiz"
        | "lesson_quiz"
        | "assignment"
        | "exam_prep"
        | "reading";
      german_article: "der" | "die" | "das";
      import_status: "pending" | "validated" | "imported" | "failed";
      language_skill: "reading" | "listening" | "writing" | "speaking" | "grammar" | "vocabulary";
      listening_kind: "sentences" | "audio_file" | "youtube" | "dialogue";
      part_of_speech:
        | "noun"
        | "verb"
        | "adjective"
        | "adverb"
        | "pronoun"
        | "preposition"
        | "conjunction"
        | "article"
        | "numeral"
        | "interjection"
        | "particle"
        | "phrase";
      payment_provider: "manual" | "razorpay" | "stripe";
      plan_tier: "free" | "premium" | "premium_plus";
      question_type:
        | "multiple_choice"
        | "fill_blank"
        | "reorder_words"
        | "translate_en_de"
        | "translate_de_en"
        | "article_select"
        | "verb_conjugation"
        | "sentence_completion"
        | "free_text"
        | "true_false"
        | "match_vocabulary"
        | "listening_comprehension"
        | "reading_comprehension";
      review_rating: "again" | "hard" | "good" | "easy";
      srs_state: "new" | "learning" | "review" | "relearning";
      study_direction: "de_en" | "en_de";
      subscription_status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
      verb_auxiliary: "haben" | "sein";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      ai_message_role: ["user", "assistant", "system"],
      ai_scenario: [
        "beginner",
        "everyday",
        "travel",
        "workplace",
        "interview",
        "advanced",
        "writing_correction",
      ],
      announcement_audience: ["everyone", "students", "free", "premium", "premium_plus", "staff"],
      app_role: ["student", "teacher", "admin"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      exercise_type: [
        "grammar_practice",
        "grammar_quiz",
        "sentence_builder",
        "listening",
        "story_comprehension",
        "vocabulary_quiz",
        "lesson_quiz",
        "assignment",
        "exam_prep",
        "reading",
      ],
      german_article: ["der", "die", "das"],
      import_status: ["pending", "validated", "imported", "failed"],
      language_skill: ["reading", "listening", "writing", "speaking", "grammar", "vocabulary"],
      listening_kind: ["sentences", "audio_file", "youtube", "dialogue"],
      part_of_speech: [
        "noun",
        "verb",
        "adjective",
        "adverb",
        "pronoun",
        "preposition",
        "conjunction",
        "article",
        "numeral",
        "interjection",
        "particle",
        "phrase",
      ],
      payment_provider: ["manual", "razorpay", "stripe"],
      plan_tier: ["free", "premium", "premium_plus"],
      question_type: [
        "multiple_choice",
        "fill_blank",
        "reorder_words",
        "translate_en_de",
        "translate_de_en",
        "article_select",
        "verb_conjugation",
        "sentence_completion",
        "free_text",
        "true_false",
        "match_vocabulary",
        "listening_comprehension",
        "reading_comprehension",
      ],
      review_rating: ["again", "hard", "good", "easy"],
      srs_state: ["new", "learning", "review", "relearning"],
      study_direction: ["de_en", "en_de"],
      subscription_status: ["trialing", "active", "past_due", "cancelled", "expired"],
      verb_auxiliary: ["haben", "sein"],
    },
  },
} as const;
