# GraduationChecker
A small node based program to check graduation requirements at a particular school.

## Requirements in order to run.
This program runs on a nodejs server. You will need mssql installed and expressjs in order to run. 
Along with the above you will need to be able to connect to a version of mssql as the database is in a .bacpac format that you can import the database from. You will also need to change your config settings to connect to your own mssql as what is in place is what I used to connect to my own. There are other methods that can be found on the node mssql page here https://www.npmjs.com/package/mssql

>const config = {
    connectionString: "Driver={ODBC Driver 17 for SQL Server};
                       Server={LAPTOP-HBBDN2JI};
                       Database={GraduationChecker};
                       Trusted_Connection={yes};"
};

## Registration Page
You can find the codes for every major/minor from the json files and for bachelor, Science = 1, Arts = 2.
