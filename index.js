const superagent = require("superagent");
const cheerio = require("cheerio");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
const nunjucks = require("nunjucks");
const config = require("./config");
const schedule = require('node-schedule');
const moment = require('moment')

/* 当前工作目录 */
const dir = path.resolve(__dirname);

/**
 * @param {dir} 接收多个文件目录名
 * @return {type} 返回文件目录名所对应的地址
 */
function resolve(...dir) {
    return path.resolve(...dir);
}

async function sendMail(type) {
    const resData = await getAllData(type);

    const njkString = fs.readFileSync(
        resolve(dir, "template/model.html"),
        "utf8"
    );
    //
    const htmlData = nunjucks.renderString(njkString, resData);

    let transporter = nodemailer.createTransport({
        host: config.sendInfo.host,
        port: 587,
        secure: false,
        auth: {
            user: config.sendInfo.user,
            pass: config.sendInfo.pass,
        },
    });

    let info = {
        from: config.sendInfo.user, // sender address
        to: config.emailToArr[0].TO, // list of receivers
        subject: config.sendInfo.subject, // Subject line
        text: "Hello world?", // plain text body
        html: htmlData, // html body
    };

    await transporter.sendMail(info, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendMail(type); //再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静等下一次发送~");
    });
}

//获取天气
async function getWeather() {
    //获取墨迹天气
    let url = `${config.moji_host}${config.PROVINCE}/${config.CITY}`; // 根据配置得到天气url
    let res = await superagent.get(url);
    let $ = cheerio.load(res.text);
    //获取墨迹天气地址
    let addressText = $(".search_default")
        .text()
        .trim()
        .split("， ")
        .reverse()
        .join("-");
    //获取墨迹天气提示
    let weatherTip = $(".wea_tips em").text();
    //  获取现在的天气数据
    const now = $(".wea_weather.clearfix");
    let nowInfo = {
        Temp: now.find("em").text(),
        WeatherText: now.find("b").text(),
        FreshText: now.find(".info_uptime").text(),
    };
    // 循环获取未来三天数据
    let threeDaysData = [];
    $(".forecast .days").each(function (i, elem) {
        // 循环获取未来几天天气数据
        const SingleDay = $(elem).find("li");
        threeDaysData.push({
            Day: $(SingleDay[0])
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            WeatherImgUrl: $(SingleDay[1]).find("img").attr("src"),
            WeatherText: $(SingleDay[1])
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            Temperature: $(SingleDay[2])
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            WindDirection: $(SingleDay[3])
                .find("em")
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            WindLevel: $(SingleDay[3])
                .find("b")
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            Pollution: $(SingleDay[4])
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
            PollutionLevel: $(SingleDay[4]).find("strong").attr("class"),
        });
    });
    return {
        moji: {
            addressText,
            weatherTip,
            nowInfo,
            threeDaysData,
        },
    };
}

//获取one数据
async function getOne() {
    let res = await superagent.get(config.ONE_URL);
    let $ = cheerio.load(res.text); //转化成类似jquery结构
    let todayOneList = $("#carousel-one .carousel-inner .item");
    // 通过查看DOM获取今日句子
    let info = $(todayOneList[0])
        .find(".fp-one-cita")
        .text()
        .replace(/(^\s*)|(\s*$)/g, "");
    let imgSrc = $(todayOneList[0]).find(".fp-one-imagen").attr("src");
    return {
        // 抛出 one 对象
        one: {
            info,
            imgSrc,
        },
    };
}

async function getAllData(type) {
    let oneData = await getOne();
    let weatherData = await getWeather();
    let date = new Date();
    let today = parseTime(date)
    let day1 = moment('2019-01-26', "YYYY-MM-DD");
    let day2 = moment(today, "YYYY-MM-DD");
    let dayNums = day2.diff(day1, 'days');

    const msg = type === 'morning' ? '早安，元气满满的一天开始了喔！' : '元气满满的一天即将结束，准备好明天的衣服，记得早点休息哦！'

    const allData = {
        today: `今天是${today},在一起的第${dayNums}天`,
        describe: msg,
        ...oneData,
        ...weatherData,
    };
    console.log(`今天是${today},在一起的第${dayNums}天`)
    return allData;
}

function parseTime(d) {
    const newDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()

    return newDate;
}

const scheduleCronstyle = () => {
    //秒、分、时、日、月、周几
    console.log('任务开始*******')
    schedule.scheduleJob('59 59 06 * * *', () => {
        console.log('等候早安问候:' + parseTime(new Date()));
        sendMail('morning')
    });
    schedule.scheduleJob('59 59 20 * * *', () => {
        console.log('等候晚安问候:' + parseTime(new Date()));
        sendMail('night')
    });
}
//秒、分、时、日、月、周几
scheduleCronstyle()
