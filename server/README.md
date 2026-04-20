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
SOURCE procedures/transactions.sql;
SOURCE procedures/update_procedures.sql;
SOURCE procedures/scheduling.sql;
SOURCE procedures/triggers.sql;
SOURCE procedures/reports.sql;
SOURCE load_all.sql;

# enumerable SMALLINT reference

1. `users.UserType`
   `0 = Student`, `1 = Faculty`, `2 = Librarian`
2. `users.Status`
   `0 = Blocked`, `1 = Active`, `2 = Removed`
3. `items.ItemCategory`
   `1 = Literature`, `2 = Media`, `3 = Device`
4. `literature.ItemType`
   `1 = Book`, `2 = Textbook`, `3 = Magazine`, `4 = Audiobook`
5. `literature.Genre`
   `0 = Unspecified / Other`
   `1 = Classic`
   `2 = Historical Fiction`
   `3 = Fantasy`
   `4 = Science Fiction / Dystopian`
   `5 = Mystery / Thriller`
   `6 = Romance`
   `7 = Literary / Contemporary`
   `8 = Philosophy / Existential`
   `9 = Adventure`
   `10 = Science / Technology`
   `11 = Business / Economics`
   `12 = Politics / Current Affairs`
   `13 = Biography / Memoir`
   `14 = Arts / Culture`
   `15 = Horror / Gothic`
6. `media.ItemType`
   `1 = DVD / CD`, `2 = Blu-ray`, `3 = Vinyl`
7. `media.Genre`
   `0 = Unspecified / Other`
   `1 = Drama`
   `2 = Crime / Noir`
   `3 = Action / Adventure`
   `4 = Science Fiction / Fantasy`
   `5 = Thriller / Mystery`
   `6 = Comedy`
   `7 = Romance`
   `8 = Documentary / Biography`
   `9 = Horror`
   `10 = Rock / Alternative`
   `11 = Pop`
   `12 = Hip-Hop / Rap`
   `13 = R&B / Soul / Funk`
   `14 = Folk / Country`
   `15 = Jazz / Blues`
   `16 = Classical / Soundtrack`
8. `devices.ItemType`
   `1 = Laptop`, `2 = Tablet`, `3 = Lab Equipment`
9. `copies.CopyStatus`
   `0 = Available`, `1 = On Loan`, `2 = Removed`
10. `holds.HoldStatus`
    `0 = Active`, `1 = Fulfilled`, `2 = Cancelled`
11. `fines.PaidStatus`
    `0 = Unpaid`, `1 = Paid`
12. `notifications.IsRead`
    `0 = Unread`, `1 = Read`
