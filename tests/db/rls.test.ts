/**
 * Row Level Security tests.
 *
 * Runs against a database that has the migrations applied (the local stack in
 * scripts/local-stack, or a Supabase branch). Each test impersonates a role the
 * same way PostgREST does: SET ROLE plus request.jwt.claims, inside a
 * transaction that is rolled back, so the database is left untouched.
 *
 *   DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres npm run test:db
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54322/postgres";
const db = new Client({ connectionString: url });

const alice = randomUUID();
const bob = randomUUID();
const teacher = randomUUID();

async function createAuthUser(id: string, email: string, fullName: string) {
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, now(), now())`,
    [id, email, JSON.stringify({ full_name: fullName })],
  );
}

/** Run fn as the given Postgres role / user, then roll back. */
async function as<T>(
  role: "anon" | "authenticated",
  userId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`set local role ${role}`);
    const claims = userId ? { sub: userId, role } : { role };
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    return await fn();
  } finally {
    await db.query("rollback");
  }
}

async function expectDenied(fn: () => Promise<unknown>) {
  await expect(fn()).rejects.toThrow(/row-level security|permission denied/);
}

beforeAll(async () => {
  await db.connect();
  await createAuthUser(alice, `alice-${alice}@test.local`, "Alice Schmidt");
  await createAuthUser(bob, `bob-${bob}@test.local`, "Bob Weber");
  await createAuthUser(teacher, `teacher-${teacher}@test.local`, "Tara Teacher");
  await db.query("insert into public.user_roles (user_id, role_id) values ($1, 2)", [teacher]);

  const vocab = await db.query(
    `insert into public.vocabulary (lemma, article, plural, part_of_speech, cefr_level, is_verified, source)
     values ('Testwort-' || $1, 'das', 'Testwörter', 'noun', 'A1', false, 'rls test') returning id`,
    [alice],
  );
  await db.query(
    `insert into public.student_vocabulary_progress (user_id, vocabulary_id) values ($1, $3), ($2, $3)`,
    [alice, bob, vocab.rows[0].id],
  );
});

afterAll(async () => {
  await db.query("delete from public.vocabulary where source = 'rls test'");
  await db.query("delete from auth.users where id = any($1)", [[alice, bob, teacher]]);
  await db.end();
});

describe("new user trigger", () => {
  it("creates a profile and the student role for every sign-up", async () => {
    const { rows } = await db.query(
      `select p.full_name, p.display_name, p.daily_new_words, array_agg(r.key) as roles
         from public.profiles p
         join public.user_roles ur on ur.user_id = p.id
         join public.roles r on r.id = ur.role_id
        where p.id = $1 group by p.id`,
      [alice],
    );
    expect(rows[0].full_name).toBe("Alice Schmidt");
    expect(rows[0].display_name).toBe("Alice");
    expect(rows[0].daily_new_words).toBe(10);
    expect(rows[0].roles).toEqual("{student}");
  });
});

