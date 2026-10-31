-- Initial Owner account. No password: it's set through "Forgot password?" on the sign-in page.
-- Leaves an existing row with this email untouched.
INSERT INTO "team_members" ("name", "email", "role", "status")
VALUES ('Ajay Badgujar', 'ajayb@secvance.com', 'Owner', 'Active')
ON CONFLICT ("email") DO NOTHING;
