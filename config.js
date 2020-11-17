/*
 * @Descripttion : 配置发送人接受人信息
 * @Author       : junlan.he
 * @Date         : 2020-10-18
 */
const config = {
    moji_host: "https://tianqi.moji.com/weather/china/", // 中国墨迹天气url,
    ONE_URL: "http://wufazhuce.com/", //ONE的web版网站
    CITY: "shenzhen", // 墨迹天气市
    PROVINCE: "guangdong", // 墨迹天气省
    // 发送人信息
    sendInfo: {
        host: "smtp.sina.cn",
        user: "****@sina.cn", //账号
        pass: "*****", //密码-授权码
        subject: "今日份暖心邮件", //邮件主题
    },

    //收信人信息
    emailToArr: [
        {
            TO: "****", // 接收者邮箱地址
        },
    ],
};

module.exports = config;
