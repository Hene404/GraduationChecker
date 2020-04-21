const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql/msnodesqlv8');
const config = {
    connectionString: "Driver={ODBC Driver 17 for SQL Server};Server={LAPTOP-HBBDN2JI};Database={GraduationChecker};Trusted_Connection={yes};"
};


var sci_maj = require('./json/majors.json')
var sci_min = require('./json/minors.json')

var text = ""

app.use(bodyParser.urlencoded({extended: false}));

app.use('/css',express.static(__dirname+'/css'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

const server = app.listen(8080, function(){
    console.log("Server running.");
});

app.post('/register', function(req, res){
    var html = '<head><title></title>Registration</head><body><form action= "/reg_complete" method="POST"><label for="username">Username:</label>';
    html = html + '<input type="text" id="username" name = "username"><br><br><label for="email">Email Address</label><input type="text" id = "email" name = "email"><br><br><label for="password">Password:</label><input type="text" id="password" name = "password"><br><br>';
    html = html + '<label for="Bachelor">Bachelor:</label><input type="text" id = "Bach" name = "Bach"><br><br>';
    html = html + '<label for="major">Major</label><input type="text" id = "major" name = "major"><br><br><label for="minor">Minor</label><input type="text" id = "minor" name = "minor"><br><br>';
    html = html + '<input type="submit" id="query" value="Register"/></form>';
    res.send(html)
});

app.post('/reg_complete', function(req, res){
    var html;
    var num;
    sql.connect(config, function(err){
        if(err){
            console.log(err);
        }
        var readerObject = new sql.Request();
        var queryString = 'select count(*) as num from student';
        readerObject.query(queryString, function(err, data){
            if(err){
                console.log(err);
            }
            id_num = data.recordset[0].num + 1;
            readerObject = new sql.Request();
            queryString =  "insert into student values(" + id_num + ", '" + req.body.username + "', '" + req.body.password + "', '" + req.body.email + "', " + req.body.major + ", " + req.body.minor + ", " + req.body.Bach + ")";
            readerObject.query(queryString, function(err, data){
                if(err){
                    console.log(err);
                    html = 'Failed to create an account.';
                }
                else{
                html = 'Succesfully created an account.';
                }
                res.send(html);
                sql.close();
            })
            
        });
    })
});

app.post('/edit_user', function(req, res){
    if(req.body.selection != 'added' && req.body.selection != "deleted"){
        res.send("No selection given, please go back and try again.")
    }
    else if(req.body.course_list.trim() == ''){
        res.send("No courses given in the textbox, please go back and try again.")
    }
    else{
    var value_changed = "The following courses have been " + req.body.selection + ":" + req.body.course_list;
    var courses = req.body.course_list.split(" ");


    sql.connect(config, function(err){
        if (err){
            console.log(err);
        }
        var readerObject = new sql.Request();
        var queryString;
        var ids = [];
        var head = courses[0].slice(0, 4);
        var num = courses[0].slice(5, );

        queryString = "select classid from classes where classlevel =" + num  + " and dept = '" + head + "';";
        readerObject.query(queryString, function(err, data){
            if(err){
                console.log(err);
            }
            var x = data.recordset[0].classid;
            ids.push(x);
            if(req.body.selection == 'added'){
                const table = new sql.Table('takes');
                table.create = true;
                table.columns.add('StudentID', sql.Int);
                table.columns.add('classID', sql.Int);
                queryString = "insert into takes values ?";
                for(i=0; i<ids.length; i++){
                    table.rows.add(parseInt(req.body.user, 10), ids[i])
                }
                readerObject = new sql.Request();
                readerObject.bulk(table, (err, result) =>{
                    if(err){
                        console.log("Failed to insert");
                    }
                    else{
                        console.log("Succesfully inserted");
                    }
                    sql.close();
                })
            }
            else{
                queryString = "delete from takes where StudentID = " + parseInt(req.body.user, 10) + "  and classID =" + ids[0];
                readerObject = new sql.Request();
                readerObject.query(queryString, function(err, data){
                    if(err){
                        console.log("Failed to delete.");
                    }
                    else{
                        console.log("Successfully deleted.");
                    }
                    sql.close();
                });
            }
            
            });   
    });
    return res.send(value_changed + "<br/> Please login again to see your changes.");
    }
});

app.post('/page', function(req, res){
const username = req.body.username;
const password = req.body.password;
    sql.connect(config, function(err){
        if (err){
            console.log(err);
        }
        var readerObject = new sql.Request();
        var queryString = "select * from student where username = '" + username + "' and hash_pw = '" + password + "'";

        readerObject.query(queryString, function(err, data){
            if(err){
                console.log(err);
            }
            if(data.recordset.length > 0){
                var studentinfo = data.recordset[0];
                var readerObject = new sql.Request();
                var queryString = "select * from takes, classes where takes.classid = classes.classid and studentid = " + data.recordset[0].StudentID;
        
                readerObject.query(queryString, function (err, data){
                    if (err){
                        console.log(err);
                    }
                    let header = '<Head><link rel="stylesheet" type="text/css" href="css/stylesheet.css"/></Head>'
                    let h='<div id="header"><h1>Summary for ' + username + '</h1></div>'
                    let str='<div id="container"><b><div align= "left">Course List</div></b><table style="margin-left:20px;" align="left">';
                    let row = ''
                    let courses = []
                    for(let i=0; i<data.recordset.length; i++){
                        courses[i] = new Course(data.recordset[i].Dept, data.recordset[i].ClassLevel)
                        row = row+ '<tr>' + '<td style= width:100px;">' + courses[i] + '<td>' + '<td style= width:500px;">' + data.recordset[i].ClassName;
                    }

                    str = str + row + '</table><body><b><font size="5">Requirements check</b></font>';

                    var x = studentinfo.StudentID;
                    text = "";
                    text = setup(courses, studentinfo);
                    add_course = '</div><center><form action= "/edit_user" method="post" ><label for="Courses">Input the course you wish to modify.</label><input type="radio" id="Added" name="selection" value="added"><Label for="Add">Add Course</Label><input type="radio" id="deleted" name="selection" value="deleted"><Label for="Delete">Remove Course</Label><br/>'
                    add_course = add_course + '<textarea id="course_list" class="text" name="course_list" rows="40" cols="1" style="height:100px; width:300px;"></textarea><br/><input type="submit" id="modify" value="Push Changes"/><input type="hidden" name="user" value="' + x + '"/></form></center>'
                    res.send(header + h+str+text + "</body>" + add_course);
                    
                    sql.close();
                })
            }
            else{
                res.send('Incorrect username or password, please go back and try again.');
            }
        }) 
    });


function setup(courses, studentinfo){ 
    var clean = courses.slice()
    console.log(clean)
    text = text + "<br/>Total number of courses: " + courses.length + ", 40 is needed.<br/><br/>"
    var major = load_major(studentinfo.majorID)
    var completion = [[],[],[],[],[]];
    text = text + "<u>" + major.dept + " check</u>";
    var missing = missing_comparator(courses, major, completion);
    for(var i = 0; i<missing.length; i++){
        text = text + "Courses in Requirement " + (i+1) + ": " + missing[i].join(", ") + '<br/>'
    }
    text = text + "<br/>"
    console.log("major")


    var minor = load_minor(studentinfo.minorID);
    completion = [[],[],[]];
    text = text + "<u>" + minor.dept + " check</u>";
    console.log("minor");
    missing = missing_comparator(courses, minor, completion);
    for(var i = 0; i<missing.length; i++){
        text = text + "Courses in Requirement " + (i+1) + ": " + missing[i].join(", ") + '<br/>'
    }
    text = text + "<br/>"
    console.log("breadth")
    var SB;
    if(studentinfo[6] == 1){
        SB = ART_BREADTH();
    }
    else{
        SB = SCI_BREADTH();
        completion = [[],[],[],[],[],[],[]];
    }
    
    text = text + "<u>" + SB.dept + " check</u>";
    missing = missing_comparator(clean, SB, completion);
    for(var i = 0; i<missing.length; i++){
        text = text + "Courses in Requirement " + (i+1) + ": " + missing[i].join(", ") + '<br/>'
    }
    text = text + "<br/>"
    return text;
}


class Course {
    constructor(dept, iD) {
        this.dept = dept;
        this.iD = iD;
    }
    toString(){
        return this.dept + '_' + this.iD;
    }
}
class Degree{
    constructor(dept, level, section, requirement_list, req_values){
        this.dept = dept;
        this.level = level;
        this.section = section;
        this.requirement_list = requirement_list;
        this.req_values = req_values;
    }

    total_requirement(){
        return this.requirement_list;
    }
    req_value(){
        return this.req_values;
    }
}

function missing_comparator(user_courses, actual_req, completion){
    var total = actual_req.total_requirement()
    var x = 0;
    var depts;
    //var mis;
    deg_nums = actual_req.req_value();
    for(var i = 0; i<total.length; i++){
        for(var j = 0; j<total[i].length; j++){
            if(total[i][0] == "ANY"){
                depts = total[i].slice()
                depts.splice(0, 1);
                for (const course of user_courses){
                    for(var k =0; k<depts.length; k++){
                        if(course.dept == depts[k]){
                            var ind = user_courses.indexOf(course);
                            completion[i].push(course);
                            user_courses.splice(ind, 1);
                            x = 1;
                            break;
                        }
                    }
                }
            }
            else if(Number.isInteger(total[i][0])){
                j = j+1;

            }
            else{
                for (const item of user_courses){
                    if(item == total[i][j]){
                        var ind = user_courses.indexOf(item);
                        completion[i].push(total[i][j]);
                        user_courses.splice(ind, 1);
                        x = 1;
                        break;
                    }
                }
        }
            if(deg_nums[i]<= completion[i].length){
                break;
            }
        }
    }

    for(const item of user_courses){
        if(item.dept === actual_req.dept){
            var ind = user_courses.indexOf(item);
            var len = completion.length - 1;
            completion[len].push(item)
        }
    }
    //Checks for completion of all requirements, if something is missing, adds a value to z
    var z = 0;
    for(var i = 0; i<completion.length; i++){
        if(deg_nums[i]> completion[i].length){
            z = 1;

            text = text + "<div id= 'red'>Requirement " + (i+1) + " not completed. You need " + deg_nums[i] + 
            " course(s) in this section but only have " + completion[i].length + ".</div>";
            if(Number.isInteger(total[i])){
                for(var j=1; j<total[i].length; j++){
                    text = text + " These courses are valid for this requirement:<br/>" + total[i][0] + "-level " + total[i][j] + "<br/><br/>"; 
                }
            }
            else{
                text = text + "  These courses are valid for this requirement:<br/>" + total[i].join(", ") + "<br/><br/>"; 
            }
        }
    }
    if(z === 0){
        text = text + "<div id= 'green'>" + actual_req.dept + " " + actual_req.level + " under the " + actual_req.section + " section is complete.</div><br/>"
    }
    else{
        text = text + "<div id= 'red'>" + actual_req.dept + " " + actual_req.level + " under the " + actual_req.section + " section is incomplete.</div><br/>"

    }
    return completion;
}

function SCI_BREADTH(){
    var req_list = [["ENGL_102", "ENGL_103"],
                    ["CHEM_101", "CHEM_102", "PHYS_124", "PHYS_144", "PHYS_130"],
                    ["BIOL_107", "BIOL_108", "EASC_101", "EASC_102"],
                    ["MATH_114", "MATH_120", "MATH_125"],
                    ["CMPT_101", "CMPT_103", "STAT_151", "STAT_161", "MATH_114", "MATH_120", "MATH_125"],
                    ["ANY", "ANTH", "ECON", "LING", "POLS", "PSYC", "SOCI"],
                    ["ANY", "CLAS", "COMP", "HIST", "HUMN", "PHIL", "CHIN", "FREN", "GREK", "GERM", "JAPN", "LATN", "SPAN"]]
    req_values = [2, 2, 2, 1, 1, 2, 2, 2];
    const SB = new Degree("Breadth", "level", "general", req_list, req_values);
    return SB;
}

function ART_BREADTH(){
    var req_list = [["ENGL_102", "ENGL_103"],
                    ["ANY", "COMP", "CHIN", "FREN", "GREK", "GERM", "JAPN", "LATN", "SPAN"],
                    ["ANY", "CLAS", "HIST", "HUMN", "PHIL"],
                    ["ANY", "ASTR", "BIOL", "BICM", "BOTN", "CHEM", "CMPT", "EASC", "GENE", "PHYS", "PSYC", "SCIE", "ZOOL"],
                    ["ANY", "ANTH", "ECON", "POLS", "PSYC", "SOCI"],
                    ["ANY", "LING", "PHIL", "MATH", "STAT"],
                    ["ANY", "AGAD", "ARTE", "THAR", "DRMA", "MUSC", "CRWR"]]
    req_values = [2, 2, 2, 2, 2, 1, 1]
    const SB = new Degree("Breadth", "level", "general", req_list, req_values);
    return SB;
}

function load_major(code){
    var req_list = sci_maj.Majors[code-1].Requirements;
    var req_values = sci_maj.Majors[code-1].req_nums;
    const SB = new Degree(sci_maj.Majors[code-1].Dept, "major", sci_maj.Majors[code-1].Name, req_list, req_values);
    return SB
}
function load_minor(code){
    var req_list = sci_min.Minors[code-1].Requirements;
    var req_values = sci_min.Minors[code-1].req_nums;
    const SB = new Degree(sci_min.Minors[code-1].Dept, "minor", 'General', req_list, req_values);
    return SB
}

});