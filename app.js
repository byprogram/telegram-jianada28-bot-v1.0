var express = require('express');
var mysql = require('mysql');
var request = require('request');
var TelegramBot = require('node-telegram-bot-api');
const cheerio = require('cheerio');

var app = express();


/*配置区开始*/
var pool = mysql.createPool({
    port:3306, //mysql端口
    user     : 'telegram', //mysql用户名
    password : 'telegram', //mysql密码
    database : 'telegram', //mysql数据库
});
var token = '5729674949:AAGTuC5kABOHS4w5uh4toOmQAeyy5LqHlYQ'; //机器人的token
var chatid = -1001836705519; //发送群或用户的id
var periodTime = 10; //每一期开奖的间隔，默认10秒
var inline_keyboard = [ //内联键盘
    [{ text: '点数统计', callback_data: '1' },{ text: '长龙统计', callback_data: '2' }], 
    [{ text: '项目介绍', callback_data: '3' ,url:"https://github.com/byprogram/telegram-kuaisan-bot-v1.0"}],
    [{ text: '联系作者', callback_data: '4' ,url:"https://t.me/byprogram"}]
]
/*配置区结束*/


var a, b, c,daxiao,danshuang,baozi,shunzi,duizi,value,date,resultArray = [],resultid = "0",isfengpan = false;

var server = app.listen(3888, function () {
    /*循环，掷骰子*/
    setInterval(function() {
        date = new Date();
        request.get(`https://www.kuai28.com/portal/api/lottery_details?type=jnd28&limits=30&date=${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}&curr=1`, function (error, response, body) {
            if(error){
				return;
			}
			try {
                var newdata = JSON.parse(body).data.list[0];    
                a = parseInt(newdata['open_code'].split(",")[0])
                b = parseInt(newdata['open_code'].split(",")[1])
                c = parseInt(newdata['open_code'].split(",")[2])
                if (resultid<newdata['full_expect']) {
                    setResult();
                }
            } catch (error) {
                console.log(error);
                
            }
            
            resultid = newdata['full_expect']
        } );
    },1000)
})

/*创建实例对象开始*/
var bot = new TelegramBot(conf.token, {polling: true});
/*创建实例对象结束*/
var resultCount = [
    {value :0},
    {value :0},
    {value :0},
    {value :0},
    {value :0},
    {value :0},
]
var resultdxds = {
    big:0,
    small:0,
    odd:0,
    even:0,
    baozi:0,
    shunzi:0,
    duizi:0
}
var peilv = {
    dxds:2,
    fushi1:4.2,
    fushi2:4.6,
    baozi:88,
    duizi:3.5,
    shunzi:15

}

/*监听新消息，回复群的ID*/
bot.on('message', (msg) => { 
    bot.sendMessage(chatid, `Hi,这个群的id是${msg.chat.id}`)
});


