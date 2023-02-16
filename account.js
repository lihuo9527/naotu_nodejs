const express = require('express');
var router = express.Router();
var { exec, sql, transaction } = require("./connect-db");
var msg = require("./message");
const fs = require('fs');
const AliPaySdk = require('alipay-sdk').default;
const AlipayForm = require('alipay-sdk/lib/form').default;
const alipaySdk = new AliPaySdk({
    appId: '2021003143629291',
    signType: 'RSA2',
    gateway: "https://openapi.alipay.com/gateway.do",
    privateKey: 'MIIEowIBAAKCAQEAwjrXdGlMTn8rofJOYgYjMaFIo55JTHpPOcufWqa8tOFc740cbezUY73tIPVRbihZ+JJA7wI7evo4+Cmh3RlxBcvJfZ8xqWl3FHnu/agaUlcZQTlTneS1NZdYQBcV+5A8yBhnOc6pABhE22tFWk4Bc+TU5Y1moCPnlQMIzSPCz5OZjQCwXWn1g1fM9Pmm1TvtsqwRj9wcBngW7lPzaP0Xt7SKYKD5ipkNgw6gSLdPY/owWKxUbYywGh53LzCiLMuybPi8zH758N9w0waeWs9+6woSyJLlmCzaTpya7FHIbvtG5KBNpmjLqYjOtMLbHrO5KzhSn7itavdRTLIFmJwshQIDAQABAoIBAQC0LpwDXU+xnl3e3YcDfogVmXZmeweqj+iBSDmrgfSbpFlvzStreoHJib66jXmeRIa6hwr/7sU5H3nMFesXzmtAIj3ocM9ERxd2AmvIGrNYYX6HOGQunKXScnUm94OoHLWWNrVENkgnU1xFZS0wSh8k4UrzLQrgUo6aePcoPx2RK89Iy/kU5bM/vmGKkbk1Tzq22PO/uUUzdt6zqoxr4tnGxsy0qHJhsikyLZjdUYpepZa/R748CLO90zc0+wKM4wGmKbHc3IK3+skU3GgFjTH5Daxf32SUR2G8C+lHej86a2/cNcgteAii9xUu9mt/99aXfQthIyYCQsvw6EIVPLI9AoGBAPZKb2M+ibHg8TCBpzev/z2sRhuYl0ykAaS+IGe9/7xaaGGFGrPeE5uehFFOLk/M5dUVBifTZYaURhdhvPay/Sf4R+u/IFxnG9J5gy2sV/VcdhmlwzXNfBxCeXJupcn4B2yYNH0wv8sURDBbHXgpaYW4BbvfjP84NEjV2XTccBNnAoGBAMnjAhLaX11Vt2wesHkyQ2MDudLP1Lql2u0UnI+YPx4KdzmWy9d8oEfFdjKnRTgyzzorHplbodwW5H4aJ1XdFLgJS2JWSQmB+fMLvTdU3JJaJKtG9zLEnU45sMfXHTJVeXMg6+uHhFoCui1rCKk85n8yDPiBnR31NuC/9dajutkzAoGALxxd4iX8QMI+YIDsc4J+2FUzs+OkTUyx48laeX2mhWjlvoGvcehw57uSo9rIkQsoi3HSE5wkN3H1VlOjyazDL/oWB8ovbn1qnQART5M/3/cnwBAtHwWHUACHKpRvsgp3oRYcNDY2+amOwZEsOefx/1oL/rvsRIWDusrtJaVk6tECgYBJ4420vLu+e0rAhZLtKJpFOO3f3DTtgxpXPv32CDDBm+764tgELBa1be3OqC3LXb0+et2eH01kMfS6unO/F0Un/i7a9N2SX0HN1HQSNjrsTZWyIi0DJba1FKRA39hNvb7PhjMSZuznzKu7R7tJxYJO91CL+1Q3zLGjHF6rig0uxQKBgDemkEoFRlySA880K0V/nb58T/fLoomV6/+hL7Q9z3oyspdkIHISrbcg+YEgoa3DWnpHn56nJ+VPpXHNJUTElsFpaujxO0xUxXj7hMwGu8TpiFRQPlD2GpDRUCwN/W371z1Wviy8F278DK3WEhKF8lNd3NOhrQYyneu5rk9JmvoB',
    alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtUpWLM0/1TCbBh7yVIcewGNCfkZBErc/vhHIiicbIokJVjP8iSzxPX+kJF3Vyh/zkyKJ2vylUMb5assuUxxnBfsC/oizi73etSVzpl3NxM3v8JoKWsUuXL29YH25+6X4hO6kaAmH3rtfuAXfyFfSUSab176sUu+50F9FiZ8YjI2gKFwefYPoSnhtlMY6yNU0XZQ+0aNbzG7oblLfCqosEKS91UmbQ8bhppE5zgus01QEU6nVBUI1lKsj7BjqCiLmkeRdXxAvo71odmP6kwR51MWD2sSKN1Rci8BJoCOWPnRI0Upx5s+y+mKSZ+UYXwDhnz51pf/2Vh5LKzzXXQNHgQIDAQAB'
})

