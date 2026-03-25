DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db;
USE library_db;

SOURCE schema



LOAD DATA LOCAL INFILE 'data/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(UserID, Password, FirstName, LastName, Email, Balance);