/*监听内联键盘*/
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    switch (callbackQuery.data) {
        case "1":
            resultCount = [
                {value :0},
                {value :0},
                {value :0},
                {value :0},
                {value :0},
                {value :0},
            ]
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                var sql = `SELECT * FROM result ;`;
                connection.query(sql,(error, result)=> {
                    connection.destroy();
                    if (error) throw error;
                    for (let index = 0; index < result.length; index++) {
                        resultCount[result[index].one-1].value++;
                        resultCount[result[index].two-1].value++;
                        resultCount[result[index].three-1].value++;
                    }
                    bot.sendMessage(chatid, `1点:${resultCount[0].value}次\n2点:${resultCount[1].value}次\n3点:${resultCount[2].value}次\n4点:${resultCount[3].value}次\n5点:${resultCount[4].value}次\n6点:${resultCount[5].value}次\n`);
                });
                
            });
            break;
        case "2":
            var dxds = [
                {big:0,last:0,longest:0,id:""},
                {small:0,last:0,longest:0,id:""},
                {odd:0,last:0,longest:0,id:""},
                {even:0,last:0,longest:0,id:""},
            ]
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(`SELECT * FROM result ;`,(error, result)=> {
                    connection.destroy();
                    if (error) throw error;
                    for (let index = 0; index < result.length; index++) {
                        if (result[index].big == 1 && dxds[0].last == 1) {
                            dxds[0].last = result[index].big;
                            dxds[0].big++;
                            if (dxds[0].big > dxds[0].longest) {
                                dxds[0].longest = dxds[0].big;
                                dxds[0].id = result[index].id;
                            }
                        }else if(result[index].big == 1 && dxds[0].last == 0){
                            dxds[0].last = result[index].big;
                            dxds[0].big++;
                            if (dxds[0].big > dxds[0].longest) {
                                dxds[0].longest = dxds[0].big;
                                dxds[0].id = result[index].id;
                            }
                        }else if(result[index].big == 0){
                            dxds[0].last = 0;
                            dxds[0].big = 0;
                        }

                        if (result[index].small == 1 && dxds[1].last == 1) {
                            dxds[1].last = result[index].small;
                            dxds[1].small++;
                            if (dxds[1].small > dxds[1].longest) {
                                dxds[1].longest = dxds[1].small;
                                dxds[1].id = result[index].id;
                            }
                        }else if(result[index].small == 1 && dxds[1].last == 0){
                            dxds[1].last = result[index].small;
                            dxds[1].small++;
                            if (dxds[1].small > dxds[1].longest) {
                                dxds[1].longest = dxds[1].small;
                                dxds[1].id = result[index].id;
                            }
                        }else if(result[index].small == 0){
                            dxds[1].last = 0;
                            dxds[1].small = 0;
                        }

                        if (result[index].odd == 1 && dxds[2].last == 1) {
                            dxds[2].last = result[index].odd;
                            dxds[2].odd++;
                            if (dxds[2].odd > dxds[2].longest) {
                                dxds[2].longest = dxds[2].odd;
                                dxds[2].id = result[index].id;
                            }
                        }else if(result[index].odd == 1 && dxds[2].last == 0){
                            dxds[2].last = result[index].odd;
                            dxds[2].odd++;
                            if (dxds[2].odd > dxds[2].longest) {
                                dxds[2].longest = dxds[2].odd;
                                dxds[2].id = result[index].id;
                            }
                        }else if(result[index].odd == 0){
                            dxds[2].last = 0;
                            dxds[2].odd = 0;
                        }

                        if (result[index].even == 1 && dxds[3].last == 1) {
                            dxds[3].last = result[index].even;
                            dxds[3].even++;
                            if (dxds[3].even > dxds[3].longest) {
                                dxds[3].longest = dxds[3].even;
                                dxds[3].id = result[index].id;
                            }
                        }else if(result[index].even == 1 && dxds[3].last == 0){
                            dxds[3].last = result[index].even;
                            dxds[3].even++;
                            if (dxds[3].even > dxds[3].longest) {
                                dxds[3].longest = dxds[3].even;
                                dxds[3].id = result[index].id;
                            }
                        }else if(result[index].even == 0){
                            dxds[3].last = 0;
                            dxds[3].even = 0;
                        }
                    }
                    bot.sendMessage(chatid, `大：${dxds[0].longest}次,${dxds[0].id}期\n小：${dxds[1].longest}次,${dxds[1].id}期\n单：${dxds[2].longest}次,${dxds[2].id}期\n双：${dxds[3].longest}次,${dxds[3].id}期\n`);
                });
            });
            break;
        default:
            break;
    }
});

/*获取开奖的期数*/
function getResultID() {
    date = new Date();
    return `${date.getFullYear()}${date.getMonth()+1}${date.getDate()}${date.getHours()*60+date.getMinutes()}${(date.getSeconds()<10?"0"+date.getSeconds():date.getSeconds())}`
}

