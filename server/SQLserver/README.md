Set up a local server on port 3306 or desired port
run mysql in terminal located in this folder
input SOURCE load_all.sql to load server

SET GLOBAL local_infile=1; DROP DATABASE IF EXISTS library_db; CREATE DATABASE library_db; USE library_db; SOURCE schema.sql; SOURCE procedures/queries.sql; SOURCE procedures/user_procedures.sql; SOURCE procedures/triggers.sql; SOURCE procedures/checkout_hold_procedures.sql; SOURCE load_all.sql;
