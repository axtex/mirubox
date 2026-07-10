-- Rename table WatchlistEntry → TrackerEntry (preserve data)
ALTER TABLE IF EXISTS "WatchlistEntry" RENAME TO "TrackerEntry";

-- Rename XPAction enum value ADD_TO_ARCHIVE → ADD_TO_TRACKER
ALTER TYPE "XPAction" RENAME VALUE 'ADD_TO_ARCHIVE' TO 'ADD_TO_TRACKER';