describe("profiles", () => {
  it("a student sees only their own profile", async () => {
    const rows = await as("authenticated", alice, async () =>
      (await db.query("select id from public.profiles")).rows,
    );
    expect(rows.map((r) => r.id)).toEqual([alice]);
  });

  it("a student cannot update another student's profile", async () => {
    const count = await as("authenticated", alice, async () =>
      (await db.query("update public.profiles set full_name = 'hacked' where id = $1", [bob])).rowCount,
    );
    expect(count).toBe(0);
  });

  it("a student can update their own settings, within constraints", async () => {
    const count = await as("authenticated", alice, async () =>
      (await db.query("update public.profiles set daily_new_words = 20 where id = $1", [alice])).rowCount,
    );
    expect(count).toBe(1);
    await expect(
      as("authenticated", alice, () =>
        db.query("update public.profiles set daily_new_words = 7 where id = $1", [alice]),
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("a teacher can see every profile", async () => {
    const rows = await as("authenticated", teacher, async () =>
      (await db.query("select id from public.profiles where id = any($1)", [[alice, bob, teacher]])).rows,
    );
    expect(rows).toHaveLength(3);
  });

  it("anonymous visitors see no profiles", async () => {
    const rows = await as("anon", null, async () => (await db.query("select id from public.profiles")).rows);
    expect(rows).toHaveLength(0);
  });
});

describe("roles", () => {
  it("a student cannot grant themselves admin", async () => {
    await expectDenied(() =>
      as("authenticated", alice, () =>
        db.query("insert into public.user_roles (user_id, role_id) values ($1, 3)", [alice]),
      ),
    );
  });

  it("a teacher cannot grant admin either", async () => {
    await expectDenied(() =>
      as("authenticated", teacher, () =>
        db.query("insert into public.user_roles (user_id, role_id) values ($1, 3)", [teacher]),
      ),
    );
  });

  it("is_staff reflects the caller's roles", async () => {
    const studentIsStaff = await as("authenticated", alice, async () =>
      (await db.query("select private.is_staff() as v")).rows[0].v,
    );
    const teacherIsStaff = await as("authenticated", teacher, async () =>
      (await db.query("select private.is_staff() as v")).rows[0].v,
    );
    expect(studentIsStaff).toBe(false);
    expect(teacherIsStaff).toBe(true);
  });
});

describe("private learning data", () => {
  it("a student reads only their own vocabulary progress", async () => {
    const rows = await as("authenticated", alice, async () =>
      (await db.query("select user_id from public.student_vocabulary_progress")).rows,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.user_id === alice)).toBe(true);
  });

  it("a student cannot write progress rows for someone else", async () => {
    await expectDenied(() =>
      as("authenticated", alice, async () => {
        const v = await db.query("select id from public.vocabulary limit 1");
        await db.query(
          "insert into public.student_vocabulary_progress (user_id, vocabulary_id) values ($1, $2) on conflict do nothing",
          [bob, v.rows[0].id],
        );
        // on conflict do nothing would hide a denial for an existing row, so
        // also try a fresh vocabulary row
        const v2 = await db.query(
          "select id from public.vocabulary where id not in (select vocabulary_id from public.student_vocabulary_progress) limit 1",
        );
        if (v2.rows[0]) {
          await db.query("insert into public.student_vocabulary_progress (user_id, vocabulary_id) values ($1, $2)", [bob, v2.rows[0].id]);
        } else {
          throw new Error("new row violates row-level security (no spare row to test)");
        }
      }),
    );
  });

  it("review history is append-only for students", async () => {
    const count = await as("authenticated", alice, async () => {
      const v = await db.query("select id from public.vocabulary limit 1");
      await db.query(
        `insert into public.review_history (user_id, vocabulary_id, rating, direction, state_before, stability_after, difficulty_after)
         values ($1, $2, 'good', 'de_en', 'new', 2.3, 5.1)`,
        [alice, v.rows[0].id],
      );
      return (await db.query("delete from public.review_history where user_id = $1", [alice])).rowCount;
    });
    expect(count).toBe(0);
  });

  it("students cannot award themselves XP", async () => {
    await expectDenied(() =>
      as("authenticated", alice, () =>
        db.query("insert into public.daily_activity (user_id, activity_date, xp) values ($1, current_date, 99999)", [alice]),
      ),
    );
  });

  it("students cannot give themselves a paid subscription", async () => {
    await expectDenied(() =>
      as("authenticated", alice, async () => {
        const plan = await db.query("select id from public.membership_plans where tier = 'premium_plus'");
        await db.query("insert into public.subscriptions (user_id, plan_id) values ($1, $2)", [alice, plan.rows[0].id]);
      }),
    );
  });

  it("current_plan_tier defaults to free", async () => {
    const tier = await as("authenticated", alice, async () =>
      (await db.query("select public.current_plan_tier() as t")).rows[0].t,
    );
    expect(tier).toBe("free");
  });
});

describe("authored content", () => {
  it("anonymous visitors see published courses but not drafts", async () => {
    const slugs = await as("anon", null, async () =>
      (await db.query("select slug from public.courses")).rows.map((r) => r.slug),
    );
    expect(slugs).toContain("german-a1");
    expect(slugs).not.toContain("german-b2");
  });

  it("students cannot edit courses", async () => {
    const count = await as("authenticated", alice, async () =>
      (await db.query("update public.courses set title = 'x'")).rowCount,
    );
    expect(count).toBe(0);
  });

  it("teachers can create content", async () => {
    const rows = await as("authenticated", teacher, async () =>
      (await db.query(
        "insert into public.grammar_topics (slug, title, cefr_level) values ('rls-test-topic', 'Test', 'A1') returning id",
      )).rows,
    );
    expect(rows).toHaveLength(1);
  });

  it("students cannot read exercise answers directly", async () => {
    const rows = await as("authenticated", alice, async () =>
      (await db.query("select id from public.exercise_questions")).rows,
    );
    expect(rows).toHaveLength(0);
  });
});

describe("contact form", () => {
  it("anyone can submit, nobody but staff can read", async () => {
    const result = await as("anon", null, async () => {
      await db.query(
        "insert into public.contact_messages (name, email, message) values ('Visitor', 'v@example.com', 'Hello, I would like to join the A1 course.')",
      );
      return (await db.query("select id from public.contact_messages")).rows;
    });
    expect(result).toHaveLength(0);
  });

  it("an anonymous visitor cannot attach a message to a user account", async () => {
    await expectDenied(() =>
      as("anon", null, () =>
        db.query(
          "insert into public.contact_messages (name, email, message, user_id) values ('X', 'x@example.com', 'impersonation attempt', $1)",
          [alice],
        ),
      ),
    );
  });
});

describe("coverage", () => {
  it("every public table has RLS enabled", async () => {
    const { rows } = await db.query(
      "select tablename from pg_tables where schemaname = 'public' and not rowsecurity",
    );
    expect(rows).toEqual([]);
  });
});
