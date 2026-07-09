/**
 * Seed user guides into the MatSide Supabase database.
 * Run with: node scripts/seed-guides.mjs
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
const envPath = join(__dirname, '..', '.env.local');
let env = {};
try {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  console.error('Could not read .env.local');
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env.local (find it in Supabase > Settings > API)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const guides = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'Everything you need to know to set up MatSide and get your team running.',
    icon: 'BookOpen',
    sort_order: 1,
    articles: [
      {
        title: 'What is MatSide?',
        slug: 'what-is-matside',
        excerpt: 'Learn what MatSide does and how it helps your team.',
        sort_order: 1,
        content: `# What is MatSide?

MatSide is a meet management app built specifically for youth wrestling coaches. It replaces clipboards, spreadsheets, and group texts with a single tool that handles everything from roster management to day-of pairings.

## What MatSide helps you do

- **Manage your roster** — Keep wrestler profiles up to date with age, weight, experience, and skill level. Everything is in one place so you are not searching through old spreadsheets on meet day.

- **Host meets** — Create a meet, invite other teams, configure your mat rules, and generate a balanced pairing schedule automatically. The algorithm does the hard work of matching wrestlers fairly by age, weight, experience, and skill.

- **Attend meets** — When another team invites you, confirm which wrestlers are coming, set their availability, and view the published schedule.

- **Manage a league** — If you run a regional circuit or district program, create a league to coordinate multiple teams, schedule the season, and manage memberships all in one place.

## Who uses MatSide

- **Head coaches and team managers** — The primary users who manage the roster, configure meet settings, and run the pairings screen on meet day.
- **Assistant coaches** — Can be added as co-managers to help with attendance and pairings.
- **League organizers** — District coordinators and club directors who manage the season schedule across many teams.

## How the app is organized

MatSide has two modes:

- **Team Mode** — Your default view. Manage your roster, host meets, attend meets as a guest, and configure team settings.
- **League Mode** — Available if you are a league organizer. Manage league membership, schedule league meets, and view league-wide information.

You can switch between modes using the context switcher at the top of the sidebar.

> **MatSide is free to use.** Create your account and get your team set up in under 10 minutes.

## Related articles

- [Creating Your Account](/guides/getting-started/creating-your-account)
- [Navigating the App](/guides/getting-started/navigating-the-app)
`,
      },
      {
        title: 'Creating Your Account',
        slug: 'creating-your-account',
        excerpt: 'Sign up and create your team in minutes.',
        sort_order: 2,
        content: `# Creating Your Account

Getting started with MatSide takes about five minutes. Here is what to do.

## Step 1: Sign up

1. Go to **matsideapp.com** and click **Get Started**.
2. Enter your **email address** and choose a **password** (at least 8 characters).
3. Click **Create Account**.
4. Check your email for a verification link and click it to confirm your address.

> **Tip:** Use the email address you check most often — this is where meet notifications will be sent.

## Step 2: Create your team

After verifying your email, you are taken to the **Onboarding** screen.

1. Enter your **Team Name** — the full name of your club or school program (e.g., *Lincoln Eagles Wrestling*).
2. Enter your **Abbreviation** — a short code up to 5 characters shown on match cards and schedules (e.g., *LEW*).
3. Choose a **Primary Color** — click the color swatch to open the color picker, or type a hex code. This color appears on your team badge throughout the app.
4. Choose a **Secondary Color** — used as an accent color for your team.
5. Click **Create Team**.

You are taken to your **Dashboard**, which is your home base in MatSide.

## Step 3: Add wrestlers to your roster

Before you can host or attend a meet, you need wrestlers on your roster.

1. Click **Roster** in the left sidebar.
2. Click **Add Wrestler** and fill in each wrestler's details.

See [Adding Wrestlers to Your Roster](/guides/managing-your-roster/adding-wrestlers) for a complete walkthrough.

## Signing in later

To sign back in:

1. Go to **matsideapp.com** and click **Sign In**.
2. Enter your email and password.
3. You are taken directly to your Dashboard.

## Troubleshooting

**I did not receive the verification email.**
Check your spam or junk folder. If it is not there, go back to the sign-in page and click **Resend verification email**.

**I forgot my password.**
On the sign-in page, click **Forgot password?** and enter your email. You will receive a reset link within a few minutes.

## Related articles

- [Navigating the App](/guides/getting-started/navigating-the-app)
- [Adding Wrestlers to Your Roster](/guides/managing-your-roster/adding-wrestlers)
`,
      },
      {
        title: 'Navigating the App',
        slug: 'navigating-the-app',
        excerpt: 'A quick tour of the main sections of MatSide.',
        sort_order: 3,
        content: `# Navigating the App

MatSide is organized around a sidebar that gives you access to every part of the app. Here is a quick tour.

## The sidebar

The sidebar is always visible on the left side of the screen (or accessible via the hamburger menu on mobile). The main sections are:

- **Dashboard** — A summary of your upcoming meets, recent activity, and quick stats.
- **Roster** — Your full wrestler list. Add, edit, and manage wrestler profiles here.
- **Meets** — All meets your team is hosting or attending. This is where you manage pairings on meet day.
- **Settings** — Team configuration, including default matching rules and mat setup.
- **Account** — Your personal profile, email, and password settings.

## The Dashboard

The Dashboard is your starting point each time you open MatSide. It shows:

- **Upcoming Meets** — Meets coming up in the next 30 days, with quick links to Pairings or Attendance.
- **Recent Activity** — A log of recent changes to your roster or meets.
- **Roster Summary** — Total active wrestlers, average weight, and age breakdown.

## The Meets page

The **Meets** page shows all meets associated with your team — both ones you are hosting and ones you have been invited to attend.

Each meet card shows the meet name, date, status, and quick action buttons. Meet statuses are:

- **Draft** — Just created, not yet open for attendance.
- **Registration** — Teams can confirm attendance.
- **Live** — The meet is happening today.
- **Completed** — The meet is over.

## The Roster page

The **Roster** page shows all your active wrestlers in a sortable table. You can filter by name, sort by weight or age, and click any wrestler to edit their profile.

## Settings

The **Settings** page has two sections:

- **Default Matching Rules** — Set your team's default preferences for pairing (age, weight, experience, and skill priority; max matches per wrestler; whether teammates can wrestle each other).
- **Mat Configuration** — Define how many mats you typically use and the wrestler ranges for each mat.

## Switching to League Mode

If you are also a league organizer, you can switch to **League Mode** using the context switcher at the top of the sidebar. League Mode has its own sidebar with sections for Teams, Meet Schedule, Invitations, and League Settings.

## Related articles

- [Creating Your Account](/guides/getting-started/creating-your-account)
- [Managing Your Roster](/guides/managing-your-roster/adding-wrestlers)
`,
      },
      {
        title: 'Inviting Co-Managers to Your Team',
        slug: 'inviting-co-managers',
        excerpt: 'Add assistant coaches and other managers to help run your team.',
        sort_order: 4,
        content: `# Inviting Co-Managers to Your Team

You can add other coaches to your team as **managers** so they can help manage the roster, set attendance, and run pairings. Managers have the same access as you, except they cannot delete the team.

## Steps

1. Click **Settings** in the left sidebar.
2. Scroll to the **Team Members** section.
3. Click **Generate Invite Link**.
4. A unique invite link is created. Click **Copy Link** to copy it.
5. Send the link to the coach you want to add — by text, email, or any other method.

## What happens when they click the link

1. The coach opens the link in their browser.
2. If they do not have a MatSide account, they are prompted to create one first.
3. After signing in, they are automatically added to your team as a **manager**.
4. They will see your team in their sidebar the next time they open MatSide.

## Managing team members

From the **Team Members** section in Settings, you can see all current managers and their roles:

- **Owner** — The person who created the team. Has full access including team deletion.
- **Manager** — Full access except cannot delete the team.

To remove a manager, click the three-dot menu next to their name and select **Remove from Team**.

## Invite link details

- Each invite link is **single-use** by default and **expires after 7 days**.
- If the link expires before the coach uses it, generate a new one.
- The link is specific to one person — do not share it publicly.

> **Tip:** If you have multiple coaches to add, generate a new link for each one. Each link can only be used once.

## Related articles

- [Navigating the App](/guides/getting-started/navigating-the-app)
- [Settings Overview](/guides/getting-started/navigating-the-app)
`,
      },
    ],
  },
  {
    title: 'Managing Your Roster',
    slug: 'managing-your-roster',
    description: 'Add, edit, and organize your wrestlers.',
    icon: 'Users',
    sort_order: 2,
    articles: [
      {
        title: 'Adding Wrestlers to Your Roster',
        slug: 'adding-wrestlers',
        excerpt: 'How to add new wrestlers and fill in their information.',
        sort_order: 1,
        content: `# Adding Wrestlers to Your Roster

Your roster is the foundation of MatSide. Every meet starts with your roster, so keeping it current ensures accurate pairings.

## Adding a single wrestler

1. Click **Roster** in the left sidebar.
2. Click **Add Wrestler** in the top-right corner.
3. Fill in the wrestler's details:

   - **First Name** and **Last Name** — Required.
   - **Date of Birth** — Used to calculate age at the time of each meet. Required.
   - **Weight** — Current weight in pounds. Required. Update this before each meet to reflect weigh-in weight.
   - **Experience** — How many years or seasons the wrestler has competed. See [Understanding Experience and Skill Levels](/guides/managing-your-roster/experience-and-skill-levels) for the scale.
   - **Skill** — A relative rating of the wrestler's competitive level compared to others of similar age and experience. See the linked article for details.

4. Click **Save Wrestler**.

The wrestler appears immediately in your roster list.

## Adding multiple wrestlers at once (Bulk Paste)

If you are setting up a new team or adding many wrestlers at once, use the **Bulk Paste** feature.

1. Click **Roster**, then click the dropdown arrow next to **Add Wrestler**.
2. Select **Bulk Paste**.
3. Paste a list of wrestlers — one per line, with columns for first name, last name, date of birth, and weight (tab-separated or comma-separated).
4. MatSide uses fuzzy matching to interpret the columns. Review the preview and confirm.
5. Click **Import**.

> **Tip:** You can paste directly from a Google Sheet or Excel spreadsheet. Copy the rows from your spreadsheet and paste them into the Bulk Paste dialog.

## What each field is used for

| Field | How it is used |
|---|---|
| Date of Birth | Age is calculated per-meet. Pairings respect the max age difference setting. |
| Weight | Weight matching. Pairings respect the max weight difference setting. |
| Experience | Used as a pairing factor. Wrestlers with similar experience are preferred. |
| Skill | Used as a pairing factor. Gives you control over competitive balance beyond raw experience. |

## After adding wrestlers

- Wrestlers start as **Active** by default and will appear in attendance lists for meets.
- You can edit any wrestler's details at any time by clicking their name in the roster.

## Related articles

- [Editing Wrestler Information](/guides/managing-your-roster/editing-wrestler-information)
- [Understanding Experience and Skill Levels](/guides/managing-your-roster/experience-and-skill-levels)
`,
      },
      {
        title: 'Editing Wrestler Information',
        slug: 'editing-wrestler-information',
        excerpt: 'Keep wrestler profiles up to date with current weight, age, and skill level.',
        sort_order: 2,
        content: `# Editing Wrestler Information

Keeping wrestler profiles current — especially weight — is important for accurate pairings. Here is how to update wrestler details.

## Editing a single wrestler

1. Click **Roster** in the left sidebar.
2. Find the wrestler in the list. Use the search bar to find them quickly by name.
3. Click the wrestler's **name** or the **edit icon** (pencil) on their row.
4. The edit panel opens on the right side of the screen.
5. Update any fields you need to change.
6. Click **Save**.

Changes take effect immediately and will be reflected in all future pairings.

## Updating weights before a meet

Weight is the most important field to keep current. Pairing accuracy depends on wrestlers' weights being close to their actual weigh-in weight.

Best practice:
- Update weights in the roster after your team's weigh-ins, before the meet.
- If weigh-in weights are recorded on the day of the meet (e.g., via a host team's scale), you or the host can record the official weigh-in weight in the **Attendance** panel on meet day — this weigh-in weight is used for pairings if available.

## Updating experience and skill

It is worth reviewing your wrestlers' experience and skill ratings at the start of each season:

- Increase **experience** by one when a wrestler completes a season.
- Adjust **skill** based on how the wrestler is performing relative to teammates of similar age and experience.

See [Understanding Experience and Skill Levels](/guides/managing-your-roster/experience-and-skill-levels) for the full scale.

## Archiving a wrestler

If a wrestler is no longer active (graduated, moved, or injured for the season), you can archive them:

1. Open the wrestler's edit panel.
2. Change their **Status** to **Archived** (or click the archive icon).
3. Save.

Archived wrestlers are hidden from the roster list by default and will not appear in attendance lists. They are not deleted — you can restore them later if needed. To view archived wrestlers, toggle the **Show Archived** filter on the Roster page.

## Troubleshooting

**The wrestler's weight is not updating in pairings.**
Make sure you saved the change (a toast message should confirm). If weigh-in weights were recorded in the Attendance panel for a specific meet, those override the roster weight for that meet's pairings.

## Related articles

- [Adding Wrestlers to Your Roster](/guides/managing-your-roster/adding-wrestlers)
- [Understanding Experience and Skill Levels](/guides/managing-your-roster/experience-and-skill-levels)
`,
      },
      {
        title: 'Understanding Experience and Skill Levels',
        slug: 'experience-and-skill-levels',
        excerpt: 'Learn what the experience (0-5) and skill (0-4) ratings mean and how they affect pairings.',
        sort_order: 3,
        content: `# Understanding Experience and Skill Levels

MatSide uses two separate ratings to describe a wrestler beyond their age and weight: **experience** and **skill**. Understanding the difference helps you rate your wrestlers accurately, which leads to fairer pairings.

## Experience (0–5)

Experience is an objective measure of how long a wrestler has been competing.

| Value | Meaning |
|---|---|
| 0 | First year / brand new to wrestling |
| 1 | 1 full season completed |
| 2 | 2 seasons completed |
| 3 | 3 seasons completed |
| 4 | 4 seasons completed |
| 5 | Veteran — 5 or more seasons |

**How to set experience:** Count the number of full competitive seasons the wrestler has completed. A kid in their first year is 0. After their first full season, they become 1. This goes up by 1 each year up to 5.

## Skill (0–4)

Skill is a *relative* rating of how competitive the wrestler is compared to other wrestlers of similar age and experience. It is a judgment call by the coach.

| Value | Meaning |
|---|---|
| 0 | Below average for their age/experience group |
| 1 | Average |
| 2 | Above average |
| 3 | Strong competitor |
| 4 | Elite / standout for their division |

**How to set skill:** Think of it as: *compared to other 8-year-olds with 2 years of experience, where does this kid rank?* A kid who consistently wins at local tournaments is probably a 3 or 4. A kid who struggles to take a shot is probably a 0 or 1.

> **Skill is relative, not absolute.** A skill-4 six-year-old in their second season is not necessarily stronger than a skill-1 twelve-year-old in their fourth season. The ratings are used to find good matches *within* similar age and experience brackets.

## How experience and skill affect pairings

The pairing algorithm uses both ratings as factors when scoring potential matches. In your **Settings**, you can configure:

- **Matching Priority** — Rank age, weight, experience, and skill in order of importance (1 = most important). The default priority is: age first, then weight, then experience, then skill.
- **Max Age Difference** — Pairings outside this range are penalized or excluded.

Wrestlers with similar experience and skill within the same age bracket will be preferred matches. The algorithm aims to maximize fairness across all these dimensions simultaneously.

## Tips for rating your wrestlers

- **Be consistent** — If you rate experience by seasons, use the same definition across all wrestlers.
- **Review at the start of each season** — Bump experience by 1 for every wrestler who completed the previous season. Reassess skill ratings based on how they performed.
- **Do not overthink skill** — A rough rating is better than no rating. You can always adjust after a few meets.

## Related articles

- [Adding Wrestlers to Your Roster](/guides/managing-your-roster/adding-wrestlers)
- [Configuring Pairing Settings](/guides/hosting-a-meet/configuring-pairing-settings)
`,
      },
    ],
  },
  {
    title: 'Hosting a Meet',
    slug: 'hosting-a-meet',
    description: 'Step-by-step guide to creating and running a meet at your gym.',
    icon: 'Trophy',
    sort_order: 3,
    articles: [
      {
        title: 'Creating a Meet',
        slug: 'creating-a-meet',
        excerpt: 'Set up a new meet with date, time, location, and initial settings.',
        sort_order: 1,
        content: `# Creating a Meet

When you host a meet at your gym, you create it in MatSide and then invite guest teams. Here is how to get started.

## Steps

1. Click **Meets** in the left sidebar.
2. Click **Create Meet** in the top-right corner.
3. Fill in the meet details:

   - **Meet Name** — A clear name that identifies the event (e.g., *Lincoln Eagles Spring Invitational* or *Home Meet #3*).
   - **Date** — Select the meet date.
   - **Time** — Optionally add a start time so guest teams and families know when to arrive.
   - **Location Address** — The gym address. This appears in the guest teams' meet details view.
   - **Location Notes** — Any additional directions or entry instructions (e.g., *Enter through the side gym door. Parking on Oak Street.*).
   - **Number of Mats** — How many mats will be in use. This sets up the initial mat configuration.
   - **Notes** — Any other information for participating coaches (e.g., weigh-in time, concessions, parking).

4. Click **Create Meet**.

You are taken to the **Meet Detail** view where you can invite teams and configure pairing settings.

## Meet status

New meets start in **Draft** status. Change the status as the meet progresses:

- **Draft** → **Registration** when you are ready for teams to confirm attendance.
- **Registration** → **Live** on the day of the meet.
- **Live** → **Completed** when the meet is over.

You can change the status from the Meet Detail view using the status selector at the top.

## After creating the meet

Next steps:

1. **Invite guest teams** — See [Inviting Guest Teams](/guides/hosting-a-meet/inviting-guest-teams).
2. **Configure mat rules** — Set wrestler ranges for each mat. See [Configuring Mat Rules](/guides/hosting-a-meet/configuring-mat-rules).
3. **Review pairing settings** — Confirm the matching rules are correct. See [Configuring Pairing Settings](/guides/hosting-a-meet/configuring-pairing-settings).

## Troubleshooting

**I do not see the Create Meet button.**
Make sure you are in **Team Mode** (not League Mode). The Create Meet button is on the Meets page in Team Mode. If you are a league organizer, use the League Mode Meet Schedule to schedule league meets.

## Related articles

- [Inviting Guest Teams](/guides/hosting-a-meet/inviting-guest-teams)
- [Configuring Mat Rules](/guides/hosting-a-meet/configuring-mat-rules)
- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
`,
      },
      {
        title: 'Inviting Guest Teams',
        slug: 'inviting-guest-teams',
        excerpt: 'Send invitations to other teams and track their RSVPs.',
        sort_order: 2,
        content: `# Inviting Guest Teams

After creating a meet, you invite the teams you want to participate. Guest teams receive the invitation and confirm their attendance with a list of wrestlers.

## Steps

1. Click **Meets** in the left sidebar and open the meet you want to manage.
2. Click **Invite Teams** or find the **Guest Teams** section.
3. Enter the **team name** or browse available teams. You can search by team name or abbreviation.
4. Click **Send Invitation** for each team you want to invite.

The invited team receives a notification and the meet appears in their **Meets** list with an **Invited** status.

## Tracking RSVPs

In the **Guest Teams** section, you can see each team's status:

- **Invited** — Invitation sent, no response yet.
- **Confirmed** — Team has confirmed they are attending. They have opened their Attendance panel.
- **Declined** — Team cannot make the meet.

A team is automatically moved to **Confirmed** status when they open the Attendance panel for your meet.

## Changing the meet status to Registration

Once you have invited your guest teams, advance the meet status to **Registration** to signal that attendance confirmation is open.

1. Open the meet.
2. Click the status selector and choose **Registration**.

This does not change anything functionally, but it signals to guest teams that you are actively collecting attendance.

## Setting the meet to Live

On the day of the meet, advance the status to **Live**. This is a signal — it does not lock anything or prevent changes. You can still update attendance and regenerate pairings while a meet is Live.

## Removing a team from the meet

If a team cancels after being invited:

1. Open the meet's Guest Teams section.
2. Find the team and click the three-dot menu.
3. Select **Remove from Meet**.

> **Note:** If you remove a team after pairings have been generated, their wrestlers' matches will remain in the schedule. You will need to regenerate pairings to remove them.

## Related articles

- [Creating a Meet](/guides/hosting-a-meet/creating-a-meet)
- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
`,
      },
      {
        title: 'Configuring Mat Rules',
        slug: 'configuring-mat-rules',
        excerpt: 'Set up each mat with age, experience, and skill ranges to route wrestlers correctly.',
        sort_order: 3,
        content: `# Configuring Mat Rules

Mat rules tell the pairing algorithm which wrestlers belong on each mat. By setting age, experience, and skill ranges per mat, you can ensure that beginners and veterans are not competing on the same mat.

## Understanding mat rules

Each mat has three range settings:

- **Age Range** — Minimum and maximum age for wrestlers assigned to this mat.
- **Experience Range** — Minimum and maximum experience level (0–5).
- **Skill Range** — Minimum and maximum skill level (0–4).
- **Max Matches** — The maximum number of matches that can be scheduled on this mat.

Wrestlers whose age, experience, and skill all fall within the mat's ranges are **eligible** for that mat.

## Setting mat rules for a specific meet

1. Open the meet in **Meets**.
2. Click **Mat Rules** or find the **Mat Configuration** section in the meet settings.
3. For each mat, set the ranges.
4. Click **Save**.

## Setting default mat rules for your team

You can configure default mat rules in your team settings that will pre-populate every new meet you create.

1. Click **Settings** in the left sidebar.
2. Scroll to **Mat Configuration**.
3. Add mats and set the default ranges for each.
4. Click **Save**.

When you create a new meet and set the number of mats, the defaults are applied automatically. You can always override them for a specific meet.

## Example setup (3 mats)

| Mat | Age | Experience | Skill | Description |
|---|---|---|---|---|
| Mat 1 | 4–8 | 0–2 | 0–4 | Young/beginner wrestlers |
| Mat 2 | 8–12 | 0–3 | 0–4 | Mid-level wrestlers |
| Mat 3 | 10–18 | 2–5 | 0–4 | Experienced/older wrestlers |

Note that age ranges can overlap. A 10-year-old with 2 years of experience is eligible for either Mat 2 or Mat 3 in this setup — the algorithm picks the best mat based on available opponents.

## What happens when a wrestler does not fit any mat

If a wrestler's profile does not match any mat's rules, they will show up as **unmatched** in the pairings screen. Adjust the mat rules or the wrestler's profile to resolve this.

> **Tip:** When in doubt, set wider ranges. It is better for a wrestler to be eligible for multiple mats than to be excluded from all of them.

## Related articles

- [Configuring Pairing Settings](/guides/hosting-a-meet/configuring-pairing-settings)
- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
`,
      },
      {
        title: 'Configuring Pairing Settings',
        slug: 'configuring-pairing-settings',
        excerpt: 'Customize how the algorithm prioritizes age, weight, experience, and skill when generating matches.',
        sort_order: 4,
        content: `# Configuring Pairing Settings

Pairing settings control how the algorithm scores and selects matches. You can tune them to match your event's style and the ages and experience levels of the participating wrestlers.

## Where to find pairing settings

- **For a specific meet:** Open the meet, then click **Meet Rules** or the settings icon in the Pairings screen.
- **Team defaults:** Click **Settings** in the sidebar. Your defaults apply to every new meet you create.

## Matching priority

The algorithm factors in four attributes when scoring a potential match:

- **Age** — How close in age the two wrestlers are.
- **Weight** — How close in weight.
- **Experience** — How close in experience level.
- **Skill** — How close in skill level.

You assign each factor a priority rank (1–4, where 1 is most important). The default is: **Age (1) → Weight (2) → Experience (3) → Skill (4)**.

**Example:** If you are running a developmental meet for beginners, you might put **Experience** first to avoid putting veterans against first-year wrestlers, even if age and weight match well.

## Max matches per wrestler

The maximum number of matches each wrestler can be scheduled for. Default is **4**. Increase this for more activity-focused meets, decrease it if wrestlers are very young or the schedule is tight.

## Max age difference

The maximum age gap allowed between two wrestlers in a match. Default is **1 year**. The algorithm will not pair wrestlers who are more than this many years apart.

> Setting this to 0 requires exact age matches, which may result in some wrestlers being unmatched. Setting it to 2 or more gives the algorithm more flexibility, especially at smaller meets.

## Teammates can wrestle

By default, wrestlers from the same team **cannot** be paired against each other. Enable this setting if you want to allow intra-squad matches.

When enabled, a secondary setting appears: **Prefer cross-team matches** — when checked, same-team pairings are scored lower than cross-team pairings, so the algorithm uses them only when no good cross-team match is available.

## Max weight difference

An optional hard cap on the weight difference between paired wrestlers (in pounds). Pairs that exceed this limit are simply not eligible, regardless of other factors. Leave this blank for no hard cap.

## Related articles

- [Configuring Mat Rules](/guides/hosting-a-meet/configuring-mat-rules)
- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
- [Understanding Experience and Skill Levels](/guides/managing-your-roster/experience-and-skill-levels)
`,
      },
      {
        title: 'Generating Pairings',
        slug: 'generating-pairings',
        excerpt: 'Use the automatic pairing generator to create a fair, balanced match schedule.',
        sort_order: 5,
        content: `# Generating Pairings

The pairing generator is the core of MatSide. With one click, it analyzes all confirmed wrestlers from all attending teams and produces a balanced match schedule. Here is how to use it.

## Before generating

Make sure:

1. **All guest teams have confirmed attendance** — Each team's wrestlers should be set to Attending, Not Attending, or another status. Unconfirmed wrestlers trigger a warning.
2. **Mat rules are configured** — The algorithm uses mat rules to determine which wrestlers belong on which mat.
3. **Pairing settings are correct** — Review matching priority, max age difference, and max matches per wrestler.

## Steps

1. Click **Meets** in the left sidebar.
2. Click **Pairings** on the meet.
3. Review the attendance summary at the top. Each team shows a wrestler count and a badge for any unconfirmed wrestlers.
4. Click **Generate Pairings**.
5. A loading indicator appears while the algorithm runs. This usually completes in seconds.
6. The match schedule appears organized by mat.

## Reviewing the results

After generation:

- Check the **Flags** counter in the stats bar. A non-zero flag count means some wrestlers have zero matches (critical) or too few/many matches (warning).
- Review flagged wrestlers using the **View by Wrestler** tab.
- If the results look off, check your mat rules and pairing settings, then click **Regenerate**.

> **Warning:** Regenerating pairings clears all existing matches and results. Only regenerate before the meet starts. During the meet, use **Add new wrestlers** for late arrivals and the **scratch workflow** for withdrawals.

## The Generation Report

After each generation, a **Generation Report** is available. It summarizes:

- How many matches were scheduled per team.
- How many wrestlers have 0, 1, 2, 3, or 4+ matches.
- Match quality distribution (Great / Good / Fair).
- Flags and warnings.

Click **View Report** in the pairings status bar to open it.

## Publishing the schedule

When you are satisfied with the pairings, click **Publish** to make the schedule visible on the public meet link. See [Sharing the Meet Schedule](/guides/hosting-a-meet/sharing-the-meet-schedule) for details.

## Related articles

- [Configuring Mat Rules](/guides/hosting-a-meet/configuring-mat-rules)
- [Configuring Pairing Settings](/guides/hosting-a-meet/configuring-pairing-settings)
- [Sharing the Meet Schedule](/guides/hosting-a-meet/sharing-the-meet-schedule)
`,
      },
      {
        title: 'Sharing the Meet Schedule',
        slug: 'sharing-the-meet-schedule',
        excerpt: 'Publish and share the match schedule with coaches and families.',
        sort_order: 6,
        content: `# Sharing the Meet Schedule

Once pairings are generated, you can publish the schedule and share a link with coaches, wrestlers, and families. No MatSide account is required to view the public schedule.

## Publishing the schedule

1. From the **Pairings** screen, click the **Publish** button in the status bar.
2. The pairings status changes from **Planned** to **Published** (shown as a green badge).
3. A **Copy Link** button appears in the status bar.

## Sharing the link

1. Click **Copy Link** to copy the shareable URL.
2. Paste it in a text message group chat, email, or any other channel you use to communicate with wrestlers and families.

The public link opens a read-only view of the match schedule organized by mat. Viewers see:

- Mat-by-mat match list.
- Wrestler names, team abbreviations, age, weight, experience, and skill.
- Match quality badges.

No login is required. The link works on any phone or computer.

## Updating after publishing

If you regenerate pairings after publishing:

1. The status resets to **Planned**.
2. You need to click **Publish** again to make the updated schedule visible.
3. The public link URL stays the same — anyone who has the link will automatically see the updated schedule after you re-publish.

## Printing the schedule

On the public schedule page, use your browser's print function (Ctrl+P / Cmd+P) to print the full schedule. The page is formatted for printing — use **Landscape** orientation for best results with multiple mats.

## Revoking access

If you need to take the schedule offline (for example, if there is a significant change before the meet), change the meet status to **Draft**. The public link will show a "Schedule not yet available" message until you re-publish.

> **Tip:** Share the link the evening before the meet so families can check what mat and match number to watch for. Include the meet address and start time in your message.

## Related articles

- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
- [Viewing the Public Meet Schedule](/guides/attending-a-meet/viewing-public-meet-schedule)
`,
      },
    ],
  },
  {
    title: 'Attending a Meet',
    slug: 'attending-a-meet',
    description: "How to manage your team's participation in a meet hosted by another club.",
    icon: 'Calendar',
    sort_order: 4,
    articles: [
      {
        title: 'Accepting a Meet Invitation',
        slug: 'accepting-a-meet-invitation',
        excerpt: "How to confirm your team's attendance when you receive a meet invitation.",
        sort_order: 1,
        content: `# Accepting a Meet Invitation

When another team invites your team to a meet, the meet appears in your **Meets** page in MatSide. Accepting the invitation is simple — you just open the Attendance panel.

## How to confirm your team's attendance

1. Click **Meets** in the left sidebar.
2. Look in the **Upcoming Meets** list. You will see the meet with the host team's name listed.
3. Click **Attendance** on the meet card.
4. The **Attendance** panel opens. Opening this panel automatically changes your team's participation status from **Invited** to **Confirmed**.
5. Set the attendance status for each wrestler. See [Setting Wrestler Availability](/guides/attending-a-meet/setting-wrestler-availability) for details.
6. Click **Done** when finished.

You are all set. The host team can now see your attendance in their Pairings screen.

## What if I cannot find the meet invitation?

If a meet was created by the host team but you do not see it in your list:

- Confirm you are logged into the correct MatSide account (the same one the host team invited).
- Ask the host team to confirm they invited the right team.
- Try refreshing the page.

## Viewing meet details

To see the location, time, and notes for a meet:

1. Find the meet in your Upcoming Meets list.
2. Click **Details**.
3. The **Meet Details** panel shows the date, time, address, location notes, and any general notes from the host.

> **Tip:** Share the meet details with your wrestlers' parents early so they have the date, time, and directions. Once the host publishes pairings, you can also share the public schedule link.

## Related articles

- [Setting Wrestler Availability](/guides/attending-a-meet/setting-wrestler-availability)
- [Viewing the Public Meet Schedule](/guides/attending-a-meet/viewing-public-meet-schedule)
`,
      },
      {
        title: 'Setting Wrestler Availability',
        slug: 'setting-wrestler-availability',
        excerpt: 'Mark each wrestler as attending, not attending, arriving late, or leaving early.',
        sort_order: 2,
        content: `# Setting Wrestler Availability

Before pairings are generated, the host team needs to know which wrestlers from your team are actually coming. Setting attendance in MatSide lets the pairing algorithm only schedule matches for wrestlers who will be there.

## Steps to set wrestler availability

1. Click **Meets** in the left sidebar.
2. Find the meet in your **Upcoming Meets** list.
3. Click **Attendance**.
4. For each wrestler on your roster, use the **dropdown** to set their status:
   - **Attending** — Wrestler will be there for the full meet.
   - **Not Attending** — Wrestler will not be coming. They will not be included in pairings.
   - **Arriving Late** — Wrestler will arrive after the meet starts. They will still be included in pairings.
   - **Leaving Early** — Wrestler has to leave before the meet ends. They will still be included in pairings.
   - **Unconfirmed** — You have not heard back yet. Unconfirmed wrestlers show as a warning on the host's Pairings screen.
5. Click **Done** when you have set everyone.

## Marking everyone at once

If most or all of your team is coming, click **Mark All Attending** at the top of the attendance panel. This sets every wrestler to Attending in one click. You can then change the few who are not coming individually.

## Updating attendance before meet day

You can update attendance any time before or on meet day. Simply open the Attendance panel again and make changes.

> **Important:** If a wrestler confirms at the last minute, update their status before pairings are generated. If pairings have already been generated, the host can run **Add new wrestlers** to include them without regenerating everything.

## What happens to unconfirmed wrestlers

Unconfirmed wrestlers are treated cautiously by the algorithm. The host team sees a warning banner if any wrestlers are still unconfirmed when they generate pairings.

## Troubleshooting

**Problem:** A wrestler is not showing in my attendance list.
**Solution:** The wrestler must be on your active roster to appear. Check the Roster page and confirm the wrestler's status is **active** (not archived).

## Related articles

- [Accepting a Meet Invitation](/guides/attending-a-meet/accepting-a-meet-invitation)
- [Confirming Attendance on Meet Day](/guides/meet-day/confirming-attendance-meet-day)
`,
      },
      {
        title: 'Viewing the Public Meet Schedule',
        slug: 'viewing-public-meet-schedule',
        excerpt: 'Access the shareable meet schedule link and share it with parents.',
        sort_order: 3,
        content: `# Viewing the Public Meet Schedule

Once the host team publishes pairings, a public link becomes available. Anyone with the link can view the match schedule — no MatSide account required. This is the easiest way to share the schedule with wrestlers, families, and spectators.

## How to find the public link

If you are a **guest team manager** and want the public link:

1. Click **Meets** in the left sidebar.
2. Find the meet in your list.
3. Click **Pairings** on the meet.
4. If pairings have been published by the host, you will see a **Published** badge in the status bar and a **Copy Link** button.
5. Click **Copy Link** to copy the shareable URL.

Alternatively, ask the host team to send you the link directly.

## What the public schedule shows

The public page displays the full match schedule organized by mat. For each match you can see:

- Match number
- Wrestler names and team abbreviations
- Age, weight, experience, and skill for each wrestler
- Match quality badge (Great / Good / Fair)

The page is read-only. Viewers cannot make any changes.

## Sharing the link with parents

The public link works in any web browser. You can share it by:

- Copying and pasting it into a team group chat (text, WhatsApp, Band, etc.)
- Sending it by email
- Posting it to your team's social media or website

Parents do not need to download anything or create an account. They just tap the link.

## Troubleshooting

**Problem:** The link shows no matches.
**Solution:** The host team may not have published pairings yet. Ask the host to publish the schedule and share the updated link.

**Problem:** I cannot find a Copy Link button on the Pairings screen.
**Solution:** The link is only available after the host team publishes pairings. The pairings must be in **Published** status (shown as a green badge in the status bar).

## Related articles

- [Sharing the Meet Schedule](/guides/hosting-a-meet/sharing-the-meet-schedule)
- [Understanding the Pairings Screen](/guides/meet-day/understanding-pairings-screen)
`,
      },
    ],
  },
  {
    title: 'Meet Day',
    slug: 'meet-day',
    description: 'Everything you need to do on the day of the meet.',
    icon: 'Zap',
    sort_order: 5,
    articles: [
      {
        title: 'Confirming Attendance on Meet Day',
        slug: 'confirming-attendance-meet-day',
        excerpt: 'Mark wrestlers who have arrived and update anyone who won\'t be wrestling.',
        sort_order: 1,
        content: `# Confirming Attendance on Meet Day

Wrestlers who said they were coming sometimes do not show up, and wrestlers who were listed as unavailable sometimes surprise you. Here is how to update attendance on the day of the meet.

## For guest teams: updating your wrestlers

1. Click **Meets** in the left sidebar.
2. Find today's meet.
3. Click **Attendance**.
4. Update the status for any wrestlers whose availability has changed:
   - If someone who was **Attending** cannot make it, change them to **Not Attending**.
   - If someone was **Unconfirmed** and just arrived, change them to **Attending**.
   - If someone is running late, use **Arriving Late** so the host knows.
5. Click **Done**.

The host team sees your updates in real time on their Pairings screen.

## For the host team: monitoring attendance

1. Go to **Meets** and click **Pairings** on today's meet.
2. The team cards at the top of the page show how many wrestlers are confirmed versus unconfirmed for each team.
3. An alert banner appears if any wrestlers are still unconfirmed.

## What to do when a wrestler arrives late

If a wrestler arrives after pairings have already been generated:

1. Update their status to **Attending** (or **Arriving Late**).
2. On the Pairings screen, click **Add new wrestlers** — this runs an incremental generation that adds matches for the newly confirmed wrestler without changing any existing matches.

## What to do when a wrestler cannot wrestle after all

If a wrestler has to scratch from their matches after pairings are set, use the **scratch workflow** — do not just change their attendance status to Not Attending. See [Handling Scratches](/guides/meet-day/handling-scratches) for the proper process.

> **Tip:** Keep MatSide open on your phone during the meet so you can update attendance and view the live schedule as needed.

## Related articles

- [Setting Wrestler Availability](/guides/attending-a-meet/setting-wrestler-availability)
- [Handling Scratches](/guides/meet-day/handling-scratches)
`,
      },
      {
        title: 'Understanding the Pairings Screen',
        slug: 'understanding-pairings-screen',
        excerpt: 'Read the mat-by-mat match schedule and understand match statuses.',
        sort_order: 2,
        content: `# Understanding the Pairings Screen

The Pairings screen is your main view on meet day. It shows every match organized by mat, along with wrestler details, flags, and status indicators. Here is what everything means.

## Getting to the Pairings screen

1. Click **Meets** in the left sidebar.
2. Click **Pairings** on the meet.

## The stats bar

At the top of the Pairings screen, three stat cards give you a quick overview:

- **Matches** — Total number of matches in the schedule.
- **Flagged** — Wrestlers with automatic flags (zero matches, too few matches, or too many matches).
- **Discuss** — Wrestlers that a team manager has manually flagged for discussion.

Below the stats, team badges show each team's abbreviation and how many wrestlers are confirmed attending. A number in orange (e.g., *+3*) means that many wrestlers are still unconfirmed.

## The Matches tab

The **Matches** tab shows the schedule organized by mat number. Each mat card shows:

- **Mat number** and **match count** for that mat.
- Each match listed in order with a **match number** (e.g., #101 = Mat 1, Match 1).
- Both wrestlers listed with name, team abbreviation, age, weight, experience, and skill.
- A **match quality badge**:
  - **Great** (green) — Very similar wrestlers.
  - **Good** (yellow) — Reasonable match.
  - **Fair** (orange) — Noticeably different wrestlers; best available pairing.
- A **Replaced** badge (orange) if one wrestler was substituted after a scratch.
- A **New** badge (blue) if the match was added by an incremental generation during this session.

## The View by Wrestler tab

The **View by Wrestler** tab shows all wrestlers in a sortable table. Columns include:

- **Name, Age, Weight, Exp, Skill** — Wrestler attributes.
- **Team** — Color-coded team badge.
- **Matches** — How many matches this wrestler has in the schedule.
- **Status** — Attendance status.
- **Flag** — A red flag icon for critical issues (zero matches) or yellow for warnings.

Click any wrestler row to expand it and see all of their individual match assignments.

## Flags explained

- **Red flag (critical)** — An attending wrestler has zero matches assigned. This needs fixing before the meet starts.
- **Yellow flag (warning)** — An attending wrestler has fewer than the expected minimum matches, or more than the expected maximum.
- **Orange discussion icon** — A team manager has manually flagged this wrestler for discussion.

## Related articles

- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
- [Handling Scratches](/guides/meet-day/handling-scratches)
- [Recording Match Results](/guides/meet-day/recording-match-results)
`,
      },
      {
        title: 'Handling Scratches',
        slug: 'handling-scratches',
        excerpt: 'What to do when a wrestler has to withdraw — find a substitute match automatically.',
        sort_order: 3,
        content: `# Handling Scratches

A **scratch** happens when a wrestler who was scheduled for matches has to withdraw — due to injury, illness, or weigh-in issues. MatSide has a structured scratch workflow that finds replacement opponents and keeps the rest of the schedule intact.

## How scratches work in MatSide

When a wrestler is scratched, MatSide:

1. Finds the best available replacement opponent from the scratched wrestler's team for each affected match.
2. Submits these as **scratch suggestions** that the host team must approve.
3. Once approved, the schedule updates — the original wrestler's matches are replaced, the rest of the schedule stays the same.

This workflow keeps both teams informed and gives the host coach final approval over any schedule changes.

## For guest teams: submitting a scratch

If one of your wrestlers needs to withdraw after pairings are set:

1. Go to **Meets** and click **Pairings** on the meet.
2. In the **View by Wrestler** tab, find the wrestler who is withdrawing.
3. Click the wrestler's row to expand their match list.
4. Click the **scratch icon** (a person with an X) next to any of their matches.
5. Confirm in the dialog. MatSide shows all affected matches and notes that a substitute will be suggested.
6. Click **Scratch Wrestler**.

The scratch suggestions are sent to the host team for approval. You will see the status update in the Pairings screen once the host reviews them.

## For the host team: approving scratches

When a guest team submits a scratch request:

1. You will see a number badge on the **Approvals** button in the status bar.
2. Click **Approvals** to open the **Approval Queue** panel.
3. For each suggestion, you can see the original match, the wrestler being scratched, and the suggested replacement.
4. Approve or decline each suggestion individually.
5. Approved replacements update the match schedule immediately.

> **Tip:** You can also edit matches directly as the host team. From the View by Wrestler tab, click the pencil icon next to a match to change one wrestler, or the scratch icon to remove a match entirely.

## Troubleshooting

**Problem:** I cannot find the scratch icon.
**Solution:** Scratching is only available after the meet pairings are in **Planned** or **Published** status.

**Problem:** No replacement was suggested for one of the matches.
**Solution:** MatSide could not find a suitable replacement on the scratched wrestler's team. The host team will see the match flagged and can assign a replacement manually.

## Related articles

- [Understanding the Pairings Screen](/guides/meet-day/understanding-pairings-screen)
- [Generating Pairings](/guides/hosting-a-meet/generating-pairings)
`,
      },
      {
        title: 'Recording Match Results',
        slug: 'recording-match-results',
        excerpt: 'Mark wins and losses for each match as they complete.',
        sort_order: 4,
        content: `# Recording Match Results

As matches complete during the meet, you can record the outcome for each match directly in MatSide. This keeps a running record of results and helps coaches track wrestler performance over time.

## Steps to record a result

1. Go to **Meets** and click **Pairings** on the current meet.
2. In the **Matches** tab, find the completed match.
3. Click the **edit icon** (pencil) on the match.
4. In the **Edit Match** panel, find the result section.
5. Select which wrestler won.
6. Save the result.

The match updates immediately in the schedule view.

## Who can record results

- The **host team** can record results for any match at the meet.
- **Guest teams** can record results for matches involving their wrestlers.

## Viewing results

After results are recorded, they are visible in the match detail view. You can see win/loss history for individual wrestlers from the **Roster** page by clicking the wrestler history icon.

## Troubleshooting

**Problem:** I do not see a way to record a result.
**Solution:** Make sure you are a manager or owner for the team involved. Guest team managers can record results for their own wrestlers. The host team can record results for all matches.

**Problem:** A result I recorded disappeared.
**Solution:** If the host team regenerated pairings, all match data including results would have been cleared. Contact the host team if this happened unexpectedly.

> **Note:** MatSide tracks match results for meet records. Results do not feed into automatic standings or rankings — those are managed outside the app.

## Related articles

- [Understanding the Pairings Screen](/guides/meet-day/understanding-pairings-screen)
- [Handling Scratches](/guides/meet-day/handling-scratches)
`,
      },
    ],
  },
  {
    title: 'League Management',
    slug: 'league-management',
    description: 'For league organizers who manage multiple teams across a season.',
    icon: 'Shield',
    sort_order: 6,
    articles: [
      {
        title: 'What is a League?',
        slug: 'what-is-a-league',
        excerpt: 'Understand how leagues work and when to use them.',
        sort_order: 1,
        content: `# What is a League?

A **league** in MatSide is an organization that groups multiple wrestling teams together under a single umbrella for a season. If you run a regional circuit, a school district program, or any recurring multi-team competition, a league helps you manage it all in one place.

## What leagues do

- **Bring multiple teams together** — League member teams can see each other and participate in league-scheduled meets.
- **Centralize meet scheduling** — The league organizer creates the season schedule, and participating teams receive their meets automatically.
- **Manage membership** — The league organizer controls which teams are in the league using invitation codes.
- **Provide a unified season view** — Team managers in the league see league-assigned meets alongside their independently organized meets.

## League Mode vs. Team Mode

MatSide has two modes:

- **Team Mode** — For managing your team's roster, hosting and attending meets, and configuring team settings. Every coach uses this.
- **League Mode** — For managing the league organization itself: adding teams, scheduling meets across the league, and viewing league-wide stats. Only league organizers use this.

You switch between modes using the **context switcher** at the top of the sidebar.

## When to use a league

You should create a league if:
- You coordinate meets between 3 or more teams on a recurring basis.
- You want a single place to manage all team invitations and scheduling for a season.
- You are a district administrator, club director, or regional coordinator.

If you are just a coach who occasionally hosts meets and invites one or two other teams, you do not need a league. The standard meet invitation system in Team Mode is enough.

## Related articles

- [Creating a League](/guides/league-management/creating-a-league)
- [Inviting Teams to Your League](/guides/league-management/inviting-teams-to-league)
`,
      },
      {
        title: 'Creating a League',
        slug: 'creating-a-league',
        excerpt: 'Set up a new league for your organization or region.',
        sort_order: 2,
        content: `# Creating a League

Creating a league sets up your organization in MatSide so you can invite teams, schedule meets, and manage the season. You only need to do this once.

## Before you start

- You need a MatSide account. If you do not have one, see [Creating Your Account](/guides/getting-started/creating-your-account).
- You will be the **league organizer** (owner) after creation.

## Steps

1. After signing up, the **Welcome** screen asks what you want to do. Click **Create a League**.

   If you already have an account, click the **context switcher** at the top of the sidebar and select **Create League**.

2. Fill in the league details:

   - **League Name** — Enter the full name (e.g., *Tri-County Youth Wrestling League*).
   - **Abbreviation** — A short code up to 10 characters (e.g., *TCYWL*). Shown on schedules and team badges.
   - **Description (optional)** — A brief description of the league.
   - **Website (optional)** — Your league's website, if you have one.
   - **League Color** — Pick a color that represents the league.

3. A **preview** at the bottom shows how your league will look.

4. Click **Create League**.

You are taken to the **League Dashboard**.

## After creating your league

Your next steps:

- [Invite teams to join](/guides/league-management/inviting-teams-to-league).
- [Schedule league meets](/guides/league-management/scheduling-league-meets).

> **Tip:** You can update the league name, abbreviation, color, and other settings any time from **League Settings** in the sidebar.

## Troubleshooting

**Problem:** I created a league but I am still seeing my team dashboard.
**Solution:** Use the **context switcher** at the top of the sidebar to switch from Team Mode to League Mode.

## Related articles

- [What is a League?](/guides/league-management/what-is-a-league)
- [Inviting Teams to Your League](/guides/league-management/inviting-teams-to-league)
`,
      },
      {
        title: 'Inviting Teams to Your League',
        slug: 'inviting-teams-to-league',
        excerpt: 'Generate invitation codes or send email invitations to bring teams in.',
        sort_order: 3,
        content: `# Inviting Teams to Your League

Teams join your league using invitation codes that you generate. You can create a single code that multiple teams can use, or create separate codes for each team.

## Before you start

- You must be in **League Mode** in MatSide. Use the context switcher at the top of the sidebar.
- Teams must have a MatSide account to join. If a coach does not have one yet, they need to sign up first.

## Steps to create an invitation code

1. Click **Invitations** in the league sidebar.
2. Click **Create Invitation**.
3. Set the options:
   - **Max Uses** — How many teams can redeem this code. Set to 1 for a single-team invite, or higher to share one code with multiple teams.
   - **Expires In (days)** — How many days until the code expires. Default is 7 days.
4. Click **Create Invitation**.

The new code appears in the **Active Invitations** table.

## Sharing the invitation

For each active invitation, you have two options:

- **Copy the code** — Click the copy icon next to the code to copy just the invite code. Then paste it into a message to the coach.
- **Copy Message** — Click **Copy Message** to copy a pre-written invitation message. The message includes the code, step-by-step instructions for the coach, and the expiration date.

## How teams redeem the invitation

Coaches who receive the invitation:

1. Go to **matsideapp.com** and create an account (or log in).
2. After creating their team during onboarding, enter the league invite code. Their team will join the league automatically.

## Tracking invitations

The **Active Invitations** table shows the invite code, how many uses remain, and when the code expires.

To delete an invitation before it expires, click the trash icon on the right.

## Troubleshooting

**Problem:** A coach says the invite code is invalid.
**Solution:** Check that the code has not expired and has not hit its max uses limit. Generate a new code if needed.

## Related articles

- [Creating a League](/guides/league-management/creating-a-league)
- [Scheduling League Meets](/guides/league-management/scheduling-league-meets)
`,
      },
      {
        title: 'Scheduling League Meets',
        slug: 'scheduling-league-meets',
        excerpt: 'Organize meets within your league season.',
        sort_order: 4,
        content: `# Scheduling League Meets

As a league organizer, you can schedule meets that include your league's member teams. League meets appear in every participating team's meet list automatically.

## Steps to schedule a league meet

1. Switch to **League Mode** using the context switcher at the top of the sidebar.
2. Click **Meet Schedule** in the sidebar.
3. Click **Schedule Meet** in the top-right corner.
4. Fill in the meet details:
   - **Meet Name** — A clear name that includes the date or round number (e.g., *Round 3 — Feb 15*).
   - **Date** — Select the date from the calendar.
   - **Host Team** — Choose which league team is hosting.
   - **Guest Teams** — Select which other league teams are participating.
5. Click **Create Meet**.

The meet is added to the **Meet Schedule** and immediately visible to all participating teams in their own **Meets** list.

## Host team responsibilities

The host team listed for a meet is responsible for:
- Opening the Attendance panel to confirm their wrestlers.
- Generating and managing pairings.
- Publishing the schedule.

As the league organizer, you schedule the meets but the host team runs them on the day.

## Difference between league meets and independent meets

- **League meets** are created by the league organizer and tied to the league. They appear in the Meet Schedule under League Mode.
- **Independent meets** are created by individual team managers and are not part of the league schedule.

Both types appear in team managers' **Meets** list in Team Mode.

> **Tip:** Communicate your season schedule to all team managers before creating it in MatSide so coaches can confirm available dates.

## Troubleshooting

**Problem:** A team manager says they cannot see the league meet I scheduled.
**Solution:** Confirm their team is an active member of the league (check the **Teams** page). Also confirm they are looking at the **Meets** page in Team Mode.

## Related articles

- [Creating a League](/guides/league-management/creating-a-league)
- [Inviting Teams to Your League](/guides/league-management/inviting-teams-to-league)
- [Creating a Meet](/guides/hosting-a-meet/creating-a-meet)
`,
      },
    ],
  },
];

async function seed() {
  console.log('📚 Seeding MatSide user guides...\n');

  // Clear existing data
  console.log('Clearing existing guides...');
  await supabase.from('guide_articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('guide_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const sectionData of guides) {
    const { articles, ...sectionFields } = sectionData;

    console.log(`\nCreating section: ${sectionFields.title}`);
    const { data: section, error: sectionError } = await supabase
      .from('guide_sections')
      .insert(sectionFields)
      .select()
      .single();

    if (sectionError) {
      console.error(`  ✗ Error creating section: ${sectionError.message}`);
      continue;
    }
    console.log(`  ✓ Section created: ${section.id}`);

    for (const article of articles) {
      const { data: created, error: articleError } = await supabase
        .from('guide_articles')
        .insert({
          ...article,
          section_id: section.id,
          status: 'published',
          visible_to_roles: [],
        })
        .select()
        .single();

      if (articleError) {
        console.error(`    ✗ Error creating article "${article.title}": ${articleError.message}`);
      } else {
        console.log(`    ✓ ${created.title}`);
      }
    }
  }

  console.log('\n✅ Done! User guides seeded successfully.\n');
}

seed().catch(console.error);