function setResult() {
    isfengpan = false;
    value = a+b+c;
    /*初始化*/
    resultdxds = {
        big:0,
        small:0,
        odd:0,
        even:0,
        baozi:0,
        shunzi:0,
        duizi:0
    }
    baozi = "";
    shunzi = "";
    duizi = "";
    daxiao = "";
    danshuang = "";

    if  (c-b==1 && b-a==1) {
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }
    if  (c-a==1 && b-c==1) {
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }
    if  (a-b==1 && c-a==1) {
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }
    if  (b-a==1 && a-c==1) {
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }
    if  (a-b==1 && b-c==1) {
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }
    if  (a-c==1 && c-b==1) { 
        resultdxds.shunzi = 1;
        shunzi = "顺子";
    }

    if  (a==b && b!=c) {
        resultdxds.duizi = 1;
        duizi = "对子";
    }
    if  (b==c && c!=a) {
        resultdxds.duizi = 1;
        duizi = "对子";
    }
    if  (a==c && c!=b) {
        resultdxds.duizi = 1;
        duizi = "对子";
    }


    if (a==b && b==c && c==a) { //如果是豹子
        resultdxds.baozi = 1;
        baozi = "豹子";
    } 
    
    /*大小*/
    if(value>13){
        resultdxds.big = 1;
        daxiao = "大";
    }
    if(value<=13){
        resultdxds.small = 1;
        daxiao = "小";
    } 
    /*单双*/
    if(value%2==1){
        resultdxds.odd = 1;
        danshuang = "单";
    }
    if(value%2==0){
        resultdxds.even = 1;
        danshuang = "双";
    }
    
    var allResultMessage = "";
    var allResultSql = "";
    for (let index = 0; index < resultArray.length; index++) {
        var allResult = resultArray[index];
        if (allResult.guess=="大" || allResult.guess=="小" || allResult.guess=="单" || allResult.guess=="双") {
            if (allResult.guess==daxiao || allResult.guess==danshuang) {
                if (value==13 || value==14){
                    if (allResult.amount<10000) {
                        allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(1.6*allResult.amount).toFixed(2)} ${conf.coin}\n`
                        allResultSql = `${allResultSql}update bet set result = ${1.6*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${1.6*allResult.amount} where telegramid = "${allResult.telegramid}";`
                    } else {
                        allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(allResult.amount).toFixed(2)} ${conf.coin}\n`
                        allResultSql = `${allResultSql}update bet set result = ${allResult.amount} where id = ${allResult.id};update users set balance = balance + ${allResult.amount} where telegramid = "${allResult.telegramid}";`
                    }
                }else {
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['dxds']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${peilv['dxds']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['dxds']*allResult.amount} where telegramid = "${allResult.telegramid}";`
                } 
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="大单"){
            if (value==15 || value==17 || value==19 || value==21 || value==23 || value==25) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['fushi1']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['fushi1']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['fushi1']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="小双"){
            if (value==2 || value==4 || value==6 || value==8 || value==10 || value==12) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['fushi1']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['fushi1']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['fushi1']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="大双"){
            if ( value==14 || value==16 || value==18 || value==20 || value==22 || value==24 || value==26) {
                if(value==14 && allResult.amount<10000){
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(1.6*allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${1.6*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${1.6*allResult.amount} where telegramid = "${allResult.telegramid}";`
                }else if(value==14 && allResult.amount>=10000){
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${allResult.amount} where id = ${allResult.id};update users set balance = balance + ${allResult.amount} where telegramid = "${allResult.telegramid}";`
                }else{
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['fushi2']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${peilv['fushi2']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['fushi1']*allResult.amount} where telegramid = "${allResult.telegramid}";`
                }
                
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="小单"){
            if (value==1 || value==3 || value==5 || value==7 || value==9 || value==11 || value==13) {
                if(value==13 &&  allResult.amount<10000){
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(1.6*allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${1.6*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${1.6*allResult.amount} where telegramid = "${allResult.telegramid}";`
                }else if(value==13 &&  allResult.amount>=10000){
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${allResult.amount} where id = ${allResult.id};update users set balance = balance + ${allResult.amount} where telegramid = "${allResult.telegramid}";`
                }else{
                    allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['fushi2']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                    allResultSql = `${allResultSql}update bet set result = ${peilv['fushi2']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['fushi1']*allResult.amount} where telegramid = "${allResult.telegramid}";`
                }
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="豹子"){
            if (a==b && b==c && c==a) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['baozi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['baozi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['baozi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="顺子"){
            if(c-a==1 && b-c==1) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else if  (a-b==1 && c-a==1) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else if  (b-a==1 && a-c==1) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else if  (a-b==1 && b-c==1) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else if  (a-c==1 && c-b==1) { 
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else if  (c-b==1 && b-a==1) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['shunzi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['shunzi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['shunzi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
        if (allResult.guess=="对子"){
            if  (c==b || b==a || a==c) {
                allResultMessage = `${allResultMessage}@${allResult.name}: 中奖${(peilv['duizi']*allResult.amount).toFixed(2)} ${conf.coin}\n`
                allResultSql = `${allResultSql}update bet set result = ${peilv['duizi']*allResult.amount} where id = ${allResult.id};update users set balance = balance + ${peilv['duizi']*allResult.amount} where telegramid = "${allResult.telegramid}";`
            }else{
                allResultSql = `${allResultSql}update bet set result = 0 where id = ${allResult.id};`
            }
        }
    
    }
    if (resultArray.length==0 || allResultMessage=="") {
        allResultMessage = `${allResultMessage}🈚人中奖\n `;
    }
    
    pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(`INSERT INTO result (id , one ,two ,three ,big ,small ,odd ,even ,baozi,shunzi,duizi,result_time ) VALUES ("${resultid}",${a},${b},${c},${resultdxds.big},${resultdxds.small},${resultdxds.odd},${resultdxds.even},${resultdxds.baozi},${resultdxds.shunzi},${resultdxds.duizi},now());${allResultSql}`,(error, result)=> {
            if (error) throw error;
            connection.query(`SELECT * FROM result order by result_time desc LIMIT 10;`,(error, result)=> {
                if (error) throw error;
                connection.destroy()
                var historyResult ="";
                for (let index = 0; index < result.length; index++) {
                    historyResult = `${historyResult}${result[index].id}期：${result[index].one}+${result[index].two}+${result[index].three}=${result[index].one+result[index].two+result[index].three} (${(result[index].big==1?"大":"")}${(result[index].small==1?"小":"")}${(result[index].odd==1?" 单":"")}${(result[index].even==1?" 双":"")}${(result[index].baozi==1?" 豹子":"")}${(result[index].shunzi==1?" 顺子":"")}${(result[index].duizi==1?" 对子":"")})\n`;
                }
                bot.sendMessage(chatid, `${resultid}期开奖：\n${a} + ${b} + ${c} = ${a+b+c} (${baozi}${daxiao} ${danshuang}${(shunzi==""?shunzi:" "+shunzi)}${(duizi==""?duizi:" "+duizi)})\n➖➖➖➖➖➖➖➖➖➖➖➖➖\n${resultid}期中奖名单：\n${allResultMessage}➖➖➖➖➖➖➖➖➖➖➖➖➖\n开奖历史 (最近10期)：\n${historyResult}`,{
                    reply_markup: {
                    inline_keyboard: conf.inline_keyboard
                    }
                }).then(res=>{
                    bot.sendMessage(chatid, `${parseInt(resultid)+1}期\n下注开始\n下注格式为：单1000 大单2000\n➖➖➖➖ 限额与赔率 ➖➖➖➖\n大小单双（10-20000）\n对子（10-5000）3.5倍\n顺子（10-5000）15倍\n豹子（10-5000）88倍\n🔥大小单双2.0🔥\n🔥小单大双4.6🔥\n🔥大单小双4.2🔥\n⚠️遇13/14单期单注1w以内（不包含1万）大小单双赔1.6\n单期单注超过1w的 大小单双保本\n➖➖➖➖➖➖➖➖➖➖➖➖➖\n总注10万封顶！ 当期最高赔付66W`);
                })
            });
        });
    });
    
    
    
}