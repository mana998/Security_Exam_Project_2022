DROP ROLE IF EXISTS 'admin_role';
DROP ROLE IF EXISTS 'user_role';
DROP ROLE IF EXISTS 'guest_role';
DROP USER IF EXISTS 'admin';
DROP USER IF EXISTS 'user';
DROP USER IF EXISTS 'guest';

CREATE ROLE 'admin_role', 'user_role', 'guest_role';

-- admin_role --
GRANT ALL ON cooking.* TO 'admin_role';

-- user_role --
GRANT SELECT ON cooking.* TO 'user_role';
GRANT INSERT, UPDATE, DELETE ON cooking.comment TO 'user_role';
GRANT INSERT ON cooking.ingredient TO 'user_role';
GRANT INSERT, UPDATE, DELETE ON cooking.ingredient_has_recipe TO 'user_role';
GRANT INSERT, UPDATE, DELETE ON cooking.recipe TO 'user_role';
GRANT UPDATE, SELECT, DELETE ON cooking.user TO 'user_role';

-- guest_role --
GRANT SELECT ON cooking.comment TO 'guest_role';
GRANT SELECT ON cooking.ingredient TO 'guest_role';
GRANT SELECT ON cooking.ingredient_has_recipe TO 'guest_role';
GRANT SELECT ON cooking.measurement TO 'guest_role';
GRANT SELECT ON cooking.recipe TO 'guest_role';
GRANT SELECT ON cooking.role TO 'guest_role';
GRANT INSERT, SELECT ON cooking.user TO 'guest_role';

-- create users --
CREATE USER 'admin' identified by 'passwordAdmin';
CREATE USER 'user' identified by 'passwordUser';
CREATE USER 'guest' identified by 'passwordGuest';

GRANT 'guest_role' TO 'guest';
GRANT 'user_role' TO 'user';
GRANT 'admin_role' TO 'admin';

-- set default roles
SET DEFAULT ROLE 'guest_role' TO 'guest';
SET DEFAULT ROLE 'user_role' TO 'user';
SET DEFAULT ROLE 'admin_role' TO 'admin';
FLUSH privileges;