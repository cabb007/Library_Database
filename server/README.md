# .env file template

To successfully connect to your locally hosted database, you will have to make a file named '.env' with the following variables :
DB_HOST=localhost
DB_PORT=yourport
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdbname

If your DB password contains #, you must put quotations around the password for it to recognize the whole thing, otherwise # is considered the start of a comment.

# running the program

First, make sure you are in the '/client' directory which can be done with the command :
cd client
next, you want to make sure you have all the necessary packages/dependencies installed locally which can be
done with the command :
npm install
afterwards, as long as there are no errors with the installation you can run the express server and then the web
application with their respective commands:
npm start
npm run dev
//note that you will be executing these commands in separate terminals
if there are no issues with connecting to the server and website, in the terminal that you ran 'npm run dev',
you can now type 'o' and press enter to open the web application. In the same terminal, you can stop the hosting of the web application by typing 'q' and pressing enter. To stop the express server, go in the other terminal and press
CTRL + 'C' at the same time on your keyboard.

# copy paste these into the terminal
cd server
cd SQLserver
mysql --local-infile=1 -u root -p

# copy paste these as one line into the mySQL terminal

SET GLOBAL local_infile=1;
DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db;
USE library_db;
SOURCE schema.sql;
SOURCE procedures/queries.sql;
SOURCE procedures/user_procedures.sql;
SOURCE procedures/triggers.sql;
SOURCE procedures/checkout_hold_procedures.sql;
SOURCE procedures/update_procedures.sql;
SOURCE load_all.sql;