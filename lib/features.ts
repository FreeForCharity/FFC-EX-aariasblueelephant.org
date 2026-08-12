// Season flags for programs that only run part of the year.
//
// Summer Buddy Up: the summer cohort has wrapped. While this is false the
// program is hidden from the Circle of Friends tab switcher, the dashboard
// side nav and the post-sign-in redirect; anyone who lands on
// /circle-of-friends?tab=summer-buddy-up sees an "ended" notice instead of the
// registration wizard. Board members keep full access to the admin console,
// and coaches with an existing team can still open their dashboard.
// Flip to true when next summer's cohort opens — nothing else needs editing.
export const SUMMER_BUDDY_UP_ENABLED = false;