var uid = '';
var specialityId = 0;
var expiredTime = null;
var preselectionSpecialityId = 0;
router.all('*', async (req, res, next) => {
    // console.log(req.headers['token']);
    let result = await exec(sql.table('user').where({ token: req.headers['token'] }).select());
    if (result.length === 0) {
        res.send(msg.error('无效的token！'));
        return;
    }
    uid = result[0].id;
    specialityId = result[0].specialityId;
    expiredTime = result[0].expired;
    preselectionSpecialityId = result[0].preselectionSpecialityId;
    res.status(200);
    next();
});

router.post('/zf', async (req, res) => {
    try {
        const formData = new AlipayForm();
        // 下面是官网的测试代码
        formData.setMethod('get');
        formData.addField('return_url', 'https://www.path-brain-map.vip:4000/auth/aliPayCallBack'); //支付成功的回调
        formData.addField('bizContent', {
            outTradeNo: uid + '_' + req.body.id + '_' + new Date().getTime(), // 订单号
            productCode: uid, // 产品码
            totalAmount: '15', // 商品金额
            subject: '课程付费', // 出售商品的标题
            body: '一个月' // 出售商品的内容
        });
        //执行结果
        const result = await alipaySdk.exec('alipay.trade.wap.pay', {}, { formData: formData });
        res.send(msg.success(result));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/userInfo', async (req, res) => {
    try {
        let data = await exec(sql.table('user').where({ token: req.headers['token'] }).select());
        let ref = {}
        if (data.length) {
            ref = { ...data[0] };
            delete ref.password;
            delete ref.token;
        }
        data.length ? res.send(msg.success(ref)) : res.send(msg.error());
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.put('/userInfo', async (req, res) => {
    try {
        let profile = '';
        if (req.body.profile) {
            var imgData = req.body.profile.replace(/^data:image\/\w+;base64,/, '');
            var dataBuffer = Buffer.from(imgData, 'base64');
            //写入文件
            let path = 'assets/images/' + uid + '.png';
            fs.writeFile(path, dataBuffer, async (err) => {
                try {
                    if (err) {

                    } else {
                        profile = path;
                        await exec(sql.table('user').data({
                            userName: req.body.userName,
                            name: req.body.name,
                            age: req.body.age,
                            gender: req.body.gender,
                            address: req.body.address,
                            recipientPhone: req.body.recipientPhone,
                            profile: profile
                        }).where({ token: req.headers['token'] }).update());
                        res.send(msg.success());
                    }
                } catch (e) {
                    res.send(msg.error(e.message));
                }
            });
        } else {
            await exec(sql.table('user').data({
                userName: req.body.userName,
                name: req.body.name,
                age: req.body.age,
                gender: req.body.gender,
                address: req.body.address,
                recipientPhone: req.body.recipientPhone,
                profile: req.body.profile
            }).where({ token: req.headers['token'] }).update());
            res.send(msg.success());
        }
    } catch (e) {
        res.send(msg.error(e.message));
    }
});

router.get('/catalogueList', async (req, res) => {
    try {
        let datas = [];
        let result = await exec(sql.table('user').where({ id: uid }).select());
        if (result.length) {
            let arr = JSON.parse(result[0].bookIds || []);
            // console.log(arr);
            if (arr.length) {
                let records = await exec(sql.table('class').select());
                // console.log(records);
                arr.forEach(item => {
                    records.forEach(record => {
                        if (item == record.bookId) {
                            datas.push(record);
                        }
                    })
                });
            }
        }
        res.send(msg.success(datas));
    } catch (e) {
        res.send(msg.error(e));
    }
});


router.get('/note', async (req, res) => {
    try {
        // console.log(req.query);
        let data = await exec(sql.table('note').where({
            catalogueId: req.query.catalogueId,
            userId: uid
        }).select());
        data.length ? res.send(msg.success(data[0])) : res.send(msg.error());
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/noteList', async (req, res) => {
    try {
        // console.log(req.query);
        let data = await exec(sql.table('note').where({
            userId: uid
        }).select());
        res.send(msg.success(data.length ? { serverTime: new Date().getTime(), list: data.map((item) => ({ ...item, reviewTime: JSON.parse(item.reviewTime) })) } : { serverTime: new Date().getTime(), list: [] }));
    } catch (e) {
        res.send(msg.error(e));
    }
});


router.put('/note', async (req, res) => {
    try {
        let data = await exec(sql.table('note').data({
            noteLeft: req.body.noteLeft,
            noteRight: req.body.noteRight,
            noteBottom: req.body.noteBottom,
        }).where({ userId: uid, catalogueId: req.body.catalogueId }).update());
        if (data) {
            res.send(msg.success({}, '编辑成功！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/taskList', async (req, res) => {
    try {
        let data = await exec(sql.table('task').select());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/task', async (req, res) => {
    try {
        let data = await exec(sql.table('nodetask').where({
            userId: uid,
        }).select());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/task', async (req, res) => {
    try {
        let result = await exec(sql.table('nodetask').where({
            userId: uid,
            nodeId: req.body.nodeId,
            taskId: req.body.taskId,
        }).select());
        if (result.length === 0) {
            let data = await exec(sql.table('nodetask').data({
                userId: uid,
                nodeId: req.body.nodeId,
                taskId: req.body.taskId,
                createTime: new Date().getTime()
            }).insert());
            if (data) {
                res.send(msg.success({}, '任务已成功！'));
            }
        } else {
            res.send(msg.error());
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/checkNodeCards', async (req, res) => {
    try {
        let result = await exec(sql.table('memory_card').where({
            userId: uid,
        }).select());
        if (result.length > 0) {
            let data = req.body.nodeIds.map((item) => {
                return {
                    id: item, status: result.filter((ref) => { return ref.nodeId === item })
                }
            });
            res.send(msg.success(data));
        } else {
            res.send(msg.success([]));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/note', async (req, res) => {
    try {
        let result = await exec(sql.table('note').where({
            userId: uid,
            catalogueId: req.body.catalogueId
        }).select());
        if (result.length === 0) {
            let data = await exec(sql.table('note').data({
                userId: uid,
                catalogueId: req.body.catalogueId,
                noteLeft: req.body.noteLeft,
                noteRight: req.body.noteRight,
                noteBottom: req.body.noteBottom,
                createTime: new Date().getTime(),
                bookId: req.body.bookId,
                nodeName: req.body.nodeName,
                reviewTime: JSON.stringify([
                    { noteStatus: false, days: '2', cardStatus: false, finishTime: '' },
                    { noteStatus: false, days: '4', cardStatus: false, finishTime: '' },
                    { noteStatus: false, days: '8', cardStatus: false, finishTime: '' },
                    { noteStatus: false, days: '16', cardStatus: false, finishTime: '' }
                ]),
            }).insert());
            if (data) {
                res.send(msg.success({}, '添加成功！'));
            }
        } else {
            res.send(msg.error('添加失败'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/reviewNote', async (req, res) => {
    try {
        let result = await exec(sql.table('note').where({
            userId: uid,
            catalogueId: req.body.catalogueId
        }).select());
        console.log(result[0].reviewTime);
        let data = await exec(sql.table('note').data({
            reviewTime: JSON.stringify(JSON.parse(result[0].reviewTime).map((item, index) => {
                return index === 0 ? {
                    ...item, noteStatus: true, finishTime: new Date().getTime()
                } : {
                    ...item, noteStatus: true
                };
            })),
        }).where({
            userId: uid,
            catalogueId: req.body.catalogueId
        }).update());
        if (data) {
            res.send(msg.success({}, '已完成回顾！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/memoryCard', async (req, res) => {
    try {
        let data = await exec(sql.table('memory_card').data({
            userId: uid,
            nodeId: req.body.nodeId,
            problem: req.body.problem,
            answer: req.body.answer,
            bookId: req.body.bookId,
            nodeName: req.body.nodeName
        }).insert());
        if (data) {
            res.send(msg.success({}, '添加成功！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/memoryCard', async (req, res) => {
    try {
        let data = await exec(sql.table('memory_card').where({
            userId: uid,
            nodeId: req.query.nodeId
        }).select());
        res.send(msg.success(data || []));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/finishReviewCard', async (req, res) => {
    try {
        let result = await exec(sql.table('note').where({
            userId: uid,
            catalogueId: req.body.nodeId
        }).select());
        console.log(result[0].reviewTime);
        let data = await exec(sql.table('note').data({
            reviewTime: JSON.stringify(JSON.parse(result[0].reviewTime).map((item, index) => {
                return item.days == req.body.day ? { ...item, cardStatus: true } : { ...item };
            })),
        }).where({
            userId: uid,
            catalogueId: req.body.nodeId
        }).update());
        if (data) {
            res.send(msg.success({}, '记忆卡复习已完成！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/currentBook', async (req, res) => {
    try {
        let data = await exec(sql.table('book').where({
            bookId: req.query.bookId
        }).select());
        res.send(msg.success(data[0] || {}));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/books', async (req, res) => {
    try {
        let data = await exec(sql.table('book').select());
        res.send(msg.success(data || []));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/speciality', async (req, res) => {
    try {
        let data = await exec(sql.table('speciality').where({ id: req.query.id }).select());
        res.send(msg.success(data[0]));
    } catch (e) {
        res.send(msg.error(e));
    }
});


router.get('/currentSpecialityId', async (req, res) => {
    try {
        res.send(msg.success({ id: specialityId }));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/specialityAmount', async (req, res) => {
    try {
        let data = await exec(sql.table('user').where({ specialityId: req.query.id }).select());
        res.send(msg.success({ length: data.length }));
    } catch (e) {
        res.send(msg.error(e));
    }
});
function _slice(arr, i) {
    array = [];
    arr.forEach((data, index) => {
        if (index <= i) array.push(data);
    });
    return array;
}
router.get('/chatRecord', async (req, res) => {
    try {
        let data = await exec(sql.table('chat').where({ specialityId: req.query.id }).select());
        let index = '';
        if (data.length === 0) {
            res.send(msg.success([]));
            return;
        }
        let findIndex = req.query.index == 0 ? data[data.length - 1].id : req.query.index;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id == findIndex) {
                index = i;
                break;
            }
        }
        console.log(index);
        let arr = [];
        if (index > 0) {
            arr = index < 5 && index > 0 ? _slice(data, index) : data.slice(index - 5, index + 1);
        }
        res.send(msg.success(arr));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/report', async (req, res) => {
    try {
        let data = await exec(sql.table('report').data({
            chatId: req.body.chatId,
            reportValue: JSON.stringify(req.body.reportValue),
        }).insert());
        if (data) {
            res.send(msg.success({}, '提交成功！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/JoinChat', async (req, res) => {
    try {
        let data = await exec(sql.table('user').data({
            isJoinChat: 1,
        }).where({ id: uid }).update());
        if (data) {
            res.send(msg.success({}, '已加入！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/cancel', async (req, res) => {
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
        let data = await exec(sql.table('user').data({ disabled: 1 }).where({ id: uid }).update());
        data.changedRows ? res.send(msg.success({}, '注销成功！')) : res.send(msg.error('注销失败！'));
    } catch (e) {
        res.send(msg.error());
    }
});

router.post('/feedback', async (req, res) => {
    try {
        let data = await exec(sql.table('feedback').data({
            id: req.body.id,
            type: req.body.type,
            qqNumber: req.body.qqNumber,
            text: req.body.feedback
        }).insert());
        if (data) {
            res.send(msg.success({}, '已成功提交！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/specialityName', async (req, res) => {
    try {
        if (!specialityId) {
            res.send(msg.error('目前还没有开通课程！'));
            return;
        }
        let data = await exec(sql.table('speciality').where({ id: specialityId }).select());
        res.send(msg.success(data[0]));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/bookList', async (req, res) => {
    try {
        if (!specialityId) {
            res.send(msg.error('目前还没有开通课程！'));
            return;
        }
        let data = await exec(sql.table('book').where({ specialityId: specialityId }).select());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/notesByBook', async (req, res) => {
    try {
        let data = await exec(sql.table('note').where({
            userId: uid,
            bookId: req.query.bookId
        }).select());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/cardsByBook', async (req, res) => {
    try {
        let data = await exec(sql.table('memory_card').where({
            userId: uid,
            bookId: req.query.bookId
        }).select());
        res.send(msg.success(data || []));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/subjectList', async (req, res) => {
    try {
        let data = await exec(sql.table('subject').select());
        res.send(msg.success(data || []));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/specialityBySubject', async (req, res) => {
    try {
        let data = await exec(sql.table('speciality').select());
        res.send(msg.success(data || []));
    } catch (e) {
        res.send(msg.error(e));
    }
});


router.get('/specialityInfo', async (req, res) => {
    try {
        let data = await exec(sql.table('speciality').where({ id: req.query.id }).select());
        res.send(msg.success(data[0] || {}));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/bookBySpeciality', async (req, res) => {
    try {
        let data = await exec(sql.table('book').where({ specialityId: req.query.id }).select());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.put('/memoryCard', async (req, res) => {
    try {
        let data = await exec(sql.table('memory_card').data({
            problem: req.body.problem,
            answer: req.body.answer,
            id: req.body.id,
        }).where({
            userId: uid,
            nodeId: req.body.nodeId,
        }).update());
        if (data) {
            res.send(msg.success({}, '编辑成功！'));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/checkExpiredStatus', async (req, res) => {
    try {
        if (expiredTime) {
            if (new Date(Number(expiredTime)) - new Date() > 0) {
                res.send(msg.success({ status: false, value: Number(expiredTime) }));
            } else {
                res.send(msg.success({ status: true, value: Number(expiredTime) }));
            }
        } else {
            res.send(msg.success({ status: true, value: null }));
        }
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.get('/preselectionSpecialityId', async (req, res) => {
    try {
        res.send(msg.success({ specialityId: preselectionSpecialityId }));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/preselectionSpecialityId', async (req, res) => {
    try {
        // let book = await exec(sql.table('book').where({ specialityId: Number(req.body.preselectionSpecialityId) }).select());
        // let data = await exec(sql.table('user').data({ preselectionSpecialityId: req.body.preselectionSpecialityId, specialityId: Number(req.body.preselectionSpecialityId), bookIds: JSON.stringify(book.map((item)=> (item.bookId))) }).where({ id: uid }).update());
        let data = await exec(sql.table('user').data({ preselectionSpecialityId: req.body.preselectionSpecialityId }).where({ id: uid }).update());
        res.send(msg.success(data));
    } catch (e) {
        res.send(msg.error(e));
    }
});

router.post('/payCallBack', async (req, res) => {
    try {
        let date = new Date();
        let fff = new Date(date.setDate(date.getDate() + 30));
        // let diff = '';
        // let time = '';
        // if (expiredTime) {
        //     time = new Date(Number(expiredTime));
        //     diff = time - date; diff > 0 ? `${new Date(time.setDate(time.getDate() + 30)).getTime()}` : 
        // }
        let book = await exec(sql.table('book').where({ specialityId: req.body.id }).select());
        let data = await exec(sql.table('user').data({ expired: `${fff.getTime()}`, specialityId: req.body.id, bookIds: JSON.stringify(book.map((item) => (item.bookId))) }).where({ id: uid }).update());
        res.send(msg.success('已成功支付！'));
    } catch(e) {
        res.send(msg.error(e));
    }
});

const timeCount = (date) => {
    let nowTime = new Date().getTime();
    let dateDiff = Math.floor((nowTime - new Date(date).getTime()) / 1000 / 60);
    return dateDiff;
}
module.exports = router;