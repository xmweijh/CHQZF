window.onload=CurrentTime;
function CurrentTime(){
    var now = new Date();
    var year = now.getFullYear();       //年
    var month = now.getMonth() + 1;     //月
    var day = now.getDate();            //日
    var hh = now.getHours();            //时
    var mm = now.getMinutes();          //分

    var clock = year + " - ";
    if(month < 10)
        clock += "0";
    clock += month + " - ";
    if(day < 10)
        clock += "0";
    clock += day + "&nbsp;&nbsp;&nbsp;";
    if(hh < 10)
        clock += "0";
    clock += hh + " : ";
    if (mm < 10)
        clock += '0';
    clock += mm;
    document.getElementById("time").innerHTML=clock;
    if(hh>=6&&hh<=12){
        document.getElementById("sayhi").innerHTML="Good morning";
        //document.getElementById("myimg").src="morning.jpg";
    }
    else if(hh>=13&&hh<=16){
        document.getElementById("sayhi").innerHTML="Good noon";
        //document.getElementById("myimg").src="noon.jpg";
    }
    else if(hh>=17&&hh<=18){
        document.getElementById("sayhi").innerHTML="Good afternoon";
        //document.getElementById("myimg").src="afternoon.jpeg";
    }
    else{
        document.getElementById("sayhi").innerHTML="Good evening";
        //document.getElementById("myimg").src="night.jpg";
    }
}