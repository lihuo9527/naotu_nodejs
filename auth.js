const express = require('express');
var router = express.Router();
var { exec, sql, transaction } = require("./connect-db");
var msg = require("./message");
const jwt = require('jsonwebtoken');
const jwtKey = 'class';
const { STS } = require('ali-oss');
const SMSClient = require('@alicloud/sms-sdk');

function randomString(len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = $chars.length;
    var pwd = '';
    for (let i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

router.get('/aliPayCallBack', async (req, res) => {
    try {
        let query = req.query.out_trade_no.split('_');
        let result = await exec(sql.table('user').where({ id: Number(query[0]) }).select());
        if (!result[0].expired || result[0].expired && new Date() - new Date(Number(result[0].expired)) > 0) {
            var date = new Date()  //当前日期2021-3-9
            var fff = new Date(date.setDate(date.getDate() + 30));
            let book = await exec(sql.table('book').where({ specialityId: Number(query[1]) }).select());
            let data = await exec(sql.table('user').data({ expired: `${fff.getTime()}`, specialityId: Number(query[1]), bookIds: JSON.stringify(book.map((item) => (item.bookId))) }).where({ id: Number(query[0]) }).update());
            if (data) res.send('已支付成功！');
        } else {
            res.send('已支付成功！');
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/applePayCallBack', async (req, res) => {
    console.log(req.query);
    res.send(req.query);

});

router.post('/signup', async (req, res) => {
    try {
        if (!req.body.phone || !req.body.password) {
            res.send(msg.error('手机号/密码不能为空！'));
            return;
        }
        if (!req.body.verifyCode) {
            res.send(msg.error('验证码不能为空!'));
            return;
        }
        var patt = /^[1][3-9][\d]{9}/;
        if (!patt.test(req.body.phone) || req.body.phone.length !== 11) {
            res.send(msg.error('手机号无效！'));
            return;
        }
        // let date = new Date();
        // let fff = new Date(date.setDate(date.getDate() + 30));
        let verifyResult = await exec(sql.table('verify').where({ phone: req.body.phone, verifyCode: req.body.verifyCode }).select());
        if (verifyResult.length > 0) {
            let selectResult = await exec(sql.table('user').where({ phone: req.body.phone }).select());
            if (selectResult.length === 0) {
                let data = await exec(sql.table('user').data({ phone: req.body.phone, password: req.body.password, userName: `uid_${randomString(15)}` }).insert());
                if (data) {
                    res.send(msg.success());
                }
            } else {
                res.send(msg.error('用户已存在！'));
            }
        } else {
            res.send(msg.error('验证码错误！'));
        }
    } catch (e) {
        res.send(msg.error());
    }
});

router.get('/sts', (req, res) => {
    let sts = new STS({
        // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
        accessKeyId: 'LTAI5tDcboqSitJCNuz5XnKN',
        accessKeySecret: 'FIdUudnPZ9i17hRR5RQUx1aXy94C4r'
    });
    // roleArn填写角色ARN。
    // policy填写自定义权限策略。
    // expiration用于设置临时访问凭证有效时间单位为秒，最小值为900，最大值以当前角色设定的最大会话时间为准。
    // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为SessionTest。
    sts.assumeRole('acs:ram::1268946994178382:role/oss-upload', {
        "Statement": [
            {
                "Action": "oss:*",
                "Effect": "Allow",
                "Resource": "*"
            }
        ],
        "Version": "1"
    }, 900, 'dev').then((result) => {
        res.send(msg.success({
            AccessKeyId: result.credentials.AccessKeyId,
            AccessKeySecret: result.credentials.AccessKeySecret,
            SecurityToken: result.credentials.SecurityToken,
            Expiration: result.credentials.Expiration
        }))
    }).catch((err) => {
        console.log(err);
        res.send(msg.error());
    });
});

router.post('/login', async (req, res) => {
    try {
        if (!req.body.phone || !req.body.password) {
            res.send(msg.error('手机号/密码不能为空！'));
            return;
        }
        var token = jwt.sign({ phone: req.body.phone }, jwtKey);
        let result = await exec(sql.table('user').where({ phone: req.body.phone, password: req.body.password }).select());
        // console.log(result);
        if (result.length === 0) {
            res.send(msg.error('用户名或密码错误！'));
            return;
        }
        if (result[0].disabled === 1) {
            res.send(msg.error('账户已注销！'));
            return;
        }
        let data = await exec(sql.table('user').data({ token }).where({ id: result[0].id }).update());
        data.changedRows ? res.send(msg.success({ token, userName: result[0].phone, name: result[0].userName })) : res.send(msg.error('登录异常！'));;
    } catch (e) {
        res.send(msg.error());
    }
});

router.post('/sendVerifyCode', async (req, res) => {
    try {
        if (!req.body.phone) {
            res.send(msg.error('手机号不能为空！'));
            return;
        }
        let verifyResult = await exec(sql.table('verify').where({ type: req.body.type, phone: req.body.phone }).select());
        if (verifyResult.length > 0 && verifyResult[0].verifyCodeTime && timeCount(verifyResult[0].verifyCodeTime) < 1) {
            res.send(msg.error('验证码发送频繁, 请稍后操作！'));
            return;
        }

        let smsCode = Math.random().toString().slice(-6);
        let accessKeyId = "LTAI5tCNXnjUHeZvnh8rnstL";// AccessKey ID
        let secretAccessKey = "vYPo9NdHXDNKveoLZs2WR30q5kP1ti";// AccessKey Secret
        let signName = "路径脑图"; // 签名名称
        let templateCode = "SMS_243477896";// 短信模板code
        const smsClient = new SMSClient({ accessKeyId, secretAccessKey });
        smsClient.sendSMS({
            PhoneNumbers: req.body.phone,
            SignName: signName, //签名名称 前面提到要准备的
            TemplateCode: templateCode, //模版CODE  前面提到要准备的
            TemplateParam: `{"code":'${smsCode}'}`, // 短信模板变量对应的实际值，JSON格式
        });
        if (verifyResult.length > 0) {
            await exec(sql.table('verify').data({ verifyCodeTime: new Date().getTime(), verifyCode: smsCode }).where({ type: req.body.type, phone: req.body.phone }).update());
        } else {
            await exec(sql.table('verify').data({ type: req.body.type, phone: req.body.phone, verifyCode: smsCode, verifyCodeTime: new Date().getTime() }).insert());
        }
        res.send(msg.success());
    } catch (e) {
        res.send(msg.error());
    }
});

router.post('/resetPassword', async (req, res) => {
    try {
        if (!req.body.phone || !req.body.password || !req.body.verifyCode) {
            res.send(msg.error(!req.body.verifyCode ? '验证码不能为空！' : '手机号/密码不能为空！'));
            return;
        }
        let verifyResult = await exec(sql.table('verify').where({ type: req.body.type, phone: req.body.phone, verifyCode: req.body.verifyCode }).select());
        if (verifyResult.length === 0) {
            res.send(msg.error('验证码错误！'));
            return;
        }
        if (timeCount(verifyResult[0].verifyCodeTime) > 10) {
            res.send(msg.error('验证码已过期！'));
            return;
        }
        let data = await exec(sql.table('user').data({ password: req.body.password }).where({ phone: req.body.phone }).update());
        data.changedRows ? res.send(msg.success({}, '密码重置成功！')) : res.send(msg.error('用户不存在！'));
    } catch (e) {
        res.send(msg.error());
    }
});

const timeCount = (date) => {
    let nowTime = new Date().getTime();
    let dateDiff = Math.floor((nowTime - new Date(date).getTime()) / 1000 / 60);
    return dateDiff;
}

module.exports = router;